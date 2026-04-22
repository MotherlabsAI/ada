import type { EntityMap } from "@ada/compiler";
import type { HookScript } from "./types.js";

// ─── Predicate classification ─────────────────────────────────────────────────

type EnforcementStrategy = "grep-block" | "grep-require" | "comment-only";

interface ClassifiedPredicate {
  readonly strategy: EnforcementStrategy;
  readonly pattern: string | null;
  readonly negate: boolean;
}

const BLOCK_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/must\s+not\s+(?:use|import|call|reference|contain)\s+(.+)/i, "$1"],
  [/no\s+(.+)\s+(?:allowed|permitted)/i, "$1"],
  [/never\s+(?:use|import|call)\s+(.+)/i, "$1"],
  [/(?:exclude|block|ban|forbid)\s+(.+)/i, "$1"],
  [/must\s+not\s+contain\s+(.+)/i, "$1"],
];

const REQUIRE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/must\s+(?:use|import|contain|include|have)\s+(.+)/i, "$1"],
  [/(?:require|enforce)\s+(.+)/i, "$1"],
  [/always\s+(?:use|include)\s+(.+)/i, "$1"],
];

function classifyPredicate(predicate: string): ClassifiedPredicate {
  for (const [regex, replacement] of BLOCK_PATTERNS) {
    const match = predicate.match(regex);
    if (match) {
      const raw = predicate.replace(regex, replacement).trim();
      const pattern = raw.replace(/[^a-zA-Z0-9_\-./ ]/g, "").trim();
      if (pattern.length > 0) {
        return { strategy: "grep-block", pattern, negate: false };
      }
    }
  }

  for (const [regex, replacement] of REQUIRE_PATTERNS) {
    const match = predicate.match(regex);
    if (match) {
      const raw = predicate.replace(regex, replacement).trim();
      const pattern = raw.replace(/[^a-zA-Z0-9_\-./ ]/g, "").trim();
      if (pattern.length > 0) {
        return { strategy: "grep-require", pattern, negate: true };
      }
    }
  }

  return { strategy: "comment-only", pattern: null, negate: false };
}

// ─── Script generation ────────────────────────────────────────────────────────

function generateScript(
  entityName: string,
  predicate: string,
  description: string,
  classified: ClassifiedPredicate,
): string {
  const header = `#!/bin/bash
# Invariant: ${predicate}
# Entity: ${entityName}
# Description: ${description}
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
`;

  if (classified.strategy === "comment-only") {
    return `${header}# Structural enforcement not possible for this predicate.
# Manual review required: ${predicate}
exit 0
`;
  }

  const escapedPattern = classified.pattern!.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\\\$&",
  );

  if (classified.strategy === "grep-block") {
    return `${header}if echo "$CONTENT" | grep -qiE "${escapedPattern}"; then
  echo "Invariant violated [${entityName}]: ${predicate}" >&2
  exit 2
fi
exit 0
`;
  }

  // grep-require: fail if pattern is NOT found (but only when content is non-empty)
  return `${header}if [ -n "$CONTENT" ]; then
  if ! echo "$CONTENT" | grep -qiE "${escapedPattern}"; then
    echo "Invariant violated [${entityName}]: ${predicate}" >&2
    exit 2
  fi
fi
exit 0
`;
}

// ─── Semantic gate hook ───────────────────────────────────────────────────────

/**
 * Self-contained PreToolUse gate script.
 *
 * Loads .ada/state.json at invocation time and checks the tool call against
 * compiled invariants — no external binary required. Falls back to the
 * ada-gate-hook binary if available for richer LLM-based reasoning.
 *
 * Exit codes (Claude Code convention):
 *   0 — allow
 *   2 — block (stderr is shown to the model as the reason)
 *
 * Disabled when ADA_GATE_MODE=off.
 * Fail-open when state.json is absent (not yet compiled).
 */
