import { evaluateSemanticGate } from "@ada/governor";
import { loadBlueprint } from "../state.js";

/**
 * ada.gate — semantic action-time gate.
 *
 * Given a proposed tool call, returns ALLOW / BLOCK / AMEND_FIRST with
 * reasoning. Intended for:
 *   1. Interactive agent use ("should I do X?") — advisory
 *   2. PreToolUse hook invocation — binding (hook maps BLOCK to exit 2)
 *
 * Fail-open by default. Set ADA_GATE_STRICT=1 to fail-closed on LLM
 * unavailability.
 */

export interface GateArgs {
  readonly tool: string;
  readonly filePath?: string;
  readonly content?: string;
  readonly command?: string;
  readonly rationale?: string;
}

export async function adaGate(
  args: GateArgs,
): Promise<{ content: string; isError: boolean }> {
  if (!args.tool || args.tool.trim().length === 0) {
    return {
      content: JSON.stringify({
        verdict: "ALLOW",
        violated: [],
        reasoning: "gate: missing tool name, cannot evaluate",
        source: "fallback",
      }),
      isError: true,
    };
  }

  const blueprint = loadBlueprint();
  if (!blueprint) {
    return {
      content: JSON.stringify({
        verdict: "ALLOW",
        violated: [],
        reasoning: "gate: no blueprint compiled yet — nothing to gate against",
        source: "fallback",
      }),
      isError: false,
    };
  }

  const result = await evaluateSemanticGate(blueprint, {
    toolName: args.tool,
    ...(args.filePath !== undefined ? { filePath: args.filePath } : {}),
    ...(args.content !== undefined ? { content: args.content } : {}),
    ...(args.command !== undefined ? { command: args.command } : {}),
    ...(args.rationale !== undefined ? { rationale: args.rationale } : {}),
  });

  const payload = {
    verdict: result.verdict,
    violated: result.violated,
    reasoning: result.reasoning,
    source: result.source,
    ...(result.suggested !== undefined ? { suggested: result.suggested } : {}),
  };

  return {
    content: JSON.stringify(payload, null, 2),
    isError: result.verdict === "BLOCK",
  };
}
