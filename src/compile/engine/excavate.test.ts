/**
 * First slice — the product bet on the smallest surface: the U2F engine produces ONE
 * impressive, provenance-traced node from a REAL non-booking intent, through the SAME
 * model-free rubric gate the calibration exemplars clear. The model is stubbed, so this
 * exercises A1 (determinism downstream of the one model call), A2 (provenance), and A3
 * (the gate has no model) without any network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { excavateNode } from "./excavate.js";
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

// A realistic excavated capsule for this intent — specific, mechanism-first, traced.
const IMPRESS_JSON = JSON.stringify({
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

// A generic candidate the gate MUST reject — proves the bar is real, not a rubber stamp.
const GENERIC_JSON = JSON.stringify({
  id: "ATT.011",
  label: "Make notes great",
  cluster: "ATT",
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

const stub = (out: string): ModelClient => ({ complete: async () => out });

test("excavateNode produces an impress node from a real non-booking intent", async () => {
  const r = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.equal(r.rejected, false);
  assert.ok(r.node, "expected a kept node");
  assert.equal(r.score.verdict, "impress");
  assert.ok(r.score.total >= 5);
});

test("the kept node is provenance-traced (A2): fromPrompt non-empty, every fragment a substring of the intent", async () => {
  const r = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.ok(r.node);
  assert.ok(r.node.fromPrompt.length > 0);
  for (const frag of r.node.fromPrompt) {
    assert.ok(
      INTENT.includes(frag),
      `fromPrompt fragment not traced to intent: "${frag}"`,
    );
  }
});

test("excavateNode is deterministic given the same model output (A1 downstream)", async () => {
  const a = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  const b = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.equal(JSON.stringify(a.node), JSON.stringify(b.node));
});

test("the gate is real: a generic candidate is rejected, not kept", async () => {
  const r = await excavateNode(seed(), "ATT", stub(GENERIC_JSON));
  assert.equal(r.rejected, true);
  assert.equal(r.node, null);
});

test("no model/network token lives outside model.ts (A1/A3 boundary is structural)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/excavate.ts"),
    "utf8",
  ).toLowerCase();
  for (const tok of ["anthropic", "openai", "fetch("]) {
    assert.ok(!src.includes(tok), `forbidden token in excavate.ts: ${tok}`);
  }
});
