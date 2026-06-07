/**
 * μ′ — the GROUNDED-unknown measure: excavation QUALITY, not convergence.
 *
 * μ (mu.ts) counts open holes and a bounded loop tried to drive it DOWN — but that
 * optimizes against Ada's purpose: surfacing unknown-unknowns IS the product, not a defect
 * (memory: ada-value-thesis). An N=3 eval showed repo-aware compile did not reduce μ, yet its
 * holes named REAL files (graph.json, GATES.md) where intent-only stayed generic. μ was blind
 * to that. μ′ sees it: a hole counts only if it cites a real ∵-source artifact. μ′ is
 * MAXIMIZED — more grounded unknowns = better excavation.
 *
 * Pure, deterministic, no model (A3). "Grounded" = the hole text contains a real filename or
 * exported-symbol token from the ingest manifest — a full token, never a generic word
 * ("graph" ≠ graph.json), so the measure does not reward vague prose.
 */
import type { SourceManifest } from "../compile/engine/ingest.js";
import type { PackModel } from "../core/types.js";

const EXPORT_RE =
  /export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;

/**
 * A symbol is DISTINCTIVE (safe to ground on) only if it is a compound identifier — a
 * camel/Pascal boundary, an underscore, or length ≥ 8. Bare single-word type names that
 * double as common prose ("Graph", "Seed", "Node", "Edge") are excluded, because a hole
 * saying "the graph schema" is not citing the repo. Filenames (with extension) are always
 * distinctive enough.
 */
function isDistinctiveSymbol(sym: string): boolean {
  return (
    /[a-z][A-Z]/.test(sym) ||
    /[A-Z]{2,}/.test(sym) ||
    sym.includes("_") ||
    sym.length >= 8
  );
}

/** The set of real artifact tokens: filenames (with extension) + DISTINCTIVE exported symbols. */
export function repoArtifacts(manifest: SourceManifest): Set<string> {
  const set = new Set<string>();
  for (const s of manifest.admitted) {
    const base = s.path.split("/").pop() ?? s.path;
    if (base.length >= 4 && base.includes(".")) set.add(base.toLowerCase()); // graph.json, GATES.md
    for (const m of s.content.matchAll(EXPORT_RE)) {
      const sym = m[1];
      if (sym && isDistinctiveSymbol(sym)) set.add(sym.toLowerCase()); // ingestRepo, PackModel — not Graph
    }
  }
  return set;
}

/** Tokens a hole text could use to cite an artifact: filenames (a.b) and ≥4-char identifiers. */
function tokensOf(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9_]+\.[a-z0-9]+|[a-z0-9_]{4,}/g) ?? [];
}

/** A hole is grounded iff its text cites a real artifact token (full token, not a generic word). */
export function isGrounded(text: string, artifacts: Set<string>): boolean {
  return tokensOf(text).some((tok) => artifacts.has(tok));
}

/**
 * μ′ = count of GROUNDED holes in a pack: every Ω-residue node (label + summary) and every
 * unresolved unknown whose text cites a real artifact. Higher is better (more grounded
 * excavation). The same artifact set must be used across arms for a fair comparison.
 */
export function muPrime(pack: PackModel, artifacts: Set<string>): number {
  let grounded = 0;
  for (const n of pack.graph.nodes) {
    if (n.truth === "residue") {
      const text = `${n.label} ${n.localContext?.summary ?? ""}`;
      if (isGrounded(text, artifacts)) grounded++;
    }
    for (const u of n.epistemics?.unknowns ?? []) {
      if (isGrounded(u, artifacts)) grounded++;
    }
  }
  return grounded;
}
