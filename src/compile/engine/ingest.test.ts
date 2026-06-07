import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  redactSecrets,
  classifyEntry,
  isAllowedExtension,
  ingestRepo,
} from "./ingest.js";

const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

// ── redaction (pure) ─────────────────────────────────────────────────────────

test("redactSecrets removes a postgres DSN and keeps only type/bytes/sha256", () => {
  const raw = "DATABASE_URL=postgres://user:hunter2@db.example.com:5432/app";
  const { redacted, records } = redactSecrets(raw);
  assert.ok(!redacted.includes("hunter2"), "raw secret must not survive");
  assert.ok(!redacted.includes("postgres://"), "DSN must be gone");
  assert.equal(records.length, 1);
  assert.equal(records[0]!.type, "postgres-dsn");
  assert.ok(records[0]!.byteCount > 0);
  assert.match(records[0]!.sha256, /^[0-9a-f]{64}$/);
});

test("redactSecrets removes a quoted api-key assignment and a provider key", () => {
  const raw = `api_key = "sk-ant-AAAABBBBCCCCDDDDEEEE1234"`;
  const { redacted, records } = redactSecrets(raw);
  assert.ok(!redacted.includes("sk-ant-AAAABBBBCCCCDDDDEEEE1234"));
  assert.ok(records.length >= 1, "at least one secret recorded");
  assert.ok(
    records.every((r) => r.byteCount > 0 && /^[0-9a-f]{64}$/.test(r.sha256)),
  );
});

test("redactSecrets removes a PRIVATE KEY block", () => {
  const raw =
    "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----";
  const { redacted, records } = redactSecrets(raw);
  assert.ok(!redacted.includes("b3BlbnNzaC"), "key body must be gone");
  assert.equal(
    records.some((r) => r.type === "private-key"),
    true,
  );
});

test("redactSecrets leaves ordinary code untouched (no false positives)", () => {
  const raw =
    "interface User { password: string }\nconst apiKey: string = getKey();\nconst x = 42;";
  const { redacted, records } = redactSecrets(raw);
  assert.equal(records.length, 0, "type annotations are not secrets");
  assert.equal(redacted, raw);
});

test("redaction is idempotent — a redacted string has zero surviving secrets", () => {
  const raw = `db=postgres://a:b@h/x ; key="sk-ant-ZZZZYYYYXXXX111122223333"`;
  const once = redactSecrets(raw).redacted;
  assert.equal(redactSecrets(once).records.length, 0);
});

// ── entry classification (pure) ──────────────────────────────────────────────

function fakeStat(
  over: Partial<{
    symlink: boolean;
    file: boolean;
    size: number;
    blocks: number;
  }>,
) {
  const o = { symlink: false, file: true, size: 100, blocks: 8, ...over };
  return {
    isSymbolicLink: () => o.symlink,
    isFile: () => o.file,
    size: o.size,
    blocks: o.blocks,
  };
}

test("classifyEntry refuses symlinks", () => {
  assert.deepEqual(classifyEntry(fakeStat({ symlink: true })), {
    ok: false,
    reason: "symlink",
  });
});

test("classifyEntry refuses zero-block cloud-placeholder files", () => {
  assert.deepEqual(classifyEntry(fakeStat({ size: 4096, blocks: 0 })), {
    ok: false,
    reason: "cloud-placeholder",
  });
});

test("classifyEntry refuses non-files and accepts real files", () => {
  assert.deepEqual(classifyEntry(fakeStat({ file: false })), {
    ok: false,
    reason: "not-a-file",
  });
  assert.deepEqual(classifyEntry(fakeStat({})), { ok: true });
});

// ── extension allowlist (pure) ───────────────────────────────────────────────

test("isAllowedExtension admits code/doc/config, refuses secrets/binaries", () => {
  for (const p of ["a/b.ts", "x.md", "c.json", "d.yaml"]) {
    assert.ok(isAllowedExtension(p), `${p} should be allowed`);
  }
  for (const p of [".env", "logo.png", "a.lock", "secret.pem"]) {
    assert.ok(!isAllowedExtension(p), `${p} should be refused`);
  }
});

// ── ingest integration: injected discovery over a temp dir ───────────────────

test("ingestRepo redacts secrets, refuses symlinks, emits a clean manifest", () => {
  const dir = mkdtempSync(join(tmpdir(), "ada-ingest-"));
  try {
    writeFileSync(
      join(dir, "notes.md"),
      `conn=postgres://u:p@h:5432/db\napi_key = "sk-ant-PLANTED000111222333444555"\n`,
    );
    writeFileSync(join(dir, "app.ts"), "export const x = 1;\n");
    symlinkSync(join(dir, "app.ts"), join(dir, "link.ts"));

    const manifest = ingestRepo(dir, {
      discover: () => ["notes.md", "app.ts", "link.ts"],
    });

    // symlink refused
    assert.ok(
      manifest.rejected.some(
        (r) => r.path === "link.ts" && r.reason === "symlink",
      ),
      "symlink must be rejected",
    );
    assert.ok(
      !manifest.admitted.some((s) => s.path === "link.ts"),
      "symlink must not be admitted",
    );
    // secrets redacted, none surviving in admitted content
    assert.ok(
      manifest.secretsRedacted >= 2,
      "planted secrets must be recorded",
    );
    for (const s of manifest.admitted) {
      assert.equal(
        redactSecrets(s.content).records.length,
        0,
        `${s.path} still contains a secret`,
      );
      assert.ok(!s.content.includes("PLANTED"), "raw key leaked into manifest");
    }
    assert.equal(manifest.admittedCount, manifest.admitted.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── ingest integration: the Verify line — this repo's src/ ────────────────────

test("ingestRepo on this repo's src/ admits sources with zero secrets surviving", () => {
  const manifest = ingestRepo(REPO_ROOT, { include: ["src"] });
  assert.ok(manifest.admittedCount > 0, "src/ should yield admitted sources");
  assert.ok(
    manifest.admitted.some((s) => s.path === "src/cli.ts"),
    "a known tracked source must be admitted",
  );
  for (const s of manifest.admitted) {
    assert.equal(
      redactSecrets(s.content).records.length,
      0,
      `${s.path} contains an un-redacted secret`,
    );
  }
  for (const r of manifest.rejected) {
    assert.ok(r.reason, `rejected ${r.path} must carry a reason`);
  }
});
