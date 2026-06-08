/**
 * excavatePack — the U2F engine's pack-level orchestration with DEPTH: one SEED + N
 * clusters → MANY candidate NodeSpecs, each excavated by `excavateNode` and gated by the
 * same deterministic, model-free rubric (AXIOM A3). The engine fills the graph instead of
 * emitting one node per cluster.
 *
 * Per cluster it loops: each call passes the labels already kept (across the WHOLE pack)
 * as the `avoid` list, pushing the model toward a DIFFERENT facet; the result is gated,
 * deduped globally by normalized label, and kept until the per-cluster target is reached
 * or it hits diminishing returns (consecutive rejects/dups). The model is the ONLY thing
 * passed through — this file holds no network token (grep-guarded). Multiple COMPILE-TIME
 * calls are fine under A1/A9; what they forbid is a runtime / post-compile call.
 *
 * Kept nodes get clean, collision-free ids (`CLUSTER.001`…) and a clean parent (ROOT.000),
 * so the assembled graph is a tidy hierarchy regardless of the ids the model proposed.
 */
import type { Seed } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";
import type { RubricScore } from "../rubric.js";
import { excavateNode } from "./excavate.js";
import type { ModelClient } from "./model.js";
import type { ProgressSink } from "./progress.js";

/** A candidate the deterministic rubric refused (or a duplicate), kept for the audit trail. */
export interface RejectedSpec {
  spec: NodeSpec;
  score: RubricScore;
  /** Why it didn't make the pack: the gate rejected it, or it duplicated a kept node. */
  reason: "gate" | "duplicate";
}

export interface ExcavatePackResult {
  /** Nodes that cleared the gate and were unique, in cluster order, with normalized ids. */
  kept: NodeSpec[];
  /** Candidates the gate refused or that duplicated a kept node. */
  rejected: RejectedSpec[];
}

export interface DepthOptions {
  /** Target kept nodes per cluster (the depth that fills the graph). */
  perCluster?: number;
  /** Hard cap on model calls per cluster (a diminishing-returns guard). */
  maxAttemptsPerCluster?: number;
  /** Stop a cluster after this many consecutive non-keeps (reject or duplicate). */
  maxConsecutiveMisses?: number;
}

const DEFAULTS: Required<DepthOptions> = {
  perCluster: 4,
  maxAttemptsPerCluster: 8,
  maxConsecutiveMisses: 2,
};

function normLabel(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Excavates each cluster to DEPTH. For every cluster it keeps up to `perCluster` unique,
 * gate-passing nodes, diversifying via the global `avoid` list and deduping globally by
 * normalized label, then stops on target / attempt-cap / consecutive-miss. Pure
 * orchestration over the injected `ModelClient` (A1/A9); gating is the model-free rubric
 * inside `excavateNode` (A3).
 */
export async function excavatePack(
  seed: Seed,
  clusters: string[],
  model: ModelClient,
  opts: DepthOptions = {},
  /** Optional progress sink: emits cluster_start/call/node_added/cluster_done so a watcher can
   *  see each "agent" (cluster excavation) run in real time. A no-op when absent. */
  onProgress?: ProgressSink,
): Promise<ExcavatePackResult> {
  const cfg: Required<DepthOptions> = { ...DEFAULTS, ...opts };
  const kept: NodeSpec[] = [];
  const rejected: RejectedSpec[] = [];
  const seen = new Set<string>(); // global dedup by normalized label
  const seenLabels: string[] = []; // the `avoid` list fed back to the model for diversity

  for (const cluster of clusters) {
    let keptHere = 0;
    let attempts = 0;
    let misses = 0;
    // callsTotal is the per-cluster TARGET (a lower bound; a cluster may take more attempts when
    // candidates are gated out, capped at maxAttemptsPerCluster). A watcher renders calls/target.
    onProgress?.({
      kind: "cluster_start",
      cluster,
      callsTotal: cfg.perCluster,
    });
    while (
      keptHere < cfg.perCluster &&
      attempts < cfg.maxAttemptsPerCluster &&
      misses < cfg.maxConsecutiveMisses
    ) {
      attempts++;
      onProgress?.({ kind: "call", phase: "excavate", cluster });
      const r = await excavateNode(seed, cluster, model, seenLabels);
      if (r.rejected || r.node === null) {
        rejected.push({ spec: r.spec, score: r.score, reason: "gate" });
        misses++;
        continue;
      }
      const key = normLabel(r.node.label);
      if (seen.has(key)) {
        rejected.push({ spec: r.spec, score: r.score, reason: "duplicate" });
        misses++;
        continue;
      }
      // Keep it. Normalize the id (collision-free, positional) and parent (clean tree);
      // the model's proposed id is discarded — ids are positional, the content is what counts.
      seen.add(key);
      seenLabels.push(r.node.label);
      keptHere++;
      misses = 0;
      const id = `${cluster}.${String(keptHere).padStart(3, "0")}`;
      const parents = cluster === "ROOT" ? [] : ["ROOT.000"];
      kept.push({ ...r.node, id, cluster, parents });
      onProgress?.({
        kind: "node_added",
        cluster,
        id,
        label: r.node.label,
        truth: r.node.truth ?? "inference",
      });
    }
    onProgress?.({ kind: "cluster_done", cluster });
  }
  return { kept, rejected };
}
