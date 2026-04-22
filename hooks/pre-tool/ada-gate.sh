#!/bin/bash
# Ada semantic gate — PreToolUse invariant enforcement.
# Loads .ada/state.json and checks tool calls against compiled invariants.
# Exits 0 (allow), 2 (block). Fail-open when state absent or malformed.

if [ "${ADA_GATE_MODE:-}" = "off" ]; then
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

PROJECT_DIR="${ADA_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(pwd)}}"
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
  if echo "$COMMAND" | grep -qiE ';s*(curl|wget|nc|netcat|python|ruby|perl)s'; then
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
    if [ "${#concept}" -gt 10 ]; then
      SLUG=$(echo "$concept" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g')
      if echo "$CONTENT" | grep -qiF "$concept"; then
        echo "Ada gate [WARN]: content references out-of-scope concept: $concept" >&2
        echo "If intentional, set ADA_GATE_MODE=advisory to suppress." >&2
      fi
    fi
  done <<< "$OUT_OF_SCOPE"
fi

# All checks passed
exit 0
