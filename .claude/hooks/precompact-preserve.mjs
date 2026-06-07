#!/usr/bin/env node
/**
 * PreCompact preserve-quotient — bound B8 of bounded self-application.
 *
 * Compaction is the one event that can silently erase the frozen quotient. The
 * deep-research result named the proven counter: RECITATION — re-inject the load-bearing
 * core at the edge of context so a compactor cannot dilute it (Manus todo.md; combats
 * "context rot" / "lost in the middle"). This hook recites the AXIOM headers + the value
 * thesis + the active discipline before compaction, read live from AXIOMS.md (so the
 * recitation is true to the frozen core, AXIOM A2, not a stale paraphrase).
 *
 * Output goes to stdout; Claude Code surfaces PreCompact hook output around compaction.
 * FAIL OPEN: any error → exit 0 silently. The durable guarantee is AXIOMS.md on disk;
 * this is the in-context reminder to re-read it verbatim.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const repo = join(here, "..", ".."); // .claude/hooks → repo root
  let axiomHeaders = [];
  try {
    const ax = readFileSync(join(repo, "AXIOMS.md"), "utf8");
    axiomHeaders = ax
      .split(/\r?\n/)
      .filter((l) => /^##\s+A\d/.test(l))
      .map((l) => l.replace(/^##\s+/, "").trim());
  } catch {
    /* AXIOMS.md absent → recite the discipline only */
  }

  const lines = [
    "FROZEN CORE — re-read verbatim from AXIOMS.md after compaction; do not summarize away:",
    ...axiomHeaders.map((h) => `  • ${h}`),
    "",
    "Value thesis: outcome quality is bounded by the model's finite ATTENTION BUDGET —",
    "the win is the smallest high-signal, coherence-preserving token set (see memory:",
    "ada-value-thesis). Active discipline: BOUNDED SELF-APPLICATION (governance/invariants.md)",
    "— the AXIOMS are the frozen quotient; change them only by a human-ratified delta.",
  ];
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
} catch {
  process.exit(0); // fail open
}
