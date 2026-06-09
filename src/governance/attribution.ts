/**
 * Exogenous/endogenous failure attribution (ada-autonomy-gaps PLAN.006 / UNK.002). Between verify and
 * repair, the loop must answer one question with a DETERMINISTIC handle, not a guess: did the artifact
 * break, or did the world it depends on break? The handle: compare the artifact's content hash at its
 * LAST GREEN against now. If the bytes are unchanged but the check now fails, the artifact is innocent —
 * the failure is EXOGENOUS (a dependency/the world changed), and entering the repair lane would "fix" a
 * correct artifact into a wrong one. Only an artifact whose bytes CHANGED then went red is ENDOGENOUS.
 * Pure, model-free (A3): the handle the runtime repair lane gates on.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

export interface FailureContext {
  checkId: string;
  /** Content hash of the artifact at the moment its check was last green. */
  lastGreenHash: string;
  /** Content hash of the artifact now (when the check went red). */
  currentHash: string;
}

export interface Attribution {
  kind: "exogenous" | "endogenous";
  route: "world-handler" | "repair-lane";
}

/** Attribute a red check by the one deterministic handle: did the artifact's bytes change? */
export function attribute(ctx: FailureContext): Attribution {
  return ctx.currentHash === ctx.lastGreenHash
    ? { kind: "exogenous", route: "world-handler" }
    : { kind: "endogenous", route: "repair-lane" };
}

/** Project the attribution gate the runtime inserts between verify and repair. */
export function projectAttribution(model: PackModel): ExportFile {
  return {
    path: "ATTRIBUTION.md",
    content: [
      `# Failure Attribution — ${model.slug}`,
      "",
      "> Between verify and repair the loop asks one question with a deterministic handle, never a guess:",
      "> **did my artifact break, or did the world it depends on break?** The handle is the artifact's",
      "> content hash at its last green vs now.",
      "",
      "## the rule",
      "- bytes **unchanged** since last green, yet now red → **EXOGENOUS**: a dependency / the world changed.",
      "  The artifact is innocent. Route to the **world-handler** (re-resolve the input, wait, or escalate)",
      "  — do NOT enter the repair lane. Repairing an innocent artifact turns a correct thing wrong.",
      "- bytes **changed** then went red → **ENDOGENOUS**: a patch broke it. Route to the **repair lane**.",
      "",
      "## why it matters for unattended build",
      "Without this gate, an autonomous loop mis-attributes every exogenous failure as its own bug and",
      "'repairs' working code until it is broken — the most expensive way to fail unsupervised. The hash",
      "handle is deterministic, so attribution never depends on the model's opinion of whose fault it is.",
      "",
    ].join("\n"),
  };
}
