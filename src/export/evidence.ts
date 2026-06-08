/**
 * The EVIDENCE LEDGER projection ("compile the family", brick 4 — the trace bricks 1–3 reference).
 *
 * AGENTS.md and TOOL_CONTRACTS.md both say state-changing work "writes to the evidence ledger" — so
 * no completion is claimed without a trace. This emits it, SEEDED with the compile's own provenance
 * entry: the compile itself is the first evidenced event (what was produced, and that it cleared the
 * gate). Runtime executors append their own entries (with timestamps) as they act. The seed entry is
 * deliberately TIMESTAMP-FREE so a re-compile of an unchanged SEED stays byte-identical (INVARIANT.003,
 * the determinism guarantee) — wall-clock belongs to runtime entries, not the compile. Model-free (A3).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const isCheckable = (n: NodeCapsule): boolean => {
  const c = n.checkability?.class;
  return c === "C3" || c === "C4" || c === "C5";
};

/** The deterministic compile evidence record — the first line of the ledger. No wall-clock field. */
export function compileEvidence(model: PackModel): {
  event: "compiled";
  slug: string;
  source: "ada-compile";
  nodes: number;
  edges: number;
  checkable: number;
  residue: number;
  gate: "passed";
} {
  const nodes = model.graph.nodes;
  return {
    event: "compiled",
    slug: model.slug,
    source: "ada-compile",
    nodes: nodes.length,
    edges: model.graph.edges.length,
    checkable: nodes.filter(isCheckable).length,
    residue: nodes.filter((n) => n.truth === "residue").length,
    // A written pack exists only because ≥1 node cleared the rubric gate (engineCompile throws
    // otherwise), so the compile event is, by construction, gate-passed.
    gate: "passed",
  };
}

/** Build the seed EVIDENCE_LEDGER.jsonl content (one COMPACT JSON line: the compile entry). */
export function projectEvidenceLedger(model: PackModel): string {
  // Compact single-line JSON — JSONL is one object per line. Deterministic: the entry has fixed
  // key order and only int/string values (no Date, no Map), so JSON.stringify is byte-stable.
  return JSON.stringify(compileEvidence(model)) + "\n";
}

/** The seed evidence ledger as an emitted pack file (executors append; never rewrite the seed). */
export function evidenceLedgerExport(model: PackModel): ExportFile {
  return {
    path: "EVIDENCE_LEDGER.jsonl",
    content: projectEvidenceLedger(model),
  };
}
