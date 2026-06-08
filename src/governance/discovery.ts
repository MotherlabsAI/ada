/**
 * Budgeted reserved-hole DISCOVERY nodes (ada-improvement-blueprint PLAN.004 — "emit a budgeted
 * reserved-hole DISCOVERY node where the compile knows it is blind"). When a node's decomposition is
 * epistemically downstream — it cannot be pre-enumerated now because the information arrives only after
 * upstream work — the honest move is neither to hallucinate the children nor silently omit them, but to
 * reserve an EXPLICIT, BOUNDED hole: `DISCOVERY{ at, ≤k children, gated_by human, truth=residue }`. A
 * future compile (or agent) may expand it, within budget, under the gate — never auto-filled (A2).
 * Pure, model-free (A3): the compiler-side spec, projecting the pack's open holes as reserved budgets.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

/** Default expansion budget per reserved hole — bounds how much a later compile may grow here. */
const DEFAULT_MAX_CHILDREN = 5;

export interface DiscoveryHole {
  at: string;
  label: string;
  maxChildren: number;
  gatedBy: string;
}

const isBlind = (n: NodeCapsule): boolean =>
  n.semanticType === "Unknown" || n.truth === "residue";

/** Reserve a budgeted, gated discovery hole at every point the compile is epistemically blind. */
export function discoveryHoles(model: PackModel): DiscoveryHole[] {
  return model.graph.nodes.filter(isBlind).map((n) => ({
    at: n.id,
    label: n.label,
    maxChildren: DEFAULT_MAX_CHILDREN,
    gatedBy: "human (A4)",
  }));
}

/** Project the reserved-hole map: where the compile is blind, and the bounded way to expand it. */
export function projectDiscovery(model: PackModel): ExportFile {
  const holes = discoveryHoles(model);
  return {
    path: "DISCOVERY.md",
    content: [
      `# Discovery — reserved holes — ${model.slug}`,
      "",
      "> Where the compile KNOWS it is blind (decomposition is epistemically downstream — it cannot be",
      "> pre-enumerated). Each is a budgeted, gated reservation, not a guess: a future compile or agent",
      "> may expand it within `≤k` children, under the gate, never auto-filled. A hole beats a lie (A2).",
      "",
      "## reserved holes",
      holes.length
        ? holes
            .map(
              (h) =>
                `- \`${h.at}\` ${h.label} — budget ≤${h.maxChildren} children · gated_by ${h.gatedBy} · truth=residue`,
            )
            .join("\n")
        : "_(none — the compile is not blind anywhere it can name; no reserved holes)_",
      "",
      "## rule",
      "An agent reaching a reserved hole does NOT improvise its children. It expands only within the",
      "budget and only after the gate clears (A4). Expansion is recorded; the budget bounds runaway",
      "discovery a priori, the same way the spawn-authority token bounds the fleet (SPAWN_AUTHORITY.md).",
      "",
    ].join("\n"),
  };
}
