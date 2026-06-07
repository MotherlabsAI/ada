import { test } from "node:test";
import assert from "node:assert/strict";
import { engineSeed } from "./seed.js";
import {
  normalizeIntent,
  parseSeedExpansion,
  buildNormalizePrompt,
} from "./normalize.js";
import type { ModelClient } from "./model.js";

/** A stub client that returns a fixed completion — NO network (A1/A9 honoured in tests). */
const stub = (reply: string): ModelClient => ({
  async complete() {
    return reply;
  },
});

test("normalizeIntent expands a thin intent: domain is inferred (not a restatement) and unknowns are surfaced", async () => {
  const floor = engineSeed("a citable notes tool");
  const rich = await normalizeIntent(
    "a citable notes tool",
    floor,
    stub(
      JSON.stringify({
        domain: "personal knowledge management & citation tooling",
        userRole: "a researcher keeping sourced notes",
        buildObjective: "a notes store where every claim links to its source",
        knowledgeObjective: "a compounding map of claims ↔ sources",
        trustObjective: "every note's citation resolves to a real source",
        knownContext: ["notes must be citable"],
        unknownContext: [
          "what counts as a source — URL, book, another note?",
          "is a note invalid without a citation, or just flagged?",
        ],
        assumptions: [],
        constraints: [],
        risks: [],
      }),
    ),
  );
  assert.notEqual(
    rich.domain,
    floor.domain,
    "the domain was inferred, not left as the intent restatement",
  );
  assert.ok(
    rich.unknownContext.length >= 1,
    "unknown-unknowns were surfaced (the floor had none)",
  );
  assert.equal(
    rich.rootIntent,
    floor.rootIntent,
    "the user's actual words are preserved — the normalizer expands, it does not rewrite intent",
  );
});

test("normalizeIntent falls back to the floor verbatim on garbled output (A2: a hole beats a lie)", async () => {
  const floor = engineSeed("x");
  const rich = await normalizeIntent(
    "x",
    floor,
    stub("not json, just an apology"),
  );
  assert.deepEqual(
    rich,
    floor,
    "garbled model output → the thin floor, no fabrication",
  );
});

test("parseSeedExpansion preserves repoContext from the floor (the digest is never rewritten)", () => {
  const floor = { ...engineSeed("x"), repoContext: "DIGEST-BYTES" };
  const rich = parseSeedExpansion(JSON.stringify({ domain: "d" }), floor);
  assert.equal(rich.repoContext, "DIGEST-BYTES");
});

test("parseSeedExpansion degrades field-by-field: a partial answer keeps the floor's missing fields", () => {
  const floor = engineSeed("a budgeting app");
  const rich = parseSeedExpansion(
    JSON.stringify({
      domain: "personal finance",
      unknownContext: ["shared or solo?"],
    }),
    floor,
  );
  assert.equal(rich.domain, "personal finance");
  assert.deepEqual(rich.unknownContext, ["shared or solo?"]);
  assert.equal(
    rich.buildObjective,
    floor.buildObjective,
    "an omitted field falls back to the floor, not to empty",
  );
});

test("buildNormalizePrompt includes the repo context block only when a digest is present", () => {
  const withRepo = buildNormalizePrompt("i", "DIGEST", "TEMPLATE");
  const without = buildNormalizePrompt("i", undefined, "TEMPLATE");
  assert.match(withRepo, /REPO CONTEXT/);
  assert.doesNotMatch(without, /REPO CONTEXT/);
});
