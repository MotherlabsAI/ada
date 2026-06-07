/**
 * Pack coherence guard (AXIOM A2: excavation over generation — a hole beats a lie).
 *
 * A compiled pack must not CLAIM a backing it does not ship. The executor export
 * (CLAUDE.md) previously asserted that every MUST rule was "backed by a runnable
 * check in c/checks/" — but the generic engine cannot yet lower a node's natural-
 * language κ candidate into a runnable check, so for any non-showcase pack that
 * claim was false (the booking checks were emitted into every pack). This guard
 * makes that lie unwritable: if the document claims runnable-check backing, the
 * pack MUST actually ship runnable checks, else the write fails closed.
 *
 * Pure and deterministic — no model, no IO (AXIOM A3).
 */
export interface BackingVerdict {
  honest: boolean;
  reason?: string;
}

/** Phrases that assert a runnable, already-shipped C-check backing. */
const RUNNABLE_BACKING_CLAIM =
  /backed by a runnable check in `c\/checks\/`|stays runnable via `c\/checks\/verify\.mjs`|enforced by a deterministic C check/;

/**
 * Verify the executor doc does not over-claim. When the pack ships runnable checks
 * the claim is allowed; otherwise any runnable-backing phrase is a lie.
 */
export function assertBackingHonest(
  claudeMarkdown: string,
  shipsRunnableChecks: boolean,
): BackingVerdict {
  if (shipsRunnableChecks) return { honest: true };
  const m = RUNNABLE_BACKING_CLAIM.exec(claudeMarkdown);
  if (m) {
    return {
      honest: false,
      reason: `CLAUDE.md claims runnable-check backing ("${m[0]}") but the pack ships no runnable checks — emit the executor-implements framing instead (A2: a hole beats a lie)`,
    };
  }
  return { honest: true };
}
