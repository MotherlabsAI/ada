import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnvFile, loadEnvConfig, configCandidates } from "./env.js";

test("parseEnvFile: comments, blanks, export prefix, quotes, spaces", () => {
  const m = parseEnvFile(
    [
      "# a comment",
      "",
      "ANTHROPIC_API_KEY=sk-ant-plain",
      "export ADA_MODEL = claude-sonnet-4-6 ",
      'QUOTED="with spaces"',
      "SINGLE='single quoted'",
      "not a kv line",
    ].join("\n"),
  );
  assert.equal(m["ANTHROPIC_API_KEY"], "sk-ant-plain");
  assert.equal(m["ADA_MODEL"], "claude-sonnet-4-6");
  assert.equal(m["QUOTED"], "with spaces");
  assert.equal(m["SINGLE"], "single quoted");
  assert.equal(m["not"], undefined);
});

function withTmp(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "ada-env-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("loadEnvConfig populates an unset key from the file", () => {
  withTmp((dir) => {
    const file = join(dir, ".env");
    writeFileSync(
      file,
      "ANTHROPIC_API_KEY=sk-ant-fromfile\nADA_MODEL=claude-x\n",
    );
    const env: NodeJS.ProcessEnv = {};
    const r = loadEnvConfig([file], env);
    assert.equal(env["ANTHROPIC_API_KEY"], "sk-ant-fromfile");
    assert.equal(env["ADA_MODEL"], "claude-x");
    assert.deepEqual(r.loaded.sort(), ["ADA_MODEL", "ANTHROPIC_API_KEY"]);
    assert.equal(r.source, file);
  });
});

test("an already-set env value WINS (file never overrides)", () => {
  withTmp((dir) => {
    const file = join(dir, ".env");
    writeFileSync(file, "ANTHROPIC_API_KEY=sk-ant-fromfile\n");
    const env: NodeJS.ProcessEnv = { ANTHROPIC_API_KEY: "sk-ant-fromenv" };
    const r = loadEnvConfig([file], env);
    assert.equal(env["ANTHROPIC_API_KEY"], "sk-ant-fromenv");
    assert.deepEqual(r.loaded, []);
    assert.equal(r.source, null);
  });
});

test("first file to provide a key wins (precedence)", () => {
  withTmp((dir) => {
    const a = join(dir, "a.env");
    const b = join(dir, "b.env");
    writeFileSync(a, "ANTHROPIC_API_KEY=from-a\n");
    writeFileSync(b, "ANTHROPIC_API_KEY=from-b\n");
    const env: NodeJS.ProcessEnv = {};
    loadEnvConfig([a, b], env);
    assert.equal(env["ANTHROPIC_API_KEY"], "from-a");
  });
});

test("missing files are a no-op (no throw, nothing loaded)", () => {
  const env: NodeJS.ProcessEnv = {};
  const r = loadEnvConfig([join(tmpdir(), "definitely-not-here.env")], env);
  assert.deepEqual(r.loaded, []);
  assert.equal(env["ANTHROPIC_API_KEY"], undefined);
});

test("configCandidates includes a cwd .env and ~/.ada/.env", () => {
  const c = configCandidates("/some/where");
  assert.ok(c[0]!.endsWith("/some/where/.env"));
  assert.ok(c[1]!.includes(".ada"));
  assert.ok(c[1]!.endsWith(".env"));
});
