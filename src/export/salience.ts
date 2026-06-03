/**
 * Salience budget for the CLAUDE.md emit (FREEZE.md §4, Steal 4-a; AXIOM A1/A3).
 *
 * Problem: P0 derived the Hard-rules / entity registry from the graph with NO cap —
 * every checkable node's every candidate became a MUST line. At scale (a real engine
 * pack of 60+ nodes) that floods CLAUDE.md, and a flooded instruction file is a diluted
 * one: the downstream executor (and any compactor) loses the high-value invariants in
 * the noise. So we rank the candidates by a deterministic salience signal, inline only
 * the top-K, and demote the tail to a load-on-demand pointer into `wiki/`.
 *
 * This module is PURE and MODEL-FREE (AXIOM A3): the ranking signal is reconstructed
 * from the capsule's already-computed deterministic quality block (`NodeQuality`, stamped
 * from the rubric at assembly time) × its `ui.openPriority` (the Kano must-have / delighter
 * lane, 3-a.4). No LLM, no network, referentially transparent: identical capsules →
 * identical ordering and identical split.
 *
 * The budget is a HARD CAP, not a heuristic: `densityWithinBudget()` is the pure pass/fail
 * predicate the C-run path uses to FAIL an over-budget pack.
 */
import type { NodeCapsule, Score } from "../core/types.js";

/**
 * ── PROVISIONAL BUDGET ──────────────────────────────────────────────────────────
 * These numbers are PLACEHOLDERS chosen for sanity, NOT derived from any figure in the
 * research intake (no external "context window" / "attention budget" number is trusted —
 * all fabricated numbers are quarantined, FREEZE.md §2). The REAL budget MUST come from
 * MEASUREMENT: compile a corpus of real packs, A/B the executor (AXIOM A8) at a range of
 * caps, and set the cap at the point where added rules stop improving the pack-vs-raw
 * delta. Until that measurement exists, treat both numbers as provisional.
 */
export const CLAUDE_MD_BUDGET_BYTES = 12_288; // ~12 KB. PROVISIONAL — measure, don't trust.
export const HARD_RULES_BUDGET = 40; // max inlined MUST lines. PROVISIONAL — measure.
export const ENTITY_BUDGET = 30; // max inlined entity-registry lines. PROVISIONAL — measure.

/** Deterministic weight for the Kano open-priority lane (3-a.4): must-have > delighter. */
const PRIORITY_WEIGHT: Record<NodeCapsule["ui"]["openPriority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Deterministic 0..2 weight for a recorded quality Score (low/medium/high). */
const SCORE_WEIGHT: Record<Score, number> = { low: 0, medium: 1, high: 2 };

/**
 * The deterministic salience signal for a node, in the spirit of "rubric total ×
 * openPriority" (FREEZE.md 4-a). The rubric total is not stored on the capsule, so we
 * reconstruct a faithful, monotone proxy from the quality block the rubric already
 * stamped: high action-enablement and low genericness ARE the dimensions that made the
 * node impress. Pure function of the capsule (A1/A3).
 */
export function salienceScore(n: NodeCapsule): number {
  // genericnessScore is inverted: less generic ⇒ more salient.
  const notGeneric = 2 - SCORE_WEIGHT[n.quality.genericnessScore];
  const action = SCORE_WEIGHT[n.quality.actionEnablementScore];
  const quality = 1 + notGeneric + action; // 1..5, never zero so priority always weighs
  return quality * PRIORITY_WEIGHT[n.ui.openPriority];
}

/**
 * Ranks items by a salience-scored source node, descending, then by a stable tiebreak
 * (node id) so the ordering is total and deterministic (A1). Items that map to the SAME
 * node keep their input order (stable) under that node's score.
 */
export function rankBySalience<T>(
  items: T[],
  nodeOf: (item: T) => NodeCapsule,
  idOf: (item: T) => string,
): T[] {
  return items
    .map((item, i) => ({
      item,
      i,
      s: salienceScore(nodeOf(item)),
      id: idOf(item),
    }))
    .sort(
      (a, b) => b.s - a.s || (a.id < b.id ? -1 : a.id > b.id ? 1 : a.i - b.i),
    )
    .map((x) => x.item);
}

/**
 * Splits ranked items into the inlined top-K and the demoted tail under a count budget.
 * Pure; the caller turns the tail into a single load-on-demand pointer line.
 */
export function splitByCount<T>(
  ranked: T[],
  budget: number,
): { inline: T[]; demoted: T[] } {
  if (budget <= 0) return { inline: [], demoted: ranked.slice() };
  return { inline: ranked.slice(0, budget), demoted: ranked.slice(budget) };
}

/** UTF-8 byte length of a string (the unit the budget is denominated in). */
export function byteLength(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

export interface DensityVerdict {
  pass: boolean;
  bytes: number;
  byteBudget: number;
  rules: number;
  ruleBudget: number;
  violations: string[];
}

/**
 * The PURE, DETERMINISTIC density predicate (AXIOM A3 — no model, no network). Returns
 * pass/fail for "is this emitted CLAUDE.md within the salience budget". A `MUST:` line is
 * the unit of a hard rule. Identical input → identical verdict (referential transparency).
 *
 * This is the model-free check `ada c run` wires in to FAIL an over-budget pack: it reads
 * the emitted file off disk and runs THIS function — no LLM in the evaluation path.
 */
export function densityVerdict(claudeMd: string): DensityVerdict {
  const bytes = byteLength(claudeMd);
  const rules = claudeMd
    .split("\n")
    .filter((l) => /^\s*-\s+MUST:/.test(l)).length;
  const violations: string[] = [];
  if (bytes > CLAUDE_MD_BUDGET_BYTES)
    violations.push(
      `CLAUDE.md is ${bytes} bytes; budget is ${CLAUDE_MD_BUDGET_BYTES} (provisional).`,
    );
  if (rules > HARD_RULES_BUDGET)
    violations.push(
      `CLAUDE.md inlines ${rules} MUST rules; budget is ${HARD_RULES_BUDGET} (provisional).`,
    );
  return {
    pass: violations.length === 0,
    bytes,
    byteBudget: CLAUDE_MD_BUDGET_BYTES,
    rules,
    ruleBudget: HARD_RULES_BUDGET,
    violations,
  };
}

/** Convenience boolean form of {@link densityVerdict}. */
export function densityWithinBudget(claudeMd: string): boolean {
  return densityVerdict(claudeMd).pass;
}
