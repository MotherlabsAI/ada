import type { Blueprint } from "@ada/compiler";
import { callWithExtendedThinking, getApiKey } from "./llm-client.js";

/**
 * semantic-gate — LLM-evaluated action-time gate.
 *
 * This is what makes the substrate binding. On every write tool call,
 * the gate evaluates whether the proposed action violates an invariant,
 * a process precondition, or a bounded-context scope. Returns a verdict
 * that the interceptor translates to ALLOW or DENY.
 *
 * Fail mode:
 *   - No API key → returns ALLOW with fallback reasoning
 *   - LLM call fails / times out → returns ALLOW with fallback reasoning
 *   - Opt-in strict mode (ADA_GATE_STRICT=1) → returns BLOCK on failure
 */

export type GateVerdict = "ALLOW" | "BLOCK" | "AMEND_FIRST";

export interface SemanticGateInput {
  readonly toolName: string;
  readonly filePath?: string;
  readonly content?: string;
  readonly command?: string;
  readonly rationale?: string;
}

export interface SemanticGateResult {
  readonly verdict: GateVerdict;
  readonly violated: readonly string[];
  readonly reasoning: string;
  readonly suggested?: string;
  readonly source: "semantic" | "fallback";
}

export interface SemanticGateOptions {
  readonly thinkingBudget?: number;
  readonly timeoutMs?: number;
  readonly strict?: boolean;
}

const SYSTEM_PROMPT = `You are Ada's action-time gate. You evaluate a single proposed tool call against a compiled blueprint. You return ALLOW, BLOCK, or AMEND_FIRST.

You are NOT checking syntax. You are NOT running the code. You are reasoning about whether this specific tool call, executed against the current substrate, would violate a named invariant, a bounded-context scope, or a workflow precondition.

Verdicts:
- ALLOW: the action preserves all relevant invariants and stays within scope.
- BLOCK: the action clearly violates a named invariant. Return the specific predicate.
- AMEND_FIRST: the action is in the right direction but must be modified first (e.g., add a missing check). Return the amendment.

Calibration:
- Do NOT block on stylistic preferences.
- Do NOT block on speculative future violations.
- DO block on concrete violations: negative value where > 0 is required, removed null check where not-null is invariant, write into a forbidden bounded context.
- When uncertain: ALLOW. False blocks cost user trust more than occasional false allows (there is a postToolUse drift check for those).

Output JSON only. No prose outside the JSON.`;

function buildUserPrompt(
  blueprint: Blueprint,
  input: SemanticGateInput,
): string {
  const relevantEntities = selectRelevantEntities(blueprint, input);
  const entitiesText = relevantEntities
    .map((e) => {
      const invLines = e.invariants
        .map(
          (i) =>
            `    - ${i.predicate}${i.description ? ` (${i.description})` : ""}`,
        )
        .join("\n");
      return `  Entity ${e.name}:\n${invLines || "    (no invariants)"}`;
    })
    .join("\n\n");

  const relevantBCs = blueprint.dataModel.boundedContexts
    .map((bc) => `  - ${bc.name}: ${bc.entities?.join(", ") ?? ""}`)
    .join("\n");

  const actionLine =
    input.toolName === "Bash"
      ? `command: ${truncate(input.command ?? "", 400)}`
      : `path: ${input.filePath ?? "(none)"}\ncontent (truncated):\n${truncate(input.content ?? "", 1200)}`;

  return `# Proposed tool call
tool: ${input.toolName}
${actionLine}
${input.rationale ? `\nagent rationale: ${input.rationale}` : ""}

# Blueprint summary
${blueprint.summary}

# Relevant entities + invariants
${entitiesText || "(no entities loaded)"}

# Bounded contexts
${relevantBCs || "(none)"}

# Task

Return this JSON only:

{
  "verdict": "ALLOW" | "BLOCK" | "AMEND_FIRST",
  "violated": ["<invariant predicate exactly as written in blueprint>"],
  "reasoning": "<one or two sentences>",
  "suggested": "<if AMEND_FIRST, one-sentence amendment; else empty>"
}`;
}

function selectRelevantEntities(
  blueprint: Blueprint,
  input: SemanticGateInput,
): Blueprint["dataModel"]["entities"] {
  const haystack = (
    (input.content ?? "") +
    " " +
    (input.command ?? "") +
    " " +
    (input.filePath ?? "")
  ).toLowerCase();
  if (!haystack.trim()) {
    return blueprint.dataModel.entities.slice(0, 6);
  }
  const matched = blueprint.dataModel.entities.filter((e) =>
    haystack.includes(e.name.toLowerCase()),
  );
  if (matched.length >= 1) return matched.slice(0, 6);
  return blueprint.dataModel.entities.slice(0, 6);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…(truncated, original length ${s.length})`;
}

function allowFallback(reasoning: string): SemanticGateResult {
  return {
    verdict: "ALLOW",
    violated: [],
    reasoning,
    source: "fallback",
  };
}

function blockFallback(reasoning: string): SemanticGateResult {
  return {
    verdict: "BLOCK",
    violated: [],
    reasoning,
    source: "fallback",
  };
}

export async function evaluateSemanticGate(
  blueprint: Blueprint,
  input: SemanticGateInput,
  options: SemanticGateOptions = {},
): Promise<SemanticGateResult> {
  const strict = options.strict ?? process.env["ADA_GATE_STRICT"] === "1";

  if (!getApiKey()) {
    return strict
      ? blockFallback("gate: no ANTHROPIC_API_KEY (strict mode)")
      : allowFallback("gate: no ANTHROPIC_API_KEY (fail-open)");
  }

  const result = await callWithExtendedThinking({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(blueprint, input),
    thinkingBudget: options.thinkingBudget ?? 6000,
    timeoutMs: options.timeoutMs ?? 20_000,
  });

  if (!result || !result.json) {
    return strict
      ? blockFallback("gate: llm call failed (strict mode)")
      : allowFallback("gate: llm call failed (fail-open)");
  }

  return (
    parseVerdict(result.json) ?? allowFallback("gate: unparseable verdict")
  );
}

function parseVerdict(json: unknown): SemanticGateResult | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as {
    verdict?: unknown;
    violated?: unknown;
    reasoning?: unknown;
    suggested?: unknown;
  };

  const v = obj.verdict;
  if (v !== "ALLOW" && v !== "BLOCK" && v !== "AMEND_FIRST") return null;

  const violated = Array.isArray(obj.violated)
    ? obj.violated.filter((x): x is string => typeof x === "string")
    : [];
  const reasoning =
    typeof obj.reasoning === "string" ? obj.reasoning : "no reasoning provided";
  const suggested =
    typeof obj.suggested === "string" && obj.suggested.length > 0
      ? obj.suggested
      : undefined;

  return {
    verdict: v,
    violated,
    reasoning,
    ...(suggested !== undefined ? { suggested } : {}),
    source: "semantic",
  };
}
