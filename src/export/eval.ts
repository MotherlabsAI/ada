/**
 * The EVAL projection ("compile the family", lane B — the L9 frontier, honestly split).
 *
 * The value ladder's L9 is "trustable improvement" — but a compiler CANNOT honestly grade whether its
 * own output helps an executor by scoring it against its own artifact (the de-circularity trap). So the
 * eval splits in two:
 *   • STRUCTURAL eval (here, deterministic, A3): measurable proxies over the compiled graph — type
 *     diversity, checkable ratio, typed-edge density, residue honesty, plan/distinction presence.
 *     A scorecard. Useful for non-regression, NOT proof the context helps.
 *   • OUTCOME eval (declared, NOT computed): "does Ada+executor beat raw-prompt on the same repo?" —
 *     the north-star gate. Held-out, human/model-judged, A4. Routed to residue, never self-graded.
 * This is the field's open eval problem stated honestly: the compiler measures its own structure, and
 * declares the outcome test as the human gate it owes — a hole beats a fabricated "it works" (A2).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

export interface Scorecard {
  nodes: number;
  edges: number;
  typedEdges: number;
  distinctTypes: number;
  checkable: number;
  residue: number;
  hasPlan: boolean;
  hasDistinctions: boolean;
}

const isCheckable = (n: NodeCapsule): boolean => {
  const c = n.checkability?.class;
  return c === "C3" || c === "C4" || c === "C5";
};

/** Deterministic structural proxies over the compiled graph. No model, no Date (byte-stable). */
export function computeScorecard(model: PackModel): Scorecard {
  const ns = model.graph.nodes;
  const es = model.graph.edges;
  return {
    nodes: ns.length,
    edges: es.length,
    typedEdges: es.filter((e) => e.type !== "contains").length,
    distinctTypes: new Set(ns.map((n) => n.semanticType).filter(Boolean)).size,
    checkable: ns.filter(isCheckable).length,
    residue: ns.filter((n) => n.truth === "residue").length,
    hasPlan: ns.some((n) => n.semanticType === "Action"),
    hasDistinctions: es.some((e) => e.type === "disambiguates"),
  };
}

function reportMd(model: PackModel, s: Scorecard): ExportFile {
  const ratio = s.nodes ? Math.round((s.checkable / s.nodes) * 100) : 0;
  return {
    path: "EVAL_REPORT.md",
    content: [
      `# Eval Report — ${model.slug}`,
      "",
      "> A STRUCTURAL proxy only — a measure of the compile's shape, **not proof that the context",
      "> helps an executor**. The outcome test is held-out (see EVAL_PLAN.md). Deterministic.",
      "",
      `- nodes: ${s.nodes} · edges: ${s.edges} (typed cross-edges: ${s.typedEdges})`,
      `- type diversity: ${s.distinctTypes} distinct semanticTypes`,
      `- checkable (C3–C5): ${s.checkable}/${s.nodes} (${ratio}%)`,
      `- residue (Ω, honestly surfaced): ${s.residue}`,
      `- has execution plan (Action nodes): ${s.hasPlan ? "yes" : "no"}`,
      `- has distinctions (split fused concepts): ${s.hasDistinctions ? "yes" : "no"}`,
      "",
      "These numbers gate NON-REGRESSION (a recompile must not get structurally thinner — see",
      "governance/selfImprove.ts). They do not, and cannot, certify the outcome. That is owed below.",
      "",
    ].join("\n"),
  };
}

function planMd(model: PackModel): ExportFile {
  return {
    path: "EVAL_PLAN.md",
    content: [
      `# Eval Plan — ${model.slug}`,
      "",
      "> Two rungs. One Ada can grade itself; one it must NOT.",
      "",
      "## L9a — structural eval (deterministic, self-graded, A3)",
      "Proxies over the compiled graph: type diversity · checkable ratio · typed-edge density · residue",
      "honesty · plan/distinction presence. Computed in EVAL_REPORT.md + scorecard.json. Use: catch a",
      "regression (a thinner recompile), not certify quality.",
      "",
      "## L9b — OUTCOME eval (held-out, human/model-judged, A4 — the north-star gate)",
      "The real question: **does an executor working from this pack outperform the same executor working",
      "from the raw repo / a raw prompt, on the same task?** This is the north-star gate. It is held-out:",
      "graded on tasks NOT used to build the pack, by a human or an independent judge — **never by Ada",
      "scoring its own artifact** (that is the de-circularity trap, and a fabricated pass would be a lie, A2).",
      "",
      "**Status: OWED.** This rung is residue until measured. Recommended protocol: pick a task, run it",
      "twice (pack vs no-pack), compare wrong-turns / tokens-to-outcome / invariants-caught. Alex's gate.",
      "",
    ].join("\n"),
  };
}

/** Emit the eval suite: plan (the two rungs), report (structural proxies), scorecard (machine-readable). */
export function evalExports(model: PackModel): ExportFile[] {
  const s = computeScorecard(model);
  return [
    planMd(model),
    reportMd(model, s),
    {
      path: "scorecard.json",
      content:
        JSON.stringify(
          { slug: model.slug, kind: "structural-proxy", ...s },
          null,
          2,
        ) + "\n",
    },
  ];
}
