/**
 * Repo-aware ingestion — the prerequisite for "open Ada + Claude Code on the same
 * repo". Ada compiles greenfield intent today; this sliver lets it read an EXISTING
 * repository and emit a governed source manifest as a compile input.
 *
 * Grounded in the mined admission contract (memory: codex-markdowns-corpus —
 * ingestion.md + ada-repo-ingest-build-context.md), reduced to the A9/A5-clean core:
 *   - discovery via `git ls-files` (respects .gitignore — no node_modules/dist/secrets)
 *   - extension allowlist (code/doc/config/data only)
 *   - refuse symlinks (no following pointers outside the repo)
 *   - refuse zero-block cloud-placeholder files (iCloud/Dropbox stubs)
 *   - refuse path escapes (nothing outside the root)
 *   - deterministic secret redaction BEFORE the content is ever stored: the raw
 *     value is discarded; only {type, byteCount, sha256} is kept (A2 provenance —
 *     a secret leaves a traceable hole, never the secret itself)
 *
 * No model, no network, no runtime deps (node: builtins only). A3/A9-clean.
 */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, isAbsolute, join, resolve, sep } from "node:path";

// ── types ─────────────────────────────────────────────────────────────────────

export interface RedactionRecord {
  /** the kind of secret removed — a traceable label, never the value */
  type: string;
  /** length in bytes of the raw secret that was removed */
  byteCount: number;
  /** sha256 of the raw secret, so it is referenceable but unrecoverable */
  sha256: string;
}

export interface IngestedSource {
  /** stable id = repo-relative path */
  id: string;
  path: string;
  /** coarse class derived from extension: code | doc | config | data | other */
  kind: string;
  /** byte length of the original (pre-redaction) file */
  bytes: number;
  /** sha256 of the original file content (integrity) */
  sha256: string;
  /** the mined admission strength — a real file on disk is source-backed */
  evidenceClass: "source-backed";
  /** redacted content, safe to use as compile context (zero raw secrets) */
  content: string;
  /** what was removed, as holes — provenance for every redaction */
  redaction: RedactionRecord[];
}

export type RejectReason =
  | "symlink"
  | "cloud-placeholder"
  | "not-a-file"
  | "extension-not-allowed"
  | "path-escape";

export interface RejectedSource {
  path: string;
  reason: RejectReason;
}

export interface SourceManifest {
  root: string;
  admitted: IngestedSource[];
  rejected: RejectedSource[];
  admittedCount: number;
  rejectedCount: number;
  /** total redaction records across all admitted sources */
  secretsRedacted: number;
}

export interface IngestOptions {
  /** repo-relative path prefixes to scope discovery (e.g. ["src"]) */
  include?: string[];
  /** override the extension allowlist */
  allowExtensions?: string[];
  /** override discovery (default: git ls-files). Returns repo-relative paths. */
  discover?: (root: string, include?: string[]) => string[];
}

// ── extension allowlist ────────────────────────────────────────────────────────

export const DEFAULT_ALLOW_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs", // code
  ".json",
  ".jsonld",
  ".yaml",
  ".yml",
  ".toml", // config
  ".md",
  ".txt", // doc
  ".csv", // data
];

const KIND_BY_EXT: Record<string, string> = {
  ".ts": "code",
  ".tsx": "code",
  ".js": "code",
  ".mjs": "code",
  ".cjs": "code",
  ".json": "config",
  ".jsonld": "config",
  ".yaml": "config",
  ".yml": "config",
  ".toml": "config",
  ".md": "doc",
  ".txt": "doc",
  ".csv": "data",
};

export function isAllowedExtension(
  path: string,
  allow: string[] = DEFAULT_ALLOW_EXTENSIONS,
): boolean {
  return allow.includes(extname(path).toLowerCase());
}

// ── secret redaction (pure) ────────────────────────────────────────────────────

interface SecretPattern {
  type: string;
  re: RegExp;
  /** which capture group is the redacted span; 0 = the whole match */
  group: number;
  /** if true, the captured span includes surrounding quotes (stripped for the record) */
  quoted?: boolean;
}

