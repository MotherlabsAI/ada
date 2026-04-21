import { Governor } from "./governor.js";

/**
 * createGovernedCanUseTool: Wraps Claude Code's tool-call permission handler
 * with the Ada Governor. Tool calls that violate the manifold symmetry OR
 * the semantic gate (when enabled) are denied before execution.
 */
export function createGovernedCanUseTool(
  governor: Governor,
  originalCanUseTool: any,
): any {
  return async (
    tool: any,
    input: any,
    toolUseContext: any,
    assistantMessage: any,
    toolUseID: string,
    forceDecision?: any,
  ) => {
    // 1. Layered validation: manifold + (optionally) semantic gate
    const validation = await governor.validate(tool.name, input);

    if (!validation.result) {
      const semantic = validation.semantic;
      const hookName =
        semantic && semantic.source === "semantic"
          ? "AdaSemanticGate"
          : "ManifoldGovernor";

      const defaultMessage =
        "Blocked by Ada Governor: Manifold Invariant Violation";
      const message = validation.message ?? defaultMessage;

      const reason =
        validation.violatedInvariants &&
        validation.violatedInvariants.length > 0
          ? validation.violatedInvariants.join("; ")
          : semantic?.reasoning;

      return {
        behavior: "deny",
        message,
        decisionReason: {
          type: "hook",
          hookName,
          ...(reason !== undefined ? { reason } : {}),
          ...(semantic?.suggested !== undefined
            ? { suggested: semantic.suggested }
            : {}),
        },
        toolUseID,
      };
    }

    // 2. Delegate to original permission logic
    return originalCanUseTool(
      tool,
      input,
      toolUseContext,
      assistantMessage,
      toolUseID,
      forceDecision,
    );
  };
}
