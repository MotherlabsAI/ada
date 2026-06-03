/**
 * orchestrate — the U2F engine's pack-level step: one SEED + N clusters → N candidate
 * NodeSpecs, each excavated via `excavateNode` (one compile-time model call per cluster,
 * A1/A9 — multiple compile-time calls are fine; runtime/post-compile calls are not) and
 * gated by the SAME model-free rubric (A3). The model is stubbed, so this exercises
 * determinism downstream of the calls (A1), provenance (A2), and the real gate without
 * any network. Mirrors excavate.test.ts: stub the model, assert via the real `scoreNode`
 * verdicts surfaced as kept/rejected.
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
    knownContext: [
      "The notes are markdown.",
      "An LLM reads them via retrieval.",
    ],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: ["Retrieval behaviour differs across LLM vendors."],
  };
}

// Two realistic impressers (one per cluster) and one generic candidate the gate MUST
// reject — proves the bar is real across clusters, not a rubber stamp.
const ROOT_JSON = JSON.stringify({
  id: "ROOT.000",
  label: "Citable Knowledge World Model",
  cluster: "ROOT",
  depth: "L5",
  summary:
    "The compiled world model of what makes a research note citable by an LLM: it bounds the context to retrieval-window co-location, source binding, and title anchoring, not the whole note corpus.",
  whyItMatters:
    "The map the executor builds inside; without it citability is chased note-by-note instead of as one structural invariant.",
  failureIfMissing:
    "The build proceeds on guesses about retrieval and ships notes that retrieve but never cite.",
  fromPrompt: ["personal knowledge base", "citable by an LLM"],
  compilesTo: ["graph.json", "wiki/index.md", "CLAUDE.md citation rules"],
  checkClass: "C0",
  cCandidates: [],
  unknowns: ["which clusters the user most wants surfaced first"],
  truth: "inference",
  parents: [],
});

const ATT_JSON = JSON.stringify({
  id: "ATT.010",
  label: "Chunk-resident citations",
  cluster: "ATT",
  depth: "L4",
  summary:
    "An LLM cites a note only when the claim, its source, and the note's title sit inside one ~512-token retrieval window; split them across headings and the retriever lifts a slice that names neither, so a weaker note wins the citation.",
  whyItMatters:
    "Citability is decided at chunk granularity, not document quality — co-locating claim, source, and title is the highest-yield move for getting research notes cited.",
  failureIfMissing:
    "Notes get retrieved but never cited, because the lifted slice loses the source binding, and the knowledge base looks invisible to the model.",
  fromPrompt: [
    "makes my research notes citable by an LLM",
    "personal knowledge base",
  ],
  compilesTo: [
    "chunk-coherence.md",
    "CLAUDE.md citation rules",
    "c/checks/citation_window.mjs",
  ],
  checkClass: "C3",
  cCandidates: [
    "assert each claim co-occurs with its source and the note title inside one 512-token window",
  ],
  unknowns: ["exact retrieval window size per LLM vendor"],
  truth: "inference",
  parents: [],
});

const GENERIC_JSON = JSON.stringify({
  id: "COPY.011",
  label: "Make notes great",
  cluster: "COPY",
  depth: "L4",
  summary:
    "Leverage best practices to deliver world-class, seamless quality you can trust.",
  whyItMatters: "It is very important for users.",
  failureIfMissing: "Things are not as good.",
  fromPrompt: [],
  compilesTo: ["notes.md"],
  checkClass: "C0",
  cCandidates: [],
  unknowns: [],
  truth: "inference",
  parents: [],
});

// A cluster-routing stub: returns the right candidate JSON for each requested cluster.
// The orchestrator must call the model once per cluster (A1/A9 compile-time calls).
function routingStub(byCluster: Record<string, string>): ModelClient {
  return {
    async complete(prompt: string): Promise<string> {
      for (const [cluster, out] of Object.entries(byCluster)) {
        if (prompt.includes(`cluster to excavate: ${cluster}`)) return out;
      }
      throw new Error(`stub: no candidate wired for prompt`);
    },
  };
}

const CLUSTERS = ["ROOT", "ATT", "COPY"];
const STUB = routingStub({
  ROOT: ROOT_JSON,
  ATT: ATT_JSON,
  COPY: GENERIC_JSON,
});

test("excavatePack keeps the impressers and rejects the generic candidate", async () => {
  const r = await excavatePack(seed(), CLUSTERS, STUB);
  const keptIds = r.kept.map((s) => s.id).sort();
  assert.deepEqual(keptIds, ["ATT.010", "ROOT.000"]);
  assert.equal(r.rejected.length, 1);
  assert.equal(r.rejected[0]!.spec.id, "COPY.011");
  assert.equal(r.rejected[0]!.score.verdict, "reject");
});

test("every kept spec clears the same model-free gate (A3), independently re-scored", async () => {
  const r = await excavatePack(seed(), CLUSTERS, STUB);
  assert.ok(r.kept.length >= 2);
  for (const spec of r.kept) {
    assert.notEqual(scoreNode(spec).verdict, "reject");
  }
});

test("kept specs are provenance-traced (A2): fromPrompt non-empty, fragments substrings of intent", async () => {
  const r = await excavatePack(seed(), CLUSTERS, STUB);
  for (const spec of r.kept) {
    assert.ok(spec.fromPrompt.length > 0, `${spec.id} has empty fromPrompt`);
    for (const frag of spec.fromPrompt) {
      assert.ok(
        INTENT.includes(frag),
        `fromPrompt fragment not traced to intent: "${frag}"`,
      );
    }
  }
});

test("excavatePack is deterministic given the same model outputs (A1 downstream)", async () => {
  const a = await excavatePack(seed(), CLUSTERS, STUB);
  const b = await excavatePack(seed(), CLUSTERS, STUB);
  assert.equal(JSON.stringify(a.kept), JSON.stringify(b.kept));
  assert.equal(JSON.stringify(a.rejected), JSON.stringify(b.rejected));
});

test("one model call per cluster — sequential compile-time calls (A1/A9), not one batched call", async () => {
  let calls = 0;
  const counting: ModelClient = {
    async complete(prompt: string): Promise<string> {
      calls++;
      if (prompt.includes("cluster to excavate: ROOT")) return ROOT_JSON;
      if (prompt.includes("cluster to excavate: ATT")) return ATT_JSON;
      return GENERIC_JSON;
    },
  };
  await excavatePack(seed(), CLUSTERS, counting);
  assert.equal(calls, CLUSTERS.length);
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

test("model.ts is the single place the live-call tokens may appear", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/model.ts"),
    "utf8",
  ).toLowerCase();
  // The real client lives here: at least one of these tokens must be present once wired.
  assert.ok(
    src.includes("fetch(") || src.includes("anthropic"),
    "expected the real client (fetch/anthropic) to live in model.ts",
  );
});
