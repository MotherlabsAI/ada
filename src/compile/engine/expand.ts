/**
 * Fractal expansion — the deterministic core of `ada expand` (travel the language by descending a node
 * into its own sub-tree). A node carries its own meaning, so it can SEED a sub-compile; recursing is
 * "travel the language." But depth is only TRUE under three governors — here are the two pure ones plus
 * the seed derivation (the third, budget, is the discovery-hole `≤k` primitive; provenance is the
 * truth-monotonicity check). Model-free (A3): these decide what may be expanded and when to stop.
 *
 *   canExpand   — you may descend GROUND, never a hole. Expanding an Ω invents depth where there is
 *                 none (A2): a hole is a leaf, you mark it, you don't descend it.
 *   expandSeed  — the node's meaning becomes the sub-compile's intent; its unknowns seed the sub-residue.
 *   isSaturated — stop a branch when expansion surfaces NO new grounded sense (only restatement/holes).
 */
import type { NodeCapsule, Seed } from "../../core/types.js";
import { engineCompile, type EngineCompileOptions } from "./compile.js";

/** A node may be expanded iff it is grounded — never a pure hole (Ω). */
export function canExpand(node: NodeCapsule): { ok: boolean; reason: string } {
  if (node.truth === "residue" || node.semanticType === "Unknown") {
    return {
      ok: false,
      reason:
        "a hole is a leaf, not a seed — expanding an Ω would invent depth where there is none (A2)",
    };
  }
  return {
    ok: true,
    reason: "grounded node — expandable into its own sub-tree",
  };
}

/** Derive the sub-compile Seed from a node: its meaning is the intent, its unknowns seed the residue. */
export function expandSeed(node: NodeCapsule, parent: Seed): Seed {
  const c = node.localContext;
  return {
    ...parent,
    rootIntent: `${node.label}: ${c?.summary ?? ""}`.trim(),
    buildObjective: c?.whyItMatters?.trim() || parent.buildObjective,
    // The node's own open questions become the sub-compile's open context — the residue descends honestly.
    unknownContext: node.epistemics?.unknowns ?? [],
  };
}

/** Minimal shape of a sub-compile's emitted nodes that saturation needs. */
interface SubNode {
  truth: "source" | "inference" | "residue";
  fromPrompt: string[];
}

/**
 * A branch is SATURATED when the expansion adds no new grounded sense: every grounded sub-node only
 * restates the parent (its fromPrompt fragments are all already in the parent's text), and the rest are
 * holes. Saturation — not holes→0 — is convergence: deeper here yields no further truth, so it is a leaf.
 */
export function isSaturated(parent: NodeCapsule, subNodes: SubNode[]): boolean {
  const c = parent.localContext;
  const parentText =
    `${parent.label} ${c?.summary ?? ""} ${c?.whyItMatters ?? ""}`.toLowerCase();
  const introducesNewGround = (n: SubNode): boolean =>
    n.truth !== "residue" &&
    n.fromPrompt.some(
      (f) => f.trim() !== "" && !parentText.includes(f.toLowerCase()),
    );
  return !subNodes.some(introducesNewGround);
}

/** Derive the nested sub-pack slug for a node — the postcode extends: <parent>__<NODE.ID>. */
export function subPackSlug(parentSlug: string, nodeId: string): string {
  return `${parentSlug}__${nodeId}`.replace(/[^a-z0-9._-]+/gi, "-");
}

export interface ExpandResult {
  /** False when the node is a hole (a leaf, not a seed) — no compile was run. */
  expanded: boolean;
  reason: string;
  /** The sub-pack slug, when expanded. */
  subSlug?: string;
  /** Whether the expansion saturated — deeper here yields no new ground (it is a leaf). */
  saturated?: boolean;
  nodeCount?: number;
}

/**
 * Descend ONE node into its own sub-pack: refuse a hole (a leaf), else derive the sub-seed from the
 * node's meaning, run the budgeted engine compile, and report whether the branch saturated. Composes
 * the pure governors with the existing engine seam (one more compile-time call, A1/A9). The recursive
 * traversal and the CLI verb call this; budget = `opts.perCluster` (the ≤k discovery bound).
 */
export async function expandNode(args: {
  cwd: string;
  parentSlug: string;
  node: NodeCapsule;
  parentSeed: Seed;
  opts?: EngineCompileOptions;
}): Promise<ExpandResult> {
  const gate = canExpand(args.node);
  if (!gate.ok) return { expanded: false, reason: gate.reason };

  const subSlug = subPackSlug(args.parentSlug, args.node.id);
  const seed = expandSeed(args.node, args.parentSeed);
  const { model } = await engineCompile({
    cwd: args.cwd,
    slug: subSlug,
    intent: seed.rootIntent,
    seed,
    opts: args.opts ?? {},
  });
  const saturated = isSaturated(
    args.node,
    model.graph.nodes.map((n) => ({
      truth: n.truth,
      fromPrompt: [] as string[],
    })),
  );
  return {
    expanded: true,
    reason: saturated
      ? "expanded, but saturated — deeper here yields no new ground (a leaf)"
      : "expanded — new ground surfaced; descend further if budget remains",
    subSlug,
    saturated,
    nodeCount: model.graph.nodes.length,
  };
}
