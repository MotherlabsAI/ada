/**
 * Monotone revocation channel (ada-autonomy-gaps PLAN.005 / GOV.003 — "bounded autonomy must stay
 * bounded-latency revocable"). The answer to "no babysitting" is not absence of oversight — it is
 * PASSIVE SOVEREIGNTY: you do not watch the loop; you hold an append-only governance channel of
 * authority deltas (PAUSE | NARROW | REVOKE) that the orchestrator reads at EVERY idempotent
 * checkpoint, so a revocation takes effect within one checkpoint (bounded latency). The channel is
 * MONOTONE: it can only ever SHRINK authority. The loop can never re-grant itself — raising authority
 * back up requires a fresh human compile (A4). Pure, model-free (A3): the fold the runtime applies.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

/** Authority levels, totally ordered by how much the loop may do. */
export type Authority = "active" | "narrowed" | "paused" | "revoked";
/** The only deltas the channel carries — every one shrinks (or holds) authority. */
export type Delta = "NARROW" | "PAUSE" | "REVOKE";

const RANK: Record<Authority, number> = {
  active: 3,
  narrowed: 2,
  paused: 1,
  revoked: 0,
};
const TARGET: Record<Delta, Authority> = {
  NARROW: "narrowed",
  PAUSE: "paused",
  REVOKE: "revoked",
};

/** Numeric rank — higher = more authority. */
export function authorityRank(a: Authority): number {
  return RANK[a];
}

/** Apply one delta: authority moves to the LOWER of current and the delta's target — never higher. */
export function applyDelta(current: Authority, delta: Delta): Authority {
  const target = TARGET[delta];
  return RANK[target] < RANK[current] ? target : current;
}

/** Fold an append-only delta sequence — the result is the floor of all deltas seen. */
export function applyChannel(start: Authority, deltas: Delta[]): Authority {
  return deltas.reduce(applyDelta, start);
}

/** A trace is monotone iff authority never increases (no re-grant slipped through the channel). */
export function isMonotone(trace: Authority[]): boolean {
  for (let i = 1; i < trace.length; i++) {
    if (RANK[trace[i]!] > RANK[trace[i - 1]!]) return false;
  }
  return true;
}

/** Project the revocation contract the runtime orchestrator polls at every checkpoint. */
export function projectRevocation(model: PackModel): ExportFile {
  return {
    path: "REVOCATION.md",
    content: [
      `# Revocation Channel — ${model.slug}`,
      "",
      '> "No babysitting" is **passive sovereignty**, not absence of oversight. You do not watch the loop —',
      "> you hold an append-only governance channel the orchestrator reads at EVERY idempotent checkpoint.",
      "> Revocation takes effect within one checkpoint: **bounded-latency revocable** (GOV.003).",
      "",
      "## the deltas (all shrink authority; the channel is monotone)",
      "- **NARROW** — `active → narrowed`: shrink the loop's envelope (fewer permitted actions/paths).",
      "- **PAUSE** — `… → paused`: the loop holds at the next checkpoint, mutating nothing.",
      "- **REVOKE** — `… → revoked`: terminal stop; the loop tears down at the next checkpoint.",
      "",
      "## the invariant",
      "Authority is **monotone non-increasing** through the channel: a delta can only LOWER it. The loop",
      "can never re-grant itself, and the channel carries no GRANT op. Raising authority back up requires",
      "a **fresh human compile** (A4) — re-entering through the front-loaded governance gate, never mid-run.",
      'This is what keeps "bounded autonomy" bounded: the human\'s hand is off the wheel but never off the',
      "brake, and the loop physically cannot widen its own lane.",
      "",
    ].join("\n"),
  };
}
