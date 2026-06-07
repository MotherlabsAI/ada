import { test } from "node:test";
import assert from "node:assert/strict";
import { repoDigest } from "./repoDigest.js";
import type { SourceManifest, IngestedSource } from "./ingest.js";

function src(over: Partial<IngestedSource>): IngestedSource {
  return {
    id: over.path ?? "x",
    path: over.path ?? "x",
    kind: over.kind ?? "code",
    bytes: 0,
    sha256: "0".repeat(64),
    evidenceClass: "source-backed",
    content: over.content ?? "",
    redaction: [],
    ...over,
  };
}

function manifest(admitted: IngestedSource[]): SourceManifest {
  return {
    root: "/r",
    admitted,
    rejected: [],
    admittedCount: admitted.length,
    rejectedCount: 0,
    secretsRedacted: 0,
  };
}

test("digest compiles code to exported symbols, not raw content", () => {
  const code =
    "import x from 'y';\nexport function compileFoo(){}\nexport const BAR = 1;\nconst hidden = 2;\nexport interface Shape {}";
  const d = repoDigest(
    manifest([src({ path: "src/a.ts", kind: "code", content: code })]),
  );
  assert.match(d, /src\/a\.ts/, "carries the path (provenance)");
  assert.match(d, /compileFoo/);
  assert.match(d, /BAR/);
  assert.match(d, /Shape/);
  assert.ok(!d.includes("hidden"), "non-exported symbols are not surfaced");
  assert.ok(!d.includes("import x"), "raw content is not dumped");
});

test("digest compiles a doc to its first heading", () => {
  const d = repoDigest(
    manifest([
      src({
        path: "docs/x.md",
        kind: "doc",
        content: "\n# The Determinism Spine\n\nbody...",
      }),
    ]),
  );
  assert.match(d, /docs\/x\.md/);
  assert.match(d, /The Determinism Spine/);
  assert.ok(!d.includes("body..."), "doc body is not dumped");
});

test("digest is BOUNDED (density) — never dumps an unbounded repo", () => {
  const many = Array.from({ length: 400 }, (_, i) =>
    src({
      path: `src/f${i}.ts`,
      kind: "code",
      content: `export function fn${i}(){}\n`,
    }),
  );
  const d = repoDigest(manifest(many), { maxBytes: 4000 });
  assert.ok(
    Buffer.byteLength(d, "utf8") <= 4000,
    `digest ${Buffer.byteLength(d)}B must be <= 4000B budget`,
  );
  assert.match(
    d,
    /\+\s*\d+\s+more/,
    "truncation is honest (+N more), not silent",
  );
});

test("an empty manifest yields an honest empty-digest marker, not a crash", () => {
  const d = repoDigest(manifest([]));
  assert.ok(d.length > 0, "non-empty marker");
  assert.match(d, /no source|empty/i);
});

// ── two-tier: KEY FILES carry CONTENT; the rest stay symbols (attention budget) ──

test("high-salience files contribute CONTENT; ordinary files stay symbol-only", () => {
  const d = repoDigest(
    manifest([
      src({
        path: "AXIOMS.md",
        kind: "doc",
        content: "# AXIOMS\n\nA1 — Determinism boundary: the spine.",
      }),
      src({
        path: "src/core/types.ts",
        kind: "code",
        content:
          "export interface Seed { rootIntent: string; repoContext?: string }",
      }),
      src({
        path: "src/cli.ts",
        kind: "code",
        content:
          "export function main(){ const UNIQUE_BODY_42 = 1; return UNIQUE_BODY_42; }",
      }),
    ]),
  );
  // focus files → real content reaches the excavator (the deep holes can now collapse)
  assert.match(d, /Determinism boundary: the spine/, "AXIOMS content included");
  assert.match(
    d,
    /rootIntent: string; repoContext\?: string/,
    "the schema body is included",
  );
  // ordinary file → symbol line, body NOT dumped
  assert.match(d, /src\/cli\.ts.*main/, "cli is indexed by symbol");
  assert.ok(!d.includes("UNIQUE_BODY_42"), "ordinary file body is not dumped");
});

test("the schema (types.ts) is prioritized into KEY FILES over lower-rank focus files", () => {
  // The schema is the file that collapses the most holes ("graph.json schema unspecified"),
  // so it must win a focus slot even when AXIOMS/governance are present and budget is tight.
  const fill = (s: string) => s.padEnd(1600, ".");
  const d = repoDigest(
    manifest([
      src({
        path: "governance/invariants.md",
        kind: "doc",
        content: fill("# Bounds GOVMARKER"),
      }),
      src({
        path: "AXIOMS.md",
        kind: "doc",
        content: fill("# AXIOMS AXMARKER"),
      }),
      src({
        path: "src/core/types.ts",
        kind: "code",
        content: "export interface Seed { rootIntent: string }",
      }),
    ]),
    { maxBytes: 2400, focusBytes: 1500, perFocusBytes: 1200 },
  );
  assert.match(
    d,
    /rootIntent: string/,
    "the schema is prioritized into the tight focus budget",
  );
});

test("a code focus file surfaces its DECLARATIONS, not a raw byte-prefix of noise", () => {
  const preamble = "// boilerplate preamble line\n".repeat(120); // ~3.3KB before the schema
  const types =
    preamble +
    "export interface Seed { rootIntent: string; repoContext?: string }\n" +
    "export type TruthClass = 'source' | 'residue';\n";
  const d = repoDigest(
    manifest([
      src({ path: "src/core/types.ts", kind: "code", content: types }),
    ]),
    { perFocusBytes: 1200 },
  );
  assert.match(
    d,
    /interface Seed \{ rootIntent: string/,
    "the Seed declaration is surfaced past the preamble",
  );
  assert.match(d, /type TruthClass/, "the type alias is surfaced too");
  assert.ok(
    !d.includes("boilerplate preamble"),
    "non-declaration noise is dropped",
  );
});

test("KEY FILES content is bounded — a huge focus file cannot blow the budget", () => {
  const big =
    "export interface Huge {\n" + "  field: string;\n".repeat(2000) + "}";
  const d = repoDigest(
    manifest([src({ path: "src/core/types.ts", kind: "code", content: big })]),
    { maxBytes: 4000, perFocusBytes: 1500 },
  );
  assert.ok(
    Buffer.byteLength(d, "utf8") <= 4000,
    `digest ${Buffer.byteLength(d)}B <= 4000`,
  );
  assert.match(d, /truncated/i, "over-cap focus content is honestly truncated");
});
