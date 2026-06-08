/**
 * The DECOMPOSITION projection ("compile the family", lane A — the inspectable atoms).
 *
 * The export taxonomy's §04: convert ambiguous language into named, separately-addressable atom files
 * (FACTS · CLAIMS · ASSUMPTIONS · UNKNOWNS · CONSTRAINTS · DECISIONS · ACTIONS). These are pure filters
 * over the typed graph — each file is one `semanticType` / truth-class bucket — so a consumer can grab
 * UNKNOWNS.md without parsing the whole POM. Deterministic, model-free (A3); empty buckets are stated
 * honestly (a hole beats a fabricated atom, A2). Closes ~7 of the MVP-21 export gaps in one pass.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const line = (n: NodeCapsule): string => {
  const s = n.localContext?.summary?.trim();
  return `- \`${n.id}\` **${n.label}**${s ? ` — ${s}` : ""}`;
};

function atom(
  path: string,
  title: string,
  intro: string,
  nodes: NodeCapsule[],
): ExportFile {
  return {
    path,
    content: [
      `# ${title} — decomposition atom`,
      "",
      `> ${intro} Projected from the typed graph; separately addressable (export taxonomy §04).`,
      "",
      nodes.length ? nodes.map(line).join("\n") : "_(none surfaced)_",
      "",
    ].join("\n"),
  };
}

/** Project the 7 decomposition atom files from the graph's semanticType / truth buckets. */
export function projectDecomposition(model: PackModel): ExportFile[] {
  const ns = model.graph.nodes;
  const ofType = (...t: string[]): NodeCapsule[] =>
    ns.filter((n) => n.semanticType && t.includes(n.semanticType));
  return [
    atom(
      "FACTS.md",
      "Facts",
      "Source-grounded truths (∵) — what is established, not inferred.",
      ns.filter((n) => n.truth === "source" || n.semanticType === "Evidence"),
    ),
    atom(
      "CLAIMS.md",
      "Claims",
      "Asserted but not yet source-proven — each needs support or a check.",
      ofType("Claim"),
    ),
    atom(
      "ASSUMPTIONS.md",
      "Assumptions",
      "Provisional beliefs in use — true enough to proceed, not proven.",
      ofType("Assumption"),
    ),
    atom(
      "UNKNOWNS.md",
      "Unknowns",
      "Explicit holes (Ω) — unresolved and action-relevant; do not fill with a guess.",
      ns.filter((n) => n.semanticType === "Unknown" || n.truth === "residue"),
    ),
    atom(
      "CONSTRAINTS.md",
      "Constraints",
      "Hard boundaries and invariants that must hold.",
      ofType("Constraint", "Invariant"),
    ),
    atom(
      "DECISIONS.md",
      "Decisions",
      "Choices made during compile (and the alternative each closed).",
      ofType("Decision"),
    ),
    atom(
      "ACTIONS.md",
      "Actions",
      "Candidate moves — the plan; each bounded by the Autonomy Contract.",
      ofType("Action"),
    ),
  ];
}
