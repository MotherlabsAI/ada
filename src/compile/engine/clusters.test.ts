/**
 * proposeClusters — the compile-time, model-driven domain-area step (P7). ONE model call
 * (via the injected ModelClient, so network stays in model.ts) returns 3–6 domain area
 * clusters; ROOT (world-model anchor) and UNK (unknown-unknowns) are ALWAYS present and are
 * NOT proposed by the model. The model is stubbed, so this exercises the parse (A1
 * downstream of the one call), the always-present anchors, defensive fallback on
 * garbled/empty output, and the structural boundary (no network token here) — no network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  proposeClusters,
  DEFAULT_PROPOSED_CLUSTERS,
  parseClusterProposal,
  type ClusterDef,
} from "./clusters.js";
import type { ModelClient } from "./model.js";
import type { Seed } from "../../core/types.js";

const INTENT =
  "a semantic compiler that lowers natural-language intent into governed context";

function seed(): Seed {
  return {
    rootIntent: INTENT,
    domain: "Semantic compiler",
    userRole: "The person who brought this intent",
    buildObjective: "Compile a working world model an executor can build from.",
    knowledgeObjective: "A navigable, compounding map of the compiler.",
    trustObjective:
      "Deterministic checks where structural; honest residue where not.",
    knownContext: ["Derived solely from the stated intent."],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: [],
  };
}

const stub = (out: string): ModelClient => ({ complete: async () => out });

// A well-formed domain proposal for a non-marketing intent — ARCH/PIPE/GOV/EXEC, no
// ROOT/UNK (the engine injects those).
const GOOD_JSON = JSON.stringify([
  { code: "ARCH", label: "Architecture" },
  { code: "PIPE", label: "Compile pipeline" },
  { code: "GOV", label: "Governance" },
  { code: "EXEC", label: "Execution" },
]);

const codes = (cs: ClusterDef[]) => cs.map((c) => c.code);

test("proposeClusters returns the model's domain clusters with ROOT first and UNK last (always present)", async () => {
  const cs = await proposeClusters(seed(), stub(GOOD_JSON));
  assert.equal(codes(cs)[0], "ROOT", "ROOT anchors the world model, first");
  assert.equal(codes(cs).at(-1), "UNK", "UNK (unknown-unknowns) is last");
  // The model's proposed areas sit between the two anchors.
  assert.deepEqual(codes(cs), ["ROOT", "ARCH", "PIPE", "GOV", "EXEC", "UNK"]);
});

test("ROOT and UNK are NOT taken from the model — even if it (wrongly) proposes them, they are not duplicated", async () => {
  const withAnchors = JSON.stringify([
    { code: "ROOT", label: "model-supplied root" },
    { code: "ARCH", label: "Architecture" },
    { code: "UNK", label: "model-supplied unk" },
  ]);
  const cs = await proposeClusters(seed(), stub(withAnchors));
  assert.equal(codes(cs).filter((c) => c === "ROOT").length, 1);
  assert.equal(codes(cs).filter((c) => c === "UNK").length, 1);
  // The engine's anchors win — the model's ROOT/UNK labels are discarded.
  assert.equal(cs.find((c) => c.code === "ROOT")!.label, "Context root");
  assert.equal(cs.find((c) => c.code === "UNK")!.label, "Unknown-unknowns");
  assert.ok(codes(cs).includes("ARCH"));
});

test("each proposed cluster carries a {code,label}: code an UPPERCASE token, label a human name", async () => {
  const cs = await proposeClusters(seed(), stub(GOOD_JSON));
  for (const c of cs) {
    assert.ok(
      /^[A-Z][A-Z0-9]*$/.test(c.code),
      `code not an uppercase token: "${c.code}"`,
    );
    assert.ok(c.label.length > 0, `empty label for ${c.code}`);
  }
});

test("garbled output falls back to the sane default set (ROOT+UNK present, deterministic)", async () => {
  const cs = await proposeClusters(seed(), stub("not json at all {{{"));
  assert.deepEqual(cs, DEFAULT_PROPOSED_CLUSTERS);
  assert.ok(codes(cs).includes("ROOT") && codes(cs).includes("UNK"));
});

test("empty / whitespace / empty-array output falls back to the default set", async () => {
  for (const bad of ["", "   ", "[]", "{}", "null"]) {
    const cs = await proposeClusters(seed(), stub(bad));
    assert.deepEqual(
      cs,
      DEFAULT_PROPOSED_CLUSTERS,
      `bad output "${bad}" should fall back`,
    );
  }
});

test("proposeClusters is deterministic given the same model output (A1 downstream)", async () => {
  const a = await proposeClusters(seed(), stub(GOOD_JSON));
  const b = await proposeClusters(seed(), stub(GOOD_JSON));
  assert.deepEqual(a, b);
});

test("the proposed set stays within 3–6 model areas (plus the two anchors) — over-long proposals are trimmed", async () => {
  const many = JSON.stringify(
    Array.from({ length: 12 }, (_, i) => ({
      code: `A${i}`,
      label: `area ${i}`,
    })),
  );
  const cs = await proposeClusters(seed(), stub(many));
  const modelAreas = cs.filter((c) => c.code !== "ROOT" && c.code !== "UNK");
  assert.ok(
    modelAreas.length >= 3 && modelAreas.length <= 6,
    `got ${modelAreas.length} model areas`,
  );
});

test("parseClusterProposal sanitizes codes (uppercases, strips junk) and dedupes", () => {
  const raw = JSON.stringify([
    { code: "arch", label: "Architecture" },
    { code: "ar ch!", label: "dup-ish" },
    { code: "PIPE", label: "Pipeline" },
    { code: "PIPE", label: "dup pipe" },
    { code: "", label: "no code" },
  ]);
  const cs = parseClusterProposal(raw);
  const cc = cs.map((c) => c.code);
  assert.ok(
    cc.every((c) => /^[A-Z][A-Z0-9]*$/.test(c)),
    `codes not sanitized: ${cc.join(",")}`,
  );
  assert.equal(new Set(cc).size, cc.length, "no duplicate codes");
  assert.ok(!cc.includes(""), "empty code dropped");
});

test("the cluster-proposer prompt is loadable via resolvePromptDir (copied into dist by build)", () => {
  // Reuse excavate's module-relative resolver indirectly: the prompt file must exist
  // alongside the other versioned prompts so the built CLI finds it from any cwd.
  const here = join(
    process.cwd(),
    "src",
    "compile",
    "prompts",
    "cluster-proposer.md",
  );
  assert.ok(
    existsSync(here),
    "cluster-proposer.md must exist in src/compile/prompts",
  );
});

test("no model/network token lives in clusters.ts (A1/A3 boundary is structural)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/clusters.ts"),
    "utf8",
  ).toLowerCase();
  for (const tok of ["anthropic", "openai", "fetch("]) {
    assert.ok(!src.includes(tok), `forbidden token in clusters.ts: ${tok}`);
  }
});
