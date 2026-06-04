/**
 * engineSeed — the minimal, intent-derived Seed for the engine compile path (AXIOM A2: every
 * field traces to the stated intent, never a domain literal). Extracted here so BOTH front-ends
 * — the CLI (`ada compile --engine`) and the TUI's Compile flow — derive the same bare Seed
 * before handing it to the shared `engineCompile` seam. Pure: no model, no I/O.
 *
 * The excavator reads rootIntent/domain/objective + the cluster; the pack's own richer Seed is
 * DERIVED by `assemblePackGated` from the intent + kept nodes (so a bare compile never carries a
 * showcase/booking literal). When the `ctx init` interview captures a richer Seed, THAT drives
 * the pack instead — this is only the floor.
 */
import type { Seed } from "../../core/types.js";

export function engineSeed(intent: string): Seed {
  const domain = intent.replace(/^(a|an|the)\s+/i, "").trim() || intent;
  return {
    rootIntent: intent,
    domain,
    userRole: "The person who brought this intent",
    buildObjective: `Compile a working world model of ${domain} an executor can build from.`,
    knowledgeObjective: `A navigable, compounding map of ${domain}.`,
    trustObjective:
      "Deterministic checks where the structure is checkable; honest residue where it is not.",
    knownContext: [
      "Derived solely from the stated intent; no external facts assumed.",
    ],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: [],
  };
}
