/**
 * μ″ — the structural-depth proxy. The weak, A3-clean part of "depth" (real depth is A4 —
 * the "first node must impress" gate, human-held; forcing it into a number repeats the μ
 * mistake of forging a value into a brittle predicate).
 *
 * μ′ counts GROUNDED holes but cannot tell a grounded-but-shallow mention ("uses graph.json")
 * from a grounded-deep insight ("graph.json's schema can't express invariant X, which breaks Y").
 * μ″ counts only the grounded holes that ALSO sit on a node that is:
 *   - CONSEQUENTIAL: names a concrete failure consequence (failureIfMissing) or carries a
 *     deterministic check candidate (κ), and
 *   - CONNECTED: links to ≥1 other node (a parent or any edge).
 * So μ″ ≤ μ′ — it is the deep subset. Pure, deterministic, no model (A3). It does not replace
 * depth-judgment; it focuses it (OP-07) — these are the holes most worth reading.
 */
import { isGrounded } from "./muPrime.js";
import type { PackModel } from "../core/types.js";

function consequential(node: any): boolean {
  const fim = String(node.localContext?.failureIfMissing ?? "").trim();
  const cc = node.checkability?.candidates ?? [];
  return fim.length > 0 || cc.length > 0;
}

function connected(node: any, edgeIds: Set<string>): boolean {
  if ((node.worldLinks?.parents?.length ?? 0) > 0) return true;
  return edgeIds.has(node.id);
}

export function muDepth(pack: PackModel, artifacts: Set<string>): number {
  const edgeIds = new Set<string>();
  for (const e of (pack.graph as any).edges ?? []) {
    const from = e.from ?? e.source;
    const to = e.to ?? e.target;
    if (from) edgeIds.add(from);
    if (to) edgeIds.add(to);
  }
  let deep = 0;
  for (const n of pack.graph.nodes as any[]) {
    if (!(consequential(n) && connected(n, edgeIds))) continue; // shallow node → its grounded holes are not deep
    if (
      n.truth === "residue" &&
      isGrounded(`${n.label} ${n.localContext?.summary ?? ""}`, artifacts)
    )
      deep++;
    for (const u of n.epistemics?.unknowns ?? []) {
      if (isGrounded(u, artifacts)) deep++;
    }
  }
  return deep;
}
