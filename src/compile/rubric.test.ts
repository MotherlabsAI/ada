import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreNode } from "./rubric.js";
import type { NodeSpec } from "./assemble.js";

const good: NodeSpec = {
  id: "ATT.005",
  label: "Relevance Detection",
  cluster: "ATT",
  depth: "L4",
  summary:
    "A sub-second relevance gate fires before a word is read; the same service+place+intent tokens a human uses also bind Google's local pack and ChatGPT's entity matcher — one headline satisfies three judges.",
  whyItMatters:
    "It is the gate before salience; echoing query language is the cheapest highest-yield headline decision.",
  failureIfMissing:
    "Brand slogan with no service/place tokens; visitor cannot confirm fit in <1s and bounces.",
  fromPrompt: [
    "ranks in Google",
    "recognized by ChatGPT",
    "converts attention into bookings",
  ],
  compilesTo: [
    "H1 template",
    "LocalBusiness.areaServed schema",
    "CLAUDE.md headline rule",
  ],
  checkClass: "C2",
  cCandidates: ["H1 contains a service term AND a place term"],
  unknowns: ["exact searcher vocabulary for this trade/region"],
  truth: "inference",
  parents: ["ATT.004"],
};

const generic: NodeSpec = {
  ...good,
  id: "ATT.999",
  label: "Engagement",
  summary:
    "Engagement is very important and helps users a lot by leveraging best practices.",
  whyItMatters: "It matters.",
  failureIfMissing: "Bad things happen.",
  fromPrompt: [],
  compilesTo: [],
  cCandidates: [],
  unknowns: [],
};

test("an excellent node scores impress", () => {
  assert.equal(scoreNode(good).verdict, "impress");
});

test("a generic node is rejected", () => {
  assert.equal(scoreNode(generic).verdict, "reject");
});

test("claiming C5 with no candidates flags checkability dishonesty", () => {
  const lie = { ...good, checkClass: "C5" as const, cCandidates: [] };
  assert.equal(scoreNode(lie).dimensions.checkabilityHonest, false);
});
