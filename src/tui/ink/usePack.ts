/**
 * Read-only pack projection for the Ink workbench.
 *
 * The TUI is a *projection* of the on-disk pack, never the source of truth
 * (plan: "the TUI is a projection"). This module reuses `loadPack` from the
 * readline navigator so the two front-ends stay interchangeable, and reads the
 * pack's `.state.json` using the same shape the navigator writes (PackState).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Graph, PackManifest } from "../../core/types.js";
import { loadPack } from "../navigator.js";

export interface PackData {
  graph: Graph;
  manifest: PackManifest;
  /** Absolute path to the pack's `.state.json`. */
  stateFile: string;
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
