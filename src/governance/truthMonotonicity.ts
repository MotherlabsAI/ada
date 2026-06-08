/**
 * Truth-class monotonicity (ada-improvement-blueprint PLAN.001 / invariant CTX.002 — "truth-class is
 * monotone non-increasing across the agent write→read boundary"). A deterministic check (A3) that no
 * node claims MORE certainty than its provenance allows: a derivation cannot manufacture certainty.
 * Ordering: source (∵, grounded) > inference (∴, reasoned) > residue (Ω, a known hole). For every
 * provenance edge A→B (A `derived_from` / `depends_on` B), require rank(A) ≤ rank(B): a node derived
 * from an inference cannot be a source; a node depending on a hole cannot be certain. Pure, model-free.
 */
import type { Graph, PackModel, TruthClass, EdgeType } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

const RANK: Record<TruthClass, number> = {
  source: 2,
  inference: 1,
  residue: 0,
};

/** Numeric certainty rank: source > inference > residue. */
export function truthRank(t: TruthClass): number {
  return RANK[t] ?? 0;
}

/** Provenance edges that constrain truth: a node is bounded by what it derives from / depends on. */
const PROVENANCE: ReadonlySet<EdgeType> = new Set<EdgeType>([
  "derived_from",
  "depends_on",
]);

export interface MonotonicityResult {
  ok: boolean;
  violations: { from: string; to: string; type: EdgeType }[];
}

/** Check that no provenance edge increases certainty downstream (CTX.002). */
export function checkTruthMonotonicity(graph: Graph): MonotonicityResult {
  const truthOf = new Map(graph.nodes.map((nd) => [nd.id, nd.truth]));
  const violations: MonotonicityResult["violations"] = [];
  for (const e of graph.edges) {
    if (!PROVENANCE.has(e.type)) continue;
    const child = truthOf.get(e.from);
    const parent = truthOf.get(e.to);
    if (!child || !parent) continue; // dangling endpoint — not this check's concern
    if (truthRank(child) > truthRank(parent)) {
      violations.push({ from: e.from, to: e.to, type: e.type });
    }
  }
  return { ok: violations.length === 0, violations };
}

/** Project the invariant + the deterministic verdict for this pack. */
export function projectTruthInvariant(model: PackModel): ExportFile {
  const r = checkTruthMonotonicity(model.graph);
  return {
    path: "TRUTH_MONOTONICITY.md",
    content: [
      `# Truth Monotonicity — ${model.slug}`,
      "",
      "> **CTX.002:** truth-class is monotone non-increasing across a derivation. A node may not claim",
      "> more certainty than its provenance allows — source (∵) > inference (∴) > residue (Ω). For every",
      "> `derived_from` / `depends_on` edge A→B, rank(A) ≤ rank(B). No agent manufactures certainty.",
      "",
      `## Verdict: ${r.ok ? "PASS" : "FAIL"}`,
      r.ok
        ? "Every derivation in this pack is certainty-bounded by its provenance."
        : "Manufactured-certainty violations (a node more certain than its source):\n" +
          r.violations
            .map(
              (v) =>
                `- \`${v.from}\` ${v.type} \`${v.to}\` — child out-ranks its source`,
            )
            .join("\n"),
      "",
    ].join("\n"),
  };
}
