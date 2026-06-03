/**
 * CLI cost-control flag plumbing for `ada compile --engine`. The flag→options mapping is a
 * PURE function (`buildEngineOptions`), so depth/model parsing and the junk-guard are
 * asserted directly — no live model call, no network (A1/A9 untouched). Precedence
 * (flag > ADA_MODEL env > built-in default) is structural: we only emit `model` when the
 * flag carries a real value, leaving model.ts's env/default fallback intact.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildEngineOptions, withAnchors } from "./cli.js";

test("--depth=N parses to perCluster as a positive integer", () => {
  assert.deepEqual(buildEngineOptions({ depth: "3" }), { perCluster: 3 });
  assert.deepEqual(buildEngineOptions({ depth: "1" }), { perCluster: 1 });
  assert.deepEqual(buildEngineOptions({ depth: "12" }), { perCluster: 12 });
});

test("--model=<id> threads into the model option", () => {
  assert.deepEqual(buildEngineOptions({ model: "claude-sonnet-4-6" }), {
    model: "claude-sonnet-4-6",
  });
});

test("--depth and --model combine", () => {
  assert.deepEqual(
    buildEngineOptions({ depth: "3", model: "claude-sonnet-4-6" }),
    {
      perCluster: 3,
      model: "claude-sonnet-4-6",
    },
  );
});

test("junk depth is ignored (no perCluster emitted), so the engine default holds", () => {
  for (const bad of ["0", "-2", "2.5", "abc", "", " ", "01", "3x", "1e3"]) {
    const opts = buildEngineOptions({ depth: bad });
    assert.equal(
      "perCluster" in opts,
      false,
      `depth="${bad}" should be ignored, got ${JSON.stringify(opts)}`,
    );
  }
});

test("bare --model (boolean true) and empty model are ignored, leaving env/default precedence", () => {
  assert.deepEqual(buildEngineOptions({ model: true }), {});
  assert.deepEqual(buildEngineOptions({ model: "" }), {});
  assert.deepEqual(buildEngineOptions({ model: "   " }), {});
});

test("no flags → empty options (engine + model defaults untouched)", () => {
  assert.deepEqual(buildEngineOptions({}), {});
  assert.deepEqual(buildEngineOptions({ engine: true, slug: "x" }), {});
});

test("the --engine help line documents --depth and --model", () => {
  const src = readFileSync(join(process.cwd(), "src/cli.ts"), "utf8");
  assert.ok(src.includes("--depth"), "help should mention --depth");
  assert.ok(src.includes("--model"), "help should mention --model");
});

test("--clusters=A,B,C parses to sanitized ClusterDef areas (code doubles as label)", () => {
  const opts = buildEngineOptions({ clusters: "arch, pipe ,GOV" });
  assert.deepEqual(opts.clusters, [
    { code: "ARCH", label: "ARCH" },
    { code: "PIPE", label: "PIPE" },
    { code: "GOV", label: "GOV" },
  ]);
});

test("--clusters drops ROOT/UNK (anchors are added downstream) and dedupes", () => {
  const opts = buildEngineOptions({ clusters: "ROOT,ARCH,arch,UNK,PIPE" });
  assert.deepEqual(opts.clusters, [
    { code: "ARCH", label: "ARCH" },
    { code: "PIPE", label: "PIPE" },
  ]);
});

test("junk / empty --clusters is ignored, leaving the proposal path", () => {
  for (const bad of ["", "   ", ",", " , ", "!!!", "123,@@@"]) {
    const opts = buildEngineOptions({ clusters: bad });
    assert.equal(
      "clusters" in opts,
      false,
      `clusters="${bad}" should be ignored, got ${JSON.stringify(opts)}`,
    );
  }
  assert.deepEqual(buildEngineOptions({ clusters: true }), {});
});

test("withAnchors ensures ROOT first and UNK last without duplicating them", () => {
  const out = withAnchors([
    { code: "ARCH", label: "Architecture" },
    { code: "PIPE", label: "Pipeline" },
  ]);
  assert.deepEqual(
    out.map((c) => c.code),
    ["ROOT", "ARCH", "PIPE", "UNK"],
  );
  // If the caller already includes anchors, they are not duplicated.
  const out2 = withAnchors([
    { code: "ROOT", label: "x" },
    { code: "ARCH", label: "Architecture" },
    { code: "UNK", label: "y" },
  ]);
  assert.deepEqual(
    out2.map((c) => c.code),
    ["ROOT", "ARCH", "UNK"],
  );
});

test("the --engine help line documents --clusters", () => {
  const src = readFileSync(join(process.cwd(), "src/cli.ts"), "utf8");
  assert.ok(src.includes("--clusters"), "help should mention --clusters");
});
