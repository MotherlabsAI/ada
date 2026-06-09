import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkClassRank,
  trustCeiling,
  projectTrustCeiling,
} from "./trustCeiling.js";
import type {
  PackModel,
  NodeCapsule,
  NodeType,
  CheckClass,
} from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  cls: CheckClass,
): NodeCapsule =>
  ({
    id,
    label: id,
    semanticType,
    truth: "inference",
    checkability: { class: cls },
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("checkClassRank orders C0…C5", () => {
  assert.ok(checkClassRank("C5") > checkClassRank("C3"));
  assert.ok(checkClassRank("C3") > checkClassRank("C2"));
});

test("trustCeiling: loop may auto-close only when EVERY acceptance criterion is C3+ (deterministic)", () => {
  const allStrong = trustCeiling(
    model([node("I.1", "Invariant", "C3"), node("E.1", "Eval", "C4")]),
  );
  assert.equal(
    allStrong.mayAutoClose,
    true,
    "all C3+ → the loop can certify done with no human",
  );
  assert.equal(
    allStrong.ceiling,
    "C3",
    "ceiling = the weakest (min) covering check",
  );
  assert.deepEqual(allStrong.weakest, [], "nothing caps it");
});

test("trustCeiling: a single C0–C2 acceptance criterion caps close-authority → must park for the human", () => {
  const r = trustCeiling(
    model([node("I.1", "Invariant", "C4"), node("I.2", "Constraint", "C1")]),
  );
  assert.equal(
    r.mayAutoClose,
    false,
    "a C1 criterion cannot be autonomously certified",
  );
  assert.equal(r.ceiling, "C1");
  assert.deepEqual(
    r.weakest,
    ["I.2"],
    "the weak criterion is named — it routes to the human gate (GOV.002)",
  );
});

test("projectTrustCeiling emits TRUST_CEILING.md with the close-authority verdict and the park rule", () => {
  const f = projectTrustCeiling(model([node("I.2", "Invariant", "C0")]));
  assert.equal(f.path, "TRUST_CEILING.md");
  assert.match(f.content, /C0|ceiling/i, "states the ceiling");
  assert.match(
    f.content,
    /park|human|A4|cannot.*auto/i,
    "weak coverage parks for the human, never silent auto-close",
  );
});
