/**
 * μ — the convergence measure for bounded self-application (governance/invariants.md B6).
 *
 * Self-application is *bounded* only if it has a deterministic stop. μ supplies it:
 * μ = the count of OPEN holes within a frozen scope. Each cycle of Ada-on-Ada must drive
 * μ strictly down; the loop halts when μ=0 (converged), μ stalls (no progress), or fuel
 * is exhausted. The crux — μ is SCOPED — is what reconciles convergence (μ↓) with Ada's
 * core value, excavation (Ω↑): a hole surfaced in a NEW area is a human-gated scope
 * expansion (A4), not a failure to converge within the frozen scope.
 *
 * A2: a hole is a hole — holes are OPEN by construction; Ada never fakes one resolved.
 * A3: pure, deterministic, no model in the measure or the predicate.
 *
 * Sourced from the σ→C / OS⟨ClaudeCode⟩ artifacts (μ=#open holes · fuel · entailment-gate),
 * filtered to ada-context (the company/commerce layer dropped — A6/A9).
 */
import type { PackModel } from "../core/types.js";
import { clusterOf } from "../core/ids.js";

export interface Hole {
  id: string;
  /** open holes count toward μ; resolved/permanent do not (a permanent hole is admitted, not open) */
  status: "open" | "resolved" | "permanent";
  /** the frozen scope (area) the hole belongs to */
  scope: string;
}

/**
 * Extract the open holes from a pack (A2): every Ω-residue node is a hole, and every
 * unresolved unknown carried by a node is a hole. Scope = the node's area (cluster), so μ
 * can be measured per frozen scope. Holes are open by construction.
 */
export function holesOf(pack: PackModel): Hole[] {
  const holes: Hole[] = [];
  for (const n of pack.graph.nodes) {
    const scope = clusterOf(n.id);
    if (n.truth === "residue") holes.push({ id: n.id, status: "open", scope });
    const unknowns = n.epistemics?.unknowns ?? [];
    for (let i = 0; i < unknowns.length; i++) {
      holes.push({ id: `${n.id}#unk${i}`, status: "open", scope });
    }
  }
  return holes;
}

/**
 * μ = count of OPEN holes within a frozen scope. `scope === "*"` counts all scopes.
 * Scoping reconciles convergence with excavation: holes surfaced in a different area do
 * not inflate μ for the scope under measurement.
 */
export function mu(holes: Hole[], scope = "*"): number {
  return holes.filter(
    (h) => h.status === "open" && (scope === "*" || h.scope === scope),
  ).length;
}

export type HaltReason = "converged" | "fuel-exhausted" | "stalled" | null;

export interface Cycle {
  /** μ at this cycle, within the frozen scope */
  muNow: number;
  /** μ at the previous cycle within the same scope, or null on the first cycle */
  muPrev: number | null;
  fuelUsed: number;
  fuelCap: number;
}

/**
 * The deterministic halt-predicate. `converged` (μ=0) dominates — the good fixpoint.
 * A `stalled` (μ not strictly decreasing) or `fuel-exhausted` halt TERMINATES WITHOUT
 * CONVERGING: bounded ≠ converged — the loop stops, but the artifact is not proven done
 * (A4 still gates correctness). Returns the reason to halt, or null to continue.
 */
export function haltReason(c: Cycle): HaltReason {
  if (c.muNow === 0) return "converged";
  if (c.fuelUsed >= c.fuelCap) return "fuel-exhausted";
  if (c.muPrev !== null && c.muNow >= c.muPrev) return "stalled";
  return null;
}

export function shouldHalt(c: Cycle): boolean {
  return haltReason(c) !== null;
}
