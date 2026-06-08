/**
 * watch.ts — render the engine's live compile snapshot (the real-time spine, read side).
 *
 * `engineCompile` writes `.compile-progress.json` as it runs (see compile/engine/progress.ts);
 * this module reads that snapshot and renders the austere live tree the `ada watch` command and
 * the `/ada` skill loop show. Two pure pieces (no process state, no timers) so they're testable:
 *   • readSnapshot — load + parse the snapshot, or null when there's nothing to watch.
 *   • renderSnapshot — fold a snapshot into the tree string (phases · per-cluster · totals).
 * The live polling loop itself lives in cli.ts (it owns stdout + timers).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { paint, bold, dim } from "../core/grammar.js";
import type { CompileSnapshot } from "../compile/engine/progress.js";

/** The on-disk location of the live snapshot for a pack (mirrors progress.ts). */
export function snapshotPath(cwd: string, slug: string): string {
  return join(cwd, ".ada", "packs", slug, ".compile-progress.json");
}

/** Load + parse the snapshot, or null when absent / mid-write-unparseable (caller decides). */
export function readSnapshot(
  cwd: string,
  slug: string,
): CompileSnapshot | null {
  const p = snapshotPath(cwd, slug);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as CompileSnapshot;
  } catch {
    return null; // a torn read (rare, since writes are atomic) — the next poll tick recovers.
  }
}

const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function glyph(status: "queued" | "running" | "done", tick: number): string {
  if (status === "done") return paint("✓", "green");
  if (status === "running") return paint(SPIN[tick % SPIN.length]!, "plum");
  return dim("·");
}

function truncate(s: string, n: number): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length <= n ? one : one.slice(0, n - 1) + "…";
}

/**
 * Render one snapshot into the live tree. `tick` advances the spinner frame on each poll; pass 0
 * for a static (`--once`) render. Pure: same snapshot + tick → same string.
 */
export function renderSnapshot(snap: CompileSnapshot, tick = 0): string {
  const head =
    snap.status === "done"
      ? paint("◈ done", "terracotta")
      : snap.status === "error"
        ? paint("✗ error", "rose")
        : paint("◈ compiling", "terracotta");
  const lines: string[] = [
    `${head}  ${bold(snap.slug)}   ${dim(truncate(snap.intent, 56))}`,
  ];

  for (const p of snap.phases) {
    const calls =
      p.callsTotal !== undefined
        ? dim(`  ${p.calls}/${p.callsTotal}`)
        : p.calls > 0
          ? dim(`  ${p.calls} calls`)
          : "";
    lines.push(`  ${glyph(p.status, tick)} ${p.label}${calls}`);
    if (p.id === "excavate" && p.clusters) {
      for (const c of p.clusters) {
        const detail =
          c.status === "queued"
            ? dim("queued")
            : dim(
                `${c.calls}/${c.callsTotal} · ${c.nodes} ${c.nodes === 1 ? "node" : "nodes"}`,
              );
        lines.push(`      ${glyph(c.status, tick)} ${c.id}  ${detail}`);
      }
    }
  }

  const t = snap.totals;
  const cost = `$${(t.costUsd ?? 0).toFixed(2)}`;
  lines.push(
    `  ${dim("live:")} ${bold(String(t.nodes))} nodes · ${t.edges} edges · ${paint(`${t.residue}Ω`, "amber")} · ${t.calls} calls · ${cost}`,
  );
  if (snap.status === "error" && snap.lastError) {
    lines.push(`  ${paint(`✗ ${snap.lastError}`, "rose")}`);
  }
  return lines.join("\n");
}
