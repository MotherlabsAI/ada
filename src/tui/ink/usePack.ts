/**
 * Read-only pack projection for the Ink workbench.
 *
 * The TUI is a *projection* of the on-disk pack, never the source of truth
 * (plan: "the TUI is a projection"). This module reuses `loadPack` from the
 * readline navigator so the two front-ends stay interchangeable, and reads the
 * pack's `.state.json` using the same shape the navigator writes (PackState).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Graph, PackManifest } from "../../core/types.js";
import { loadPack } from "../navigator.js";
import { packsRoot } from "../../pack/layout.js";

export interface PackData {
  graph: Graph;
  manifest: PackManifest;
  /** Absolute path to the pack's `.state.json`. */
  stateFile: string;
}

/** A pack as it appears in the welcome "your projects" list — counts only. */
export interface PackSummary {
  slug: string;
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
}

/**
 * List the packs under `.ada/packs/`, newest-first, reading each `manifest.json`
 * for its counts. Tolerant of a missing root, non-pack dirs, and corrupt/absent
 * manifests (those are skipped) — so the welcome's "your projects" panel never
 * throws and shows a clean empty state when there are none.
 */
export function listPacks(cwd: string): PackSummary[] {
  let entries: string[];
  try {
    entries = readdirSync(packsRoot(cwd), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
  const out: PackSummary[] = [];
  for (const slug of entries) {
    const manifestPath = join(packsRoot(cwd), slug, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf8")) as PackManifest;
      out.push({
        slug: m.slug ?? slug,
        nodes: m.nodeCount ?? 0,
        checks: m.checkCount ?? 0,
        residue: m.residueCount ?? 0,
        clusters: Array.isArray(m.clusters) ? m.clusters.length : 0,
      });
    } catch {
      // Corrupt manifest → skip; a broken pack must not break the welcome.
    }
  }
  return out;
}

/** Persisted navigator state — mirrors PackState in src/tui/navigator.ts. */
export interface PackState {
  flagged: string[];
  rejected: string[];
  lastNode?: string;
}

/** Load a pack as plain, read-only data. Pure: no React, no mutation. */
export function loadPackData(cwd: string, slug: string): PackData {
  const { graph, manifest, stateFile } = loadPack(cwd, slug);
  return { graph, manifest, stateFile };
}

/** Read persisted flagged/rejected/last state. Tolerant of a missing/corrupt file. */
export function readPackState(stateFile: string): PackState {
  if (!existsSync(stateFile)) return { flagged: [], rejected: [] };
  try {
    const parsed = JSON.parse(readFileSync(stateFile, "utf8")) as PackState;
    return {
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
      ...(parsed.lastNode ? { lastNode: parsed.lastNode } : {}),
    };
  } catch {
    return { flagged: [], rejected: [] };
  }
}

/**
 * Persist flagged/rejected/last back to `.state.json`, byte-compatible with the
 * navigator's writer (2-space JSON + trailing newline). The TUI only ever writes
 * *state*, never the pack itself — the pack stays the source of truth.
 */
export function writePackState(stateFile: string, state: PackState): void {
  const out: PackState = {
    flagged: state.flagged,
    rejected: state.rejected,
    ...(state.lastNode ? { lastNode: state.lastNode } : {}),
  };
  writeFileSync(stateFile, JSON.stringify(out, null, 2) + "\n", "utf8");
}
