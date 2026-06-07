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

export interface DigestOptions {
  /** total byte budget for the whole digest (default 8000) */
  maxBytes?: number;
  /** byte budget for the Tier-1 KEY FILES content section (default maxBytes/2) */
  focusBytes?: number;
  /** per-file cap on KEY FILES content (default 1500) */
  perFocusBytes?: number;
  /** which paths are high-salience (content included). Default: AXIOMS, types.ts, schemas, governance. */
  isFocus?: (path: string) => boolean;
}

/**
 * The default high-salience set: the files that DEFINE the system, so the excavator reads
 * their content, not just their name. AXIOMS (the frozen core), the type/schema source, and
 * the governance invariants — the exact files whose absence left "schema unspecified" holes.
 */
function isDefaultFocus(path: string): boolean {
  return (
    /(^|\/)AXIOMS\.md$/.test(path) ||
    /(^|\/)types\.ts$/.test(path) ||
    /\.schema\.(json|ts)$/.test(path) ||
    /(^|\/)governance\/[^/]+\.md$/.test(path)
  );
}

/**
 * Salience rank within the focus tier (lower = included first under a tight budget). The
 * schema/types come first because they collapse the most holes ("graph.json schema
 * unspecified"); then the frozen core (AXIOMS); then governance. Without this the schema
 * loses its focus slot to alphabetically-earlier files and the deep hole survives.
 */
function focusRank(path: string): number {
  if (/\.schema\.(json|ts)$/.test(path) || /(^|\/)types\.ts$/.test(path))
    return 0;
  if (/(^|\/)AXIOMS\.md$/.test(path)) return 1;
  return 2;
}

export function repoDigest(
  manifest: SourceManifest,
  opts: DigestOptions = {},
): string {
  const maxBytes = opts.maxBytes ?? 8000;
  const perFocusBytes = opts.perFocusBytes ?? 1200;
  const focusBytes = opts.focusBytes ?? Math.floor(maxBytes / 2);
  const isFocus = opts.isFocus ?? isDefaultFocus;
  if (!manifest.admitted.length) return "(no source files admitted)";

  const focus = manifest.admitted
    .filter((s) => isFocus(s.path))
    .sort((a, b) => focusRank(a.path) - focusRank(b.path));
  const rest = manifest.admitted.filter((s) => !isFocus(s.path));

  const out: string[] = [
    "Existing repo (∵ source — build ON this, cite paths, do NOT re-derive what already exists):",
  ];
  const cost = (s: string) => Buffer.byteLength(s + "\n", "utf8");
  let used = cost(out[0]!);

  // Tier 1 — KEY FILES (content). The few files that DEFINE the system get real content,
  // capped per file and in aggregate, so a deep hole ("what is graph.json's schema?") can
  // actually collapse instead of staying "exists but unknown".
  if (focus.length) {
    const head =
      "\n## KEY FILES (content — these define the system; honor them, do not re-derive):";
    out.push(head);
    used += cost(head);
    let focusUsed = 0;
    for (const s of focus) {
      const block = `### ${s.path}\n${focusContent(s, perFocusBytes)}`;
      const c = cost(block);
      if (focusUsed + c > focusBytes || used + c > maxBytes - 64) break;
      out.push(block);
      used += c;
      focusUsed += c;
    }
  }

  // Tier 2 — INDEX (symbols/heading). Everything else, one high-signal line each.
  const idxHead = "\n## INDEX (path · exports/heading):";
  out.push(idxHead);
  used += cost(idxHead);
  const lines = rest.map((s) => `- ${s.path} (${s.kind}): ${signalOf(s)}`);
  let shown = 0;
  for (const line of lines) {
    if (used + cost(line) > maxBytes - 48) break;
    out.push(line);
    used += cost(line);
    shown++;
  }
  const dropped = lines.length - shown;
  if (dropped > 0)
    out.push(`- … +${dropped} more sources (see the ingest manifest)`);
  return out.join("\n");
}

/** Cap content to a byte budget with an HONEST truncation marker (A2 — no silent drop). */
function capContent(content: string, maxBytes: number): string {
  const buf = Buffer.from(content, "utf8");
  if (buf.length <= maxBytes) return content.trim();
  return (
    buf.subarray(0, maxBytes).toString("utf8").trim() +
    "\n… [content truncated]"
  );
}

/**
 * The high-signal content of a focus source. For code, the SCHEMA is the exported
 * interface/type/enum DECLARATIONS — not a byte-prefix (which on a large file is early noise,
 * not the Seed/Graph types a hole needs). Extract those declaration blocks up to the budget;
 * fall back to a capped prefix when no declarations are found (or for docs).
 */
function focusContent(
  source: { kind: string; content: string },
  maxBytes: number,
): string {
  if (source.kind !== "code") return capContent(source.content, maxBytes);
  return (
    codeDeclarations(source.content, maxBytes) ??
    capContent(source.content, maxBytes)
  );
}

const DECL_RE =
  /export\s+(?:default\s+)?(?:abstract\s+)?(interface|type|class|enum)\s+[A-Za-z0-9_$]+/g;

/** Pull exported interface/type/class/enum declaration blocks, brace-balanced, up to a budget. */
function codeDeclarations(content: string, maxBytes: number): string | null {
  const blocks: string[] = [];
  let used = 0;
  for (const m of content.matchAll(DECL_RE)) {
    const start = m.index ?? 0;
    let end: number;
    if (m[1] === "type") {
      const semi = content.indexOf(";", start);
      const nl = content.indexOf("\n", start);
      end = semi >= 0 ? semi + 1 : nl >= 0 ? nl : content.length;
    } else {
      const open = content.indexOf("{", start);
      if (open < 0) {
        const nl = content.indexOf("\n", start);
        end = nl >= 0 ? nl : content.length;
      } else {
        let depth = 0;
        let i = open;
        for (; i < content.length; i++) {
          if (content[i] === "{") depth++;
          else if (content[i] === "}" && --depth === 0) {
            i++;
            break;
          }
        }
        end = i;
      }
    }
    const block = content.slice(start, end).trim();
    const cost = Buffer.byteLength(block + "\n\n", "utf8");
    if (used + cost > maxBytes) break;
    blocks.push(block);
    used += cost;
  }
  return blocks.length ? blocks.join("\n\n") : null;
}