// Order matters: the quoted ASSIGNMENT patterns run BEFORE the bare key/DSN
// patterns so they consume the quotes (key = "secret" → key = [REDACTED]); this
// keeps redaction idempotent (a re-scan finds nothing, no quoted hole survives).
// The quoted-value requirement also avoids redacting type annotations
// (`password: string`) and other innocuous code.
const SECRET_PATTERNS: SecretPattern[] = [
  {
    type: "private-key",
    group: 0,
    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    type: "api-key",
    group: 2,
    quoted: true,
    re: /\b(api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\b\s*[:=]\s*(['"][^'"]{12,}['"])/gi,
  },
  {
    type: "password",
    group: 2,
    quoted: true,
    re: /\b(password|passwd|pwd)\b\s*[:=]\s*(['"][^'"]{6,}['"])/gi,
  },
  { type: "postgres-dsn", group: 0, re: /\bpostgres(?:ql)?:\/\/[^\s'"]+/gi },
  { type: "provider-key", group: 0, re: /\bsk-[A-Za-z0-9\-]{16,}\b/g },
  { type: "bearer-token", group: 0, re: /\bBearer\s+[A-Za-z0-9._\-]{16,}/g },
];

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

export function redactSecrets(content: string): {
  redacted: string;
  records: RedactionRecord[];
} {
  let redacted = content;
  const records: RedactionRecord[] = [];
  for (const { type, re, group, quoted } of SECRET_PATTERNS) {
    redacted = redacted.replace(re, (match, ...groups) => {
      // groups holds capture groups then offset+string; group 0 = whole match.
      const span =
        group === 0 ? match : (groups[group - 1] as string | undefined);
      if (!span) return match;
      // the recorded secret is the value without its surrounding quotes
      const raw = quoted ? span.slice(1, -1) : span;
      const bytes = Buffer.byteLength(raw, "utf8");
      records.push({ type, byteCount: bytes, sha256: sha256(raw) });
      const hole = `[REDACTED ${type} ${bytes}B ${sha256(raw).slice(0, 12)}]`;
      return match.replace(span, hole); // replaces the quoted span → no quotes remain
    });
  }
  return { redacted, records };
}

// ── entry classification (pure over a stat-like) ───────────────────────────────

export interface StatLike {
  isSymbolicLink(): boolean;
  isFile(): boolean;
  size: number;
  blocks: number;
}

export function classifyEntry(
  st: StatLike,
): { ok: true } | { ok: false; reason: RejectReason } {
  if (st.isSymbolicLink()) return { ok: false, reason: "symlink" };
  if (!st.isFile()) return { ok: false, reason: "not-a-file" };
  // A file with bytes but zero allocated blocks is a cloud placeholder (not local).
  if (st.size > 0 && st.blocks === 0)
    return { ok: false, reason: "cloud-placeholder" };
  return { ok: true };
}

// ── path-escape guard (pure) ───────────────────────────────────────────────────

function isWithinRoot(root: string, rel: string): boolean {
  if (isAbsolute(rel) || rel.split(/[\\/]/).includes("..")) return false;
  const abs = resolve(root, rel);
  const base = resolve(root);
  return abs === base || abs.startsWith(base + sep);
}

// ── discovery (default: git) ───────────────────────────────────────────────────

function gitDiscover(root: string, include?: string[]): string[] {
  const args = ["ls-files", "--cached", "--others", "--exclude-standard"];
  if (include && include.length) args.push("--", ...include);
  const out = execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ── ingest one file ────────────────────────────────────────────────────────────

function ingestOne(root: string, rel: string): IngestedSource | RejectedSource {
  if (!isWithinRoot(root, rel)) return { path: rel, reason: "path-escape" };
  let st: StatLike;
  try {
    st = lstatSync(join(root, rel));
  } catch {
    return { path: rel, reason: "not-a-file" };
  }
  const cls = classifyEntry(st);
  if (!cls.ok) return { path: rel, reason: cls.reason };
  if (!isAllowedExtension(rel))
    return { path: rel, reason: "extension-not-allowed" };

  const raw = readFileSync(join(root, rel), "utf8");
  const { redacted, records } = redactSecrets(raw);
  return {
    id: rel,
    path: rel,
    kind: KIND_BY_EXT[extname(rel).toLowerCase()] ?? "other",
    bytes: Buffer.byteLength(raw, "utf8"),
    sha256: sha256(raw),
    evidenceClass: "source-backed",
    content: redacted,
    redaction: records,
  };
}

// ── ingest a repository → source manifest ──────────────────────────────────────

export function ingestRepo(
  root: string,
  opts: IngestOptions = {},
): SourceManifest {
  const discover = opts.discover ?? gitDiscover;
  const allow = opts.allowExtensions ?? DEFAULT_ALLOW_EXTENSIONS;
  const paths = discover(root, opts.include);

  const admitted: IngestedSource[] = [];
  const rejected: RejectedSource[] = [];
  for (const rel of paths) {
    // pre-filter on extension cheaply, but only to skip obvious binaries; the
    // symlink/placeholder guards still run inside ingestOne for allowed ones.
    if (!isAllowedExtension(rel, allow)) {
      // still surface it as rejected so the manifest is honest about coverage
      rejected.push({ path: rel, reason: "extension-not-allowed" });
      continue;
    }
    const result = ingestOne(root, rel);
    if ("reason" in result) rejected.push(result);
    else admitted.push(result);
  }

  return {
    root,
    admitted,
    rejected,
    admittedCount: admitted.length,
    rejectedCount: rejected.length,
    secretsRedacted: admitted.reduce((n, s) => n + s.redaction.length, 0),
  };
}