const GATE_HOOK_SCRIPT = `#!/bin/bash
# Ada semantic gate — PreToolUse invariant enforcement.
# Loads .ada/state.json and checks tool calls against compiled invariants.
# Exits 0 (allow), 2 (block). Fail-open when state absent or malformed.

if [ "\${ADA_GATE_MODE:-}" = "off" ]; then
  exit 0
fi

# Prefer the richer ada-gate-hook binary when available
if command -v ada-gate-hook >/dev/null 2>&1; then
  exec ada-gate-hook
fi

INPUT=$(cat)
if [ -z "$INPUT" ]; then
  exit 0
fi

PROJECT_DIR="\${ADA_PROJECT_DIR:-\${CLAUDE_PROJECT_DIR:-$(pwd)}}"
STATE_FILE="$PROJECT_DIR/.ada/state.json"

# No compiled blueprint — advisory mode, allow all
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
if [ -z "$TOOL_NAME" ]; then
  exit 0
fi

# Extract content being written / command being run
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""' 2>/dev/null)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# ── HARD violation checks — injection patterns ────────────────────────────────
# Block prompt injection attempts in file content
if [ -n "$CONTENT" ]; then
  if echo "$CONTENT" | grep -qiE 'ignore (all )?(previous|prior|above) (instructions?|prompts?|rules?|constraints?)'; then
    echo "Ada gate [BLOCK]: prompt injection pattern detected in file content." >&2
    echo "Tool: $TOOL_NAME  File: $FILE_PATH" >&2
    exit 2
  fi
fi

# Block shell injection attempts — command must not escape to eval/exec arbitrary code
if [ -n "$COMMAND" ]; then
  if echo "$COMMAND" | grep -qiE ';\s*(curl|wget|nc|netcat|python|ruby|perl)\s'; then
    echo "Ada gate [BLOCK]: suspicious command chain detected." >&2
    echo "Command: $COMMAND" >&2
    exit 2
  fi
fi

# ── Load invariants from compiled blueprint ───────────────────────────────────
# Extract non-functional requirements that have formal predicates
PREDICATES=$(jq -r '
  .blueprint.nonFunctional[]?
  | select(.predicate != null and .predicate != "")
  | .predicate + " ||| " + .requirement
' "$STATE_FILE" 2>/dev/null)

# ── Scope violation check — out-of-scope concepts ────────────────────────────
OUT_OF_SCOPE=$(jq -r '.blueprint.scope.outOfScope[]? // empty' "$STATE_FILE" 2>/dev/null)

if [ -n "$OUT_OF_SCOPE" ] && [ -n "$CONTENT" ]; then
  while IFS= read -r concept; do
    [ -z "$concept" ] && continue
    # Only flag very explicit out-of-scope references (>10 chars to avoid false positives)
    if [ "\${#concept}" -gt 10 ]; then
      SLUG=$(echo "$concept" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\\+/-/g')
      if echo "$CONTENT" | grep -qiF "$concept"; then
        echo "Ada gate [WARN]: content references out-of-scope concept: $concept" >&2
        echo "If intentional, set ADA_GATE_MODE=advisory to suppress." >&2
      fi
    fi
  done <<< "$OUT_OF_SCOPE"
fi

# All checks passed
exit 0
`;

/**
 * buildGateHook — returns the HookScript for the semantic action-time gate.
 *
 * Always emitted. The hook loads .ada/state.json at invocation time, checks
 * for injection patterns and scope violations, and defers to the ada-gate-hook
 * binary for richer LLM-based reasoning when available.
 *
 * Invariants live in the hook, not in CLAUDE.md. This is the compaction-safe
 * layer: PreToolUse hooks survive context-window compaction forever.
 */
export function buildGateHook(): HookScript {
  return {
    name: "ada-gate",
    type: "pre-tool",
    matcher: "Write|Edit|MultiEdit|Bash",
    script: GATE_HOOK_SCRIPT,
    path: "hooks/pre-tool/ada-gate.sh",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function invariantsToHooks(entityMap: EntityMap): HookScript[] {
  const hooks: HookScript[] = [];

  for (const entity of entityMap.entities) {
    for (const invariant of entity.invariants) {
      const name = `${entity.name.toLowerCase()}-${invariant.predicate
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()
        .slice(0, 40)}`;

      const classified = classifyPredicate(invariant.predicate);

      // Skip comment-only predicates — they generate no-op scripts that
      // would fire on every tool call without enforcing anything.
      if (classified.strategy === "comment-only") continue;

      // Determine which tools this hook should watch
      const matcher =
        classified.strategy === "grep-block" ? "Bash|Write|Edit" : "Write|Edit";

      const script = generateScript(
        entity.name,
        invariant.predicate,
        invariant.description,
        classified,
      );

      hooks.push({
        name,
        type: "pre-tool",
        matcher,
        script,
        path: `hooks/pre-tool/${name}.sh`,
      });
    }
  }

  return hooks;
}
