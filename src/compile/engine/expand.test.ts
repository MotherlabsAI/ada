import { test } from "node:test";
import assert from "node:assert/strict";
import { canExpand, expandSeed, isSaturated } from "./expand.js";
import type {
  NodeCapsule,
  Seed,
  NodeType,
  TruthClass,
} from "../../core/types.js";

const node = (
  extra: Partial<NodeCapsule> & {
    semanticType?: NodeType;
    truth?: TruthClass;
  } = {},
): NodeCapsule =>
  ({
    id: "M.1",
    label: "the lossy parse",
    truth: "inference",
    semanticType: "Mechanism",
    localContext: {
      summary: "a parser that drops structure",
      whyItMatters: "downstream depends on it",
    },
    epistemics: { unknowns: ["which fields survive?"] },
    ...extra,
  }) as unknown as NodeCapsule;

const seed = (): Seed =>
  ({
    rootIntent: "x",
    domain: "parsing",
    userRole: "dev",
    buildObjective: "b",
    knownContext: ["repo is TS"],
  }) as unknown as Seed;

test("canExpand: a GROUND node may be descended; a HOLE may not (expanding Ω invents depth — A2)", () => {
  assert.equal(
    canExpand(node()).ok,
    true,
    "a grounded Mechanism is expandable",
  );
  assert.equal(
    canExpand(node({ semanticType: "Unknown" })).ok,
    false,
    "an Unknown is a leaf, not a seed",
  );
  assert.equal(
    canExpand(node({ truth: "residue" })).ok,
    false,
    "a residue node is a hole — a leaf",
  );
  assert.match(
    canExpand(node({ truth: "residue" })).reason,
    /hole|leaf|invent/i,
    "the refusal is explained",
  );
});

test("expandSeed: the node's own meaning becomes the sub-compile's intent; its unknowns seed the sub-residue", () => {
  const s = expandSeed(node(), seed());
  assert.match(
    s.rootIntent,
    /lossy parse|drops structure/,
    "rootIntent is the node's meaning",
  );
  assert.deepEqual(
    s.unknownContext,
    ["which fields survive?"],
    "the node's open unknowns become the sub-compile's open context",
  );
  assert.equal(s.domain, "parsing", "domain is inherited from the parent");
});

const sub = (truth: TruthClass, fromPrompt: string[]) => ({
  truth,
  fromPrompt,
});

test("isSaturated: a branch is saturated when expansion surfaces NO new grounded sense (only restatement / holes)", () => {
  const parent = node(); // text mentions "lossy parse", "drops structure", "downstream depends on it"
  assert.equal(
    isSaturated(parent, [
      sub("residue", ["a hole"]),
      sub("residue", ["another hole"]),
    ]),
    true,
    "only new holes, no new ground → saturated (deeper here yields no truth)",
  );
  assert.equal(
    isSaturated(parent, [sub("inference", ["drops structure"])]),
    true,
    "a grounded child that only RESTATES the parent → no new ground → saturated",
  );
  assert.equal(
    isSaturated(parent, [
      sub("inference", ["a brand new mechanism not in the parent"]),
    ]),
    false,
    "a grounded child introducing NEW sense → not saturated → keep descending",
  );
});
