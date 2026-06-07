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
