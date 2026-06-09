/**
 * Check-class trust ceiling (ada-autonomy-gaps PLAN.004 / VER.004 — "a green's right to close the loop
 * is capped by its weakest covering check"). The bridge between mechanical autonomy and the human gate:
 * the autonomous loop may certify "done" by ITSELF only when every acceptance criterion is covered by a
 * deterministic (C3–C5) check. If any criterion rests on a C0–C2 check (uncheckable / heuristic / human),
 * the loop CANNOT auto-close — it parks that decision for the human (GOV.001/GOV.002), never silently
 * rubber-stamps it. trustCeiling = min(checkClass) over the acceptance criteria. Pure, model-free (A3).
 */
import type { PackModel, NodeCapsule, CheckClass } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

const ORDER: CheckClass[] = ["C0", "C1", "C2", "C3", "C4", "C5"];

/** Numeric rank of a check class (C0=0 … C5=5). */
export function checkClassRank(c: CheckClass): number {
  return ORDER.indexOf(c);
}

/** Acceptance criteria = the must-hold / must-verify nodes the loop's "done" depends on. */
const isAcceptanceCriterion = (n: NodeCapsule): boolean =>
  n.semanticType === "Invariant" ||
  n.semanticType === "Constraint" ||
  n.semanticType === "Eval";

export interface TrustCeiling {
  ceiling: CheckClass;
  /** True iff every acceptance criterion is C3+ (the loop may certify done with no human). */
  mayAutoClose: boolean;
  /** The acceptance criteria below C3 — the ones that cap close-authority and route to the human. */
  weakest: string[];
}

/** Compute the loop's close-authority from its weakest covering check. */
export function trustCeiling(model: PackModel): TrustCeiling {
  const crit = model.graph.nodes.filter(isAcceptanceCriterion);
  if (crit.length === 0) {
    // Nothing to certify → vacuously closeable, but say so (a board with no criteria proves nothing).
    return { ceiling: "C5", mayAutoClose: true, weakest: [] };
  }
  const classOf = (n: NodeCapsule): CheckClass => n.checkability?.class ?? "C0";
  const ceiling = crit.reduce<CheckClass>(
    (min, n) =>
      checkClassRank(classOf(n)) < checkClassRank(min) ? classOf(n) : min,
    "C5",
  );
  const weakest = crit
    .filter((n) => checkClassRank(classOf(n)) < checkClassRank("C3"))
    .map((n) => n.id);
  return { ceiling, mayAutoClose: weakest.length === 0, weakest };
}

/** Project the trust ceiling: the close-authority verdict + the park rule for weak criteria. */
export function projectTrustCeiling(model: PackModel): ExportFile {
  const t = trustCeiling(model);
  return {
    path: "TRUST_CEILING.md",
    content: [
      `# Trust Ceiling — ${model.slug}`,
      "",
      "> A green board's right to **close the loop autonomously** is capped by its weakest covering",
      '> check (VER.004). The loop may certify "done" by itself only when every acceptance criterion is',
      "> deterministic (C3–C5). A criterion resting on C0–C2 cannot be self-certified — it parks for the",
      "> human (GOV.002), degrading to a typed hole, never a silent auto-close (a hole beats a lie, A2).",
      "",
      `## ceiling: ${t.ceiling}  →  ${t.mayAutoClose ? "the loop MAY auto-close" : "the loop must PARK for a human"}`,
      t.mayAutoClose
        ? "Every acceptance criterion is covered by a deterministic check — the loop can declare done with no human in the path."
        : "These acceptance criteria rest on a weak (C0–C2) check and cap close-authority — each routes to the human gate (GOV.001/GOV.002):\n" +
          t.weakest.map((id) => `- \`${id}\``).join("\n"),
      "",
      "## why",
      "This is the exact line between mechanical autonomy and your gate: the loop runs unsupervised on",
      "everything deterministically checkable, and parks ONLY the criteria whose verification is itself",
      "below the deterministic bar — the irreducible human/oracle seam (UNK.001), made addressable.",
      "",
    ].join("\n"),
  };
}
