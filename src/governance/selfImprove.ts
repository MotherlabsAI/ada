/**
 * The recursive self-improvement HARNESS — the mechanical half of organ 11 (K7/K9).
 *
 * "Self-improvement is artifact improvement under verification, not unconstrained self-
 * modification." A proposed patch to Ada's own harness (a prompt, a schema, an eval) may be
 * promoted ONLY if it survives three deterministic checks: (1) the shadow-compile DIFF of the
 * old vs new compiler on a frozen seed is inspectable, (2) the regression suite stays green
 * (run externally — `pnpm test`), and (3) it WEAKENS NO GATE — a patch may never remove a
 * verification, a constraint, or a safety check to "improve" convenience (K10.7 / C10.7).
 *
 * This module is the pure, model-free core of (1) and (3): `diffGraphs` and `checkGateWeakening`.
 * The patch POLICY — what Ada is permitted to auto-edit — is a human decision (A4), held outside.
 */
import type { Graph, NodeCapsule } from "../core/types.js";

export interface GraphDiff {
  addedNodes: string[];
  removedNodes: string[];
  /** Same id, but label / semanticType / truth changed. */
  changedNodes: string[];
  addedEdges: number;
  removedEdges: number;
}

const nodeKey = (n: NodeCapsule): string =>
  `${n.label}|${n.semanticType ?? ""}|${n.truth}`;
const edgeKey = (e: Graph["edges"][number]): string =>
  `${e.from}|${e.to}|${e.type}`;

/**
 * The shadow-compile diff (pure): what a patch changed in the compiled graph. Added/removed by
 * node id; changed = same id whose meaning-bearing fields moved. Edge churn is counted. This is
 * the inspectable evidence a self-patch must produce — you cannot promote a change you cannot see.
 */
export function diffGraphs(before: Graph, after: Graph): GraphDiff {
  const beforeIds = new Set(before.nodes.map((n) => n.id));
  const afterIds = new Set(after.nodes.map((n) => n.id));
  const beforeById = new Map(before.nodes.map((n) => [n.id, n]));
  const changedNodes: string[] = [];
  for (const n of after.nodes) {
    const prev = beforeById.get(n.id);
    if (prev && nodeKey(prev) !== nodeKey(n)) changedNodes.push(n.id);
  }
  const beforeEdges = new Set(before.edges.map(edgeKey));
  const afterEdges = new Set(after.edges.map(edgeKey));
  return {
    addedNodes: after.nodes.map((n) => n.id).filter((id) => !beforeIds.has(id)),
    removedNodes: before.nodes
      .map((n) => n.id)
      .filter((id) => !afterIds.has(id)),
    changedNodes,
    addedEdges: [...afterEdges].filter((e) => !beforeEdges.has(e)).length,
    removedEdges: [...beforeEdges].filter((e) => !afterEdges.has(e)).length,
  };
}

export interface GateWeakening {
  ok: boolean;
  /** Gates present BEFORE the patch but absent AFTER — the disqualifying removals. */
  removed: string[];
}

/**
 * The anti-corruption invariant (K10.7 / C10.7): a patch may ADD gates but never REMOVE one.
 * `before`/`after` are the sets of gate names (e.g. design-contract test titles, C-invariants,
 * axiom ids). Any gate in `before` missing from `after` is a weakening — the patch is rejected,
 * however much else it improves. Pure.
 */
export function checkGateWeakening(
  before: readonly string[],
  after: readonly string[],
): GateWeakening {
  const afterSet = new Set(after);
  const removed = [...new Set(before)].filter((g) => !afterSet.has(g));
  return { ok: removed.length === 0, removed };
}

/** Extract the enforced-gate names from a test source — the `test("…")` / `it("…")` titles. */
export function extractGates(testSource: string): string[] {
  const out: string[] = [];
  const re = /\b(?:test|it)\(\s*["'`]([^"'`]+)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(testSource)) !== null) out.push(m[1]!);
  return out;
}

export interface PatchVerdict {
  promotable: boolean;
  gateCheck: GateWeakening;
  diff: GraphDiff;
  reasons: string[];
}

/**
 * Combine the deterministic gates of a self-patch into one verdict. `promotable` requires NO gate
 * weakening; the graph diff is attached as the mandatory inspectable evidence (the human/regression
 * gate sits on top). A patch that removes any gate is never promotable, full stop.
 */
export function verifyPatch(args: {
  before: Graph;
  after: Graph;
  gatesBefore: readonly string[];
  gatesAfter: readonly string[];
}): PatchVerdict {
  const gateCheck = checkGateWeakening(args.gatesBefore, args.gatesAfter);
  const diff = diffGraphs(args.before, args.after);
  const reasons: string[] = [];
  if (!gateCheck.ok) {
    reasons.push(
      `rejected — weakens ${gateCheck.removed.length} gate(s): ${gateCheck.removed.join(", ")}`,
    );
  }
  if (diff.removedNodes.length) {
    reasons.push(
      `note — drops ${diff.removedNodes.length} node(s); confirm intended`,
    );
  }
  return { promotable: gateCheck.ok, gateCheck, diff, reasons };
}
