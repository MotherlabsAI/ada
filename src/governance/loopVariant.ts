/**
 * Loop variant — the halting proof (ada-autonomy-gaps PLAN.003 / ORCH.003 — "the strictly-decreasing
 * well-founded measure that proves the loop halts, distinct from the ratchet that only proves it does
 * not regress"). The ratchet (selfImprove.ts) stops the loop from going BACKWARD; the variant proves it
 * goes FORWARD and must stop. V(state) = the lexicographic tuple (open_checks, unresolved_conflicts,
 * frontier_depth) over the well-founded order ℕ³. Every accepted iteration must strictly decrease V; an
 * iteration that does not is a LIVELOCK and escalates to replan. The bottom (0,0,0) is convergence, so
 * the loop cannot run forever. Pure, model-free (A3): the measure + comparison the runtime loop calls.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

export interface LoopState {
  /** Acceptance checks not yet green. */
  openChecks: number;
  /** Cross-action write/semantic conflicts not yet reconciled. */
  unresolvedConflicts: number;
  /** Remaining depth of the unexplored task frontier. */
  frontierDepth: number;
}

/** The well-founded measure as a lexicographic tuple over ℕ³. */
export function variant(s: LoopState): [number, number, number] {
  return [s.openChecks, s.unresolvedConflicts, s.frontierDepth];
}

/** Lexicographic strict decrease: progress at any level, with no regress at a more significant level. */
export function strictlyDecreased(
  before: LoopState,
  after: LoopState,
): boolean {
  const a = variant(before);
  const b = variant(after);
  for (let i = 0; i < a.length; i++) {
    if (b[i]! < a[i]!) return true; // strictly smaller at the most significant differing position
    if (b[i]! > a[i]!) return false; // regressed at a more significant level → not a decrease
  }
  return false; // equal at every level → no progress (livelock)
}

/** The measure bottoms out: (0,0,0) is convergence — nothing open, no conflict, frontier exhausted. */
export function isConverged(s: LoopState): boolean {
  return (
    s.openChecks === 0 && s.unresolvedConflicts === 0 && s.frontierDepth === 0
  );
}

/** Project the halting argument + the livelock→replan rule the runtime orchestrator enforces. */
export function projectLoopVariant(model: PackModel): ExportFile {
  return {
    path: "LOOP_VARIANT.md",
    content: [
      `# Loop Variant — ${model.slug}`,
      "",
      "> The autonomous loop **provably halts**. Its variant `V(state) = (open_checks, unresolved_conflicts,",
      "> frontier_depth)` ranges over the well-founded order ℕ³ (lexicographic). The orchestrator accepts an",
      "> iteration only if it **strictly decreases V**; the order has no infinite descending chain, so the",
      "> loop reaches the bottom `(0,0,0)` (= convergence) in finitely many steps. This is the difference",
      "> between *autonomous* and *runaway*.",
      "",
      "## variant vs ratchet (they are NOT the same)",
      "- The **ratchet** (no-regress): a green never goes red, a passing-set never shrinks. Prevents going",
      "  BACKWARD. It does not, alone, prove the loop ends — a loop can ratchet-hold and spin forever.",
      "- The **variant** (must-progress): every accepted step strictly decreases V. Prevents standing STILL.",
      "  Together they bound the loop on both sides: monotone up (ratchet) and strictly down (variant).",
      "",
      "## livelock → replan escalation",
      "If an iteration does NOT strictly decrease V (V unchanged or regressed at a more significant level),",
      "the repair lane is livelocked: the same micro-repairs are churning without progress. The orchestrator",
      "does not keep retrying — it ESCALATES to replan (a fresh decomposition under the unchanged contract),",
      "and if replan also fails to decrease V within budget, it parks the residue for the human (GOV.002).",
      "",
    ].join("\n"),
  };
}
