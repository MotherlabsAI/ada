/**
 * The monotone passing-set ratchet (ada-autonomy-gaps PLAN.001 / ROOT.003 + VER.002). Repair must
 * ratchet, never thrash: before every repair attempt, checkpoint the set of currently-green C-checks,
 * each pinned to its verifying artifact's content hash. A candidate patch is admitted ONLY if the new
 * passing-set ⊇ the old one — no previously-green check goes red (the monotone gate). And a green is
 * never INHERITED: it expires the moment its artifact's hash drifts (VER.002), so a stale green can't
 * be coasted on — it must be re-earned. Complements the loop variant: the ratchet prevents going
 * BACKWARD, the variant proves the loop goes FORWARD. Pure, model-free (A3).
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

export interface CheckState {
  id: string;
  green: boolean;
  /** Content hash of the artifact whose verification produced this verdict (the green's provenance). */
  artifactHash: string;
}

/** The set of currently-green check ids. */
export function passingSet(states: CheckState[]): Set<string> {
  return new Set(states.filter((s) => s.green).map((s) => s.id));
}

/** Admit a patch iff the green-set never shrinks: every check green before must still be green after. */
export function ratchetAdmits(
  before: CheckState[],
  after: CheckState[],
): { ok: boolean; regressed: string[] } {
  const afterGreen = passingSet(after);
  const regressed = [...passingSet(before)]
    .filter((id) => !afterGreen.has(id))
    .sort();
  return { ok: regressed.length === 0, regressed };
}

/**
 * Greens that have gone STALE (VER.002): the recorded artifact hash no longer matches the current one,
 * so the verdict was earned against an artifact that has since changed — it must be re-run, not trusted.
 */
export function staleGreens(
  states: CheckState[],
  hashNow: Record<string, string>,
): string[] {
  return states
    .filter(
      (s) =>
        s.green &&
        hashNow[s.id] !== undefined &&
        hashNow[s.id] !== s.artifactHash,
    )
    .map((s) => s.id)
    .sort();
}

/** Project the ratchet rule the runtime repair lane enforces before admitting any patch. */
export function projectRatchet(model: PackModel): ExportFile {
  return {
    path: "RATCHET.md",
    content: [
      `# Repair Ratchet — ${model.slug}`,
      "",
      "> Repair must **ratchet, never thrash** (PLAN.001 / ROOT.003). Before each repair attempt the loop",
      "> checkpoints the passing-set — the green C-checks, each pinned to its verifying artifact's content",
      "> hash. A candidate patch is admitted ONLY if the new passing-set ⊇ the old: no previously-green",
      "> check may go red. A patch that buys one green by breaking another is rejected outright.",
      "",
      "## no inherited greens (VER.002)",
      "A green is **re-earned, not inherited.** The moment a check's verifying artifact changes (its content",
      "hash drifts), that green EXPIRES — it cannot be coasted on. The loop re-runs it before counting it.",
      "This closes the cheat where a passing-set looks monotone only because stale verdicts were carried.",
      "",
      "## both sides of the loop",
      "- **ratchet** (this): the passing-set is monotone non-shrinking — no regress.",
      "- **variant** (LOOP_VARIANT.md): the well-founded measure strictly decreases — must progress.",
      "Together: the loop can only move toward more-green and fewer-open, and is proven to terminate.",
      "",
    ].join("\n"),
  };
}
