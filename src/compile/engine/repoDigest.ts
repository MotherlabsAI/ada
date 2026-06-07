/**
 * repoDigest — COMPILE an ingested repo into a dense, bounded context block (NOT a dump).
 *
 * Repo-aware compile (spine step 1) feeds Ada the existing code so it builds ON what is
 * already there instead of inventing "unspecified" holes for things that live in src/.
 * But the attention-budget law (memory: ada-value-thesis) forbids dumping: 94 files of raw
 * content would blow the window and rot signal. So the digest is *compiled* — one
 * high-signal line per source (path · kind · exported symbols / heading), capped to a byte
 * budget, with an HONEST `+N more` when truncated (no silent drop — AXIOM A2).
 *
 * Pure, deterministic, no model (A3). Output is ∵ source context (every line cites a path).
 */
import type { SourceManifest, IngestedSource } from "./ingest.js";

const EXPORT_RE =
  /export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;

/** The high-signal line for one source — symbols for code, heading for docs, kind otherwise. */
function signalOf(s: IngestedSource): string {
  if (s.kind === "code") {
    const syms: string[] = [];
    for (const m of s.content.matchAll(EXPORT_RE)) {
      if (m[1] && !syms.includes(m[1])) syms.push(m[1]);
      if (syms.length >= 8) break;
    }
    return syms.length ? syms.join(", ") : "(no exports)";
  }
  if (s.kind === "doc") {
    const h = s.content
      .split(/\r?\n/)
      .find((l) => /^#{1,6}\s+\S/.test(l.trim()));
    return h ? h.replace(/^#{1,6}\s+/, "").trim() : "(no heading)";
  }
  return `(${s.kind})`;
}

export function repoDigest(
  manifest: SourceManifest,
  opts: { maxBytes?: number } = {},
): string {
  const maxBytes = opts.maxBytes ?? 8000;
  if (!manifest.admitted.length) return "(no source files admitted)";

  const header =
    "Existing repo (∵ source — build ON this, cite paths, do NOT re-derive what already exists):\n";
  const lines = manifest.admitted.map(
    (s) => `- ${s.path} (${s.kind}): ${signalOf(s)}`,
  );

  const out: string[] = [header.trimEnd()];
  let used = Buffer.byteLength(header, "utf8");
  let shown = 0;
  for (const line of lines) {
    const cost = Buffer.byteLength(line + "\n", "utf8");
    // reserve room for the honest truncation note
    if (used + cost > maxBytes - 48) break;
    out.push(line);
    used += cost;
    shown++;
  }
  const dropped = lines.length - shown;
  if (dropped > 0)
    out.push(`- … +${dropped} more sources (see the ingest manifest)`);
  return out.join("\n");
}
