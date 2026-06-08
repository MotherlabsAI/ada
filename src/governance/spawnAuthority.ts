/**
 * Spawn authority as a strictly-dominated capability token (ada-improvement-blueprint PLAN.002 /
 * invariant ORCH.003 — "spawn authority descends as a (depth, fan-out) capability token; it is never
 * ambient"). The recursion-safety floor for any fleet: the root grant is set by the human (A4); a
 * child may re-delegate ONLY by passing a grant that strictly shrinks depth and never exceeds fan-out.
 * No agent can escalate its own authority — the chain is monotone non-increasing, by construction.
 *
 * Pure + deterministic (A3): the compiler-side spec + checker of the primitive, NOT a runtime that
 * spawns agents (that is executor-side — ada-foundation / agent-runtime — "borrow the harness").
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

/** A spawn capability token: how deep this branch may still go, and how wide at each level. */
export interface SpawnGrant {
  depth: number;
  fanout: number;
}

/** A child grant is admissible iff it strictly shrinks depth AND never exceeds the parent's fan-out. */
export function isStrictlyDominated(
  child: SpawnGrant,
  parent: SpawnGrant,
): boolean {
  return child.depth < parent.depth && child.fanout <= parent.fanout;
}

/** Validate a delegation chain root→…→leaf: every hop must be strictly dominated by its predecessor. */
export function validateGrantChain(chain: SpawnGrant[]): {
  ok: boolean;
  violationAt?: number;
} {
  for (let i = 1; i < chain.length; i++) {
    if (!isStrictlyDominated(chain[i]!, chain[i - 1]!)) {
      return { ok: false, violationAt: i };
    }
  }
  return { ok: true };
}

/** Project the spawn-authority contract as an emitted pack file (the rule the fleet obeys). */
export function projectSpawnAuthority(model: PackModel): ExportFile {
  return {
    path: "SPAWN_AUTHORITY.md",
    content: [
      `# Spawn Authority — ${model.slug}`,
      "",
      "> The recursion-safety floor for a governed fleet (blueprint PLAN.002 / ORCH.003). Spawn",
      "> authority is a **capability token**, not an ambient permission. No agent can escalate.",
      "",
      "## The token",
      "Every dispatch envelope carries `spawnGrant: { depth, fanout }`:",
      "- **depth** — how many more levels this branch may spawn below itself.",
      "- **fanout** — the maximum children at each level.",
      "",
      "## The rules",
      "1. **Root is human-set (A4).** The top-level grant is set by the human governor; it is the only",
      "   place authority enters. Below it, authority can only shrink.",
      "2. **Children must be strictly dominated.** A node may re-delegate only by passing a grant with",
      "   `child.depth < parent.depth` AND `child.fanout <= parent.fanout`. Equal depth or larger",
      "   fan-out is an escalation — rejected.",
      "3. **Never ambient.** Authority travels only inside the token. An agent that finds itself without",
      "   a grant has no authority to spawn — it stops (a hole beats an unauthorized leap).",
      "",
      "## Why",
      "A monotone non-increasing (depth, fan-out) chain bounds the total fleet a priori: no runaway",
      "recursion, no agent minting its own authority. The bound is structural, checkable, and set by",
      "the human once — governance amortizes over the grant, not over every spawned agent (ROOT.001).",
      "",
    ].join("\n"),
  };
}
