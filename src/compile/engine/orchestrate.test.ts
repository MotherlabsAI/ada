/**
 * orchestrate (DEPTH) — the U2F engine fills the graph: one SEED + N clusters → MANY gated
 * NodeSpecs. Each cluster is excavated to a target depth, diversified via the global
 * `avoid` list, deduped globally by normalized label, and stopped on target / attempt-cap /
 * consecutive-miss. The model is stubbed, so this exercises depth, dedup, the stop
 * conditions, determinism (A1), provenance (A2), and the real model-free gate (A3) with no
 * network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { excavatePack } from "./orchestrate.js";
import { scoreNode } from "../rubric.js";
import type { ModelClient } from "./model.js";
import type { Seed } from "../../core/types.js";

const INTENT =
  "a personal knowledge base that makes my research notes citable by an LLM";

function seed(): Seed {
  return {
    rootIntent: INTENT,
    domain: "Personal knowledge base",
    userRole: "A researcher who lives in their notes",
    buildObjective: "Notes an LLM will cite, not just retrieve.",
    knowledgeObjective: "A navigable map of what makes a note citable.",
    trustObjective: "Deterministic checks where citability is structural.",
    knownContext: ["The notes are markdown."],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: [],
  };
}

// A realistic impresser with a given (distinct) label. Mechanism-first, specific, traced —
// clears the same scoreNode gate the calibration exemplars clear.
function impress(label: string): string {
  return JSON.stringify({
    id: "X.000", // discarded — orchestrate assigns positional ids
    label,
    cluster: "ATT",
    depth: "L4",
    summary: `${label}: the claim, its source, and the note title must co-reside inside one ~512-token retrieval window; split them across headings and the retriever lifts a slice that names neither, so a weaker note wins.`,
    whyItMatters:
      "Citability is decided at chunk granularity, not document quality.",
    failureIfMissing:
      "Notes get retrieved but never cited; the base looks invisible to the model.",
    fromPrompt: ["research notes citable by an LLM", "personal knowledge base"],
    compilesTo: ["chunk.md", "CLAUDE.md rules", "c/checks/window.mjs"],
    checkClass: "C3",
    cCandidates: [
      "assert claim+source+title co-reside within a 512-token window",
    ],
    unknowns: ["the retrieval window size per LLM vendor"],
    truth: "inference",
    parents: [],
  });
}

// A generic candidate the gate MUST reject (banned filler + empty fromPrompt).
const GENERIC = JSON.stringify({
  id: "ATT.099",
  label: "Make the notes great",
  cluster: "ATT",
  depth: "L4",
  summary:
    "Leverage best practices to deliver world-class, seamless quality you can trust.",
  whyItMatters: "It is very important.",
  failureIfMissing: "Things are worse.",
  fromPrompt: [],
  compilesTo: ["notes.md"],
  checkClass: "C0",
  cCandidates: [],
  unknowns: [],
  truth: "inference",
  parents: [],
});

// Routing + sequencing stub: one queue per cluster; each call pops the next for the
// cluster named in the prompt. When a queue is exhausted it returns GENERIC (a miss),
// which lets the diminishing-returns stop fire.
function depthStub(byCluster: Record<string, string[]>): ModelClient {
  const idx: Record<string, number> = {};
  return {
    async complete(prompt: string): Promise<string> {
      const cluster = Object.keys(byCluster).find((c) =>
        prompt.includes(`cluster to excavate: ${c}`),
      );
      if (!cluster) return GENERIC;
      const q = byCluster[cluster]!;
      const i = idx[cluster] ?? 0;
      idx[cluster] = i + 1;
      return q[i] ?? GENERIC;
    },
  };
}

const onlyCluster = (kept: { id: string }[], c: string) =>
  kept.filter((n) => n.id.startsWith(`${c}.`));

test("excavatePack reaches the per-cluster target (depth, not one-per-cluster)", async () => {
  const stub = depthStub({
    ATT: [
      impress("Chunk-resident citations"),
      impress("Source binding survives the cut"),
      impress("Title anchoring per window"),
      impress("Window budget per vendor"),
    ],
  });
  const r = await excavatePack(seed(), ["ATT"], stub, { perCluster: 3 });
  assert.equal(
    onlyCluster(r.kept, "ATT").length,
    3,
    "should keep the target of 3",
  );
});

test("global dedup drops a repeated label across clusters", async () => {
  const stub = depthStub({
    ROOT: [impress("Co-residence is the unit")],
    ATT: [
      impress("Co-residence is the unit"),
      impress("Distinct attention move"),
    ],
  });
  const r = await excavatePack(seed(), ["ROOT", "ATT"], stub, {
    perCluster: 2,
  });
  const labels = r.kept.map((n) => n.label);
  assert.equal(new Set(labels).size, labels.length, "no duplicate labels kept");
  assert.ok(
    r.rejected.some((x) => x.reason === "duplicate"),
    "the cross-cluster repeat is recorded as a duplicate",
  );
  assert.equal(onlyCluster(r.kept, "ROOT").length, 1);
  assert.equal(onlyCluster(r.kept, "ATT").length, 1); // the dup dropped; one distinct kept
});

test("diminishing returns stops a cluster before the attempt cap", async () => {
  const stub = depthStub({ ATT: [impress("The only real one")] }); // then GENERIC forever
  const r = await excavatePack(seed(), ["ATT"], stub, {
    perCluster: 4,
    maxConsecutiveMisses: 2,
  });
  assert.equal(
    onlyCluster(r.kept, "ATT").length,
    1,
    "stops after 2 consecutive misses",
  );
});

test("kept nodes get clean per-cluster ids and a ROOT parent (clean hierarchy)", async () => {
  const stub = depthStub({
    ROOT: [impress("The world model")],
    ATT: [impress("First attention node"), impress("Second attention node")],
  });
  const r = await excavatePack(seed(), ["ROOT", "ATT"], stub, {
    perCluster: 2,
  });
  const ids = r.kept.map((n) => n.id);
  assert.ok(ids.includes("ROOT.001"));
  assert.ok(ids.includes("ATT.001") && ids.includes("ATT.002"));
  const root = r.kept.find((n) => n.id === "ROOT.001")!;
  const att = r.kept.find((n) => n.id === "ATT.001")!;
  assert.deepEqual(root.parents, []);
  assert.deepEqual(att.parents, ["ROOT.000"]);
});

test("every kept spec independently clears the model-free gate (A3)", async () => {
  const stub = depthStub({ ATT: [impress("A"), impress("B")] });
  const r = await excavatePack(seed(), ["ATT"], stub, { perCluster: 2 });
  assert.ok(r.kept.length >= 2);
  for (const spec of r.kept) assert.notEqual(scoreNode(spec).verdict, "reject");
});

test("kept specs are provenance-traced (A2): fromPrompt fragments are substrings of intent", async () => {
  const stub = depthStub({ ATT: [impress("Traced node")] });
  const r = await excavatePack(seed(), ["ATT"], stub, { perCluster: 1 });
  for (const spec of r.kept) {
    assert.ok(spec.fromPrompt.length > 0);
    for (const frag of spec.fromPrompt) assert.ok(INTENT.includes(frag));
  }
});

test("excavatePack is deterministic given the same model outputs (A1 downstream)", async () => {
  const mk = () =>
    depthStub({
      ROOT: [impress("Root one")],
      ATT: [impress("Att one"), impress("Att two")],
    });
  const a = await excavatePack(seed(), ["ROOT", "ATT"], mk(), {
    perCluster: 2,
  });
  const b = await excavatePack(seed(), ["ROOT", "ATT"], mk(), {
    perCluster: 2,
  });
  assert.equal(JSON.stringify(a.kept), JSON.stringify(b.kept));
  assert.equal(JSON.stringify(a.rejected), JSON.stringify(b.rejected));
});

test("the generic candidate is rejected by the gate, never kept", async () => {
  const stub = depthStub({ ATT: [GENERIC] });
  const r = await excavatePack(seed(), ["ATT"], stub, { perCluster: 2 });
  assert.equal(onlyCluster(r.kept, "ATT").length, 0);
  assert.ok(r.rejected.some((x) => x.reason === "gate"));
});

test("no model/network token lives outside model.ts (A1/A3 boundary is structural)", () => {
  for (const file of ["orchestrate.ts", "excavate.ts"]) {
    const src = readFileSync(
      join(process.cwd(), "src/compile/engine", file),
      "utf8",
    ).toLowerCase();
    for (const tok of ["anthropic", "openai", "fetch("]) {
      assert.ok(
        !src.includes(tok),
        `forbidden token "${tok}" in engine/${file}`,
      );
    }
  }
});
