/**
 * excavatePack — the U2F engine's pack-level orchestration: one SEED + N clusters →
 * N candidate NodeSpecs, each excavated by `excavateNode` and gated by the same
 * deterministic, model-free rubric (AXIOM A3). Pure orchestration: the ONLY model
 * touch is the `ModelClient` injected straight through to `excavateNode`. One
 * compile-time call per cluster, run sequentially — A1/A9 permit multiple COMPILE-TIME
 * calls; what they forbid is a runtime / post-compile call, which never happens here.
 *
 * Kept nodes (gate verdict ≠ reject) and rejected nodes (with their rubric score, for
 * auditing) are returned separately — a generic candidate is surfaced, never silently
 * dropped. The kept NodeSpec[] feeds `assemblePackGated` unchanged.
 */
import type { Seed } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";
import type { RubricScore } from "../rubric.js";
import { excavateNode } from "./excavate.js";
import type { ModelClient } from "./model.js";

/** A candidate the deterministic rubric refused, kept for the audit trail. */
export interface RejectedSpec {
  spec: NodeSpec;
  score: RubricScore;
}

export interface ExcavatePackResult {
  /** Nodes that cleared the gate, in cluster order. */
  kept: NodeSpec[];
  /** Candidates the gate refused, each with its rubric verdict. */
  rejected: RejectedSpec[];
}

/**
 * Excavates one cluster per entry in `clusters`, sequentially. Each cluster is one
 * compile-time model call (A1/A9) routed through `excavateNode`, then gated by the pure
 * `scoreNode` rubric inside `excavateNode` (A3). The model never enters orchestration
 * here beyond being passed through — this file holds no network token (grep-guarded).
 */
export async function excavatePack(
  seed: Seed,
  clusters: string[],
  model: ModelClient,
): Promise<ExcavatePackResult> {
  const kept: NodeSpec[] = [];
  const rejected: RejectedSpec[] = [];
  // Sequential on purpose: compile-time, deterministic order, and one call at a time
  // keeps the single-boundary contract legible (A1/A9). Each result carries the
  // model-free rubric verdict; we route purely on that.
  for (const cluster of clusters) {
    const result = await excavateNode(seed, cluster, model);
    if (result.rejected || result.node === null) {
      // excavateNode always returns the parsed candidate in `spec` (kept or not), so
      // the rejected audit entry needs no re-parse and no second model call.
      rejected.push({ spec: result.spec, score: result.score });
    } else {
      kept.push(result.node);
    }
  }
  return { kept, rejected };
}
