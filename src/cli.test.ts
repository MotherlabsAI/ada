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
import { buildEngineOptions, withAnchors, seedFromInterview } from "./cli.js";
import type { InterviewTurn } from "./compile/engine/interview.js";

function turn(field: string, answer: string, question = "q?"): InterviewTurn {
  return {
    step: { question, options: [], allowOther: true, field, done: false },
    answer,
  };
}

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

test("--repo[=path] maps to the repo-aware compile option (bare → cwd)", () => {
  assert.deepEqual(buildEngineOptions({ repo: "/some/path" }), {
    repo: "/some/path",
  });
  assert.deepEqual(buildEngineOptions({ repo: true }), { repo: "." });
  assert.deepEqual(buildEngineOptions({ repo: "  " }), { repo: "." });
  assert.equal(
    "repo" in buildEngineOptions({}),
    false,
    "absent → no repo (greenfield)",
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

// ── ada ctx init: interview → Seed mapping ────────────────────────────────────

test("seedFromInterview folds answers into Seed fields over the intent baseline", () => {
  const intent = "A booking tool for my dog-grooming shop";
  const seed = seedFromInterview(intent, [
    turn("domain", "Dog-grooming bookings"),
    turn("userRole", "The shop owner"),
    turn(
      "buildObjective",
      "Take and reschedule appointments without phone tag",
    ),
    turn("constraints", "Under $50/mo"),
    turn("constraints", "Works on a phone"),
    turn("risks", "Double-booking a Saturday slot"),
    turn("unknownContext", "Whether clients want SMS reminders"),
  ]);
  assert.equal(
    seed.rootIntent,
    intent,
    "root intent preserved from the opening",
  );
  assert.equal(seed.domain, "Dog-grooming bookings");
  assert.equal(seed.userRole, "The shop owner");
  assert.equal(
    seed.buildObjective,
    "Take and reschedule appointments without phone tag",
  );
  assert.deepEqual(
    seed.constraints,
    ["Under $50/mo", "Works on a phone"],
    "list accumulates",
  );
  assert.deepEqual(seed.risks, ["Double-booking a Saturday slot"]);
  assert.deepEqual(seed.unknownContext, ["Whether clients want SMS reminders"]);
});

test("seedFromInterview with no turns keeps intent-derived scalars and CLEAN empty lists", () => {
  const a = seedFromInterview("an intent", []);
  // Scalar fields keep their intent-derived defaults; nothing invented.
  assert.equal(a.rootIntent, "an intent");
  assert.ok(a.buildObjective.length > 0, "scalar default preserved");
  // The interview owns the list fields, so they start clean (no generic placeholder).
  assert.deepEqual(a.constraints, []);
  assert.deepEqual(a.unknownContext, []);
  assert.deepEqual(a.knownContext, []);
  assert.deepEqual(a.sources, ["User intent"], "provenance trail untouched");
});

test("the help documents `ada ctx init` with --compile", () => {
  const src = readFileSync(join(process.cwd(), "src/cli.ts"), "utf8");
  assert.ok(src.includes("ada ctx init"), "help should mention `ada ctx init`");
  assert.ok(src.includes("--compile"), "help should mention --compile");
});

test("no model/network token lives in the Interview UI (only model.ts may)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/tui/ink/Interview.ts"),
    "utf8",
  ).toLowerCase();
  for (const tok of ["anthropic", "openai", "fetch("]) {
    assert.ok(!src.includes(tok), `forbidden token in Interview.ts: ${tok}`);
  }
});
