import { test } from "node:test";
import assert from "node:assert/strict";
import {
  truthRank,
  checkTruthMonotonicity,
  projectTruthInvariant,
} from "./truthMonotonicity.js";
import type {
  Graph,
  NodeCapsule,
  PackModel,
  TruthClass,
} from "../core/types.js";

const n = (id: string, truth: TruthClass): NodeCapsule =>
  ({ id, label: id, truth }) as unknown as NodeCapsule;
const graph = (nodes: NodeCapsule[], edges: Graph["edges"]): Graph =>
  ({ id: "x", version: "0", packSlug: "x", nodes, edges }) as Graph;

test("truthRank orders certainty: source > inference > residue", () => {
  assert.ok(truthRank("source") > truthRank("inference"));
  assert.ok(truthRank("inference") > truthRank("residue"));
});

test("checkTruthMonotonicity passes when a derivation never gains certainty (inference from source)", () => {
  const g = graph(
    [n("A", "inference"), n("B", "source")],
    [{ from: "A", to: "B", type: "derived_from" }],
  );
  assert.equal(
    checkTruthMonotonicity(g).ok,
    true,
    "inference derived_from source is fine",
  );
});

test("checkTruthMonotonicity FAILS when a node claims more certainty than its provenance (manufactured certainty)", () => {
  const g = graph(
    [n("A", "source"), n("B", "inference")],
    [{ from: "A", to: "B", type: "derived_from" }],
  );
  const r = checkTruthMonotonicity(g);
  assert.equal(r.ok, false, "source cannot be derived_from a mere inference");
  assert.deepEqual(r.violations, [
    { from: "A", to: "B", type: "derived_from" },
  ]);
});

test("only provenance edges (derived_from / depends_on) are checked — not supports/contains", () => {
  const g = graph(
    [n("A", "source"), n("B", "inference")],
    [{ from: "A", to: "B", type: "supports" }],
  );
  assert.equal(
    checkTruthMonotonicity(g).ok,
    true,
    "a non-provenance edge does not constrain truth",
  );
});

test("projectTruthInvariant emits CTX.002 with the deterministic verdict for this pack", () => {
  const ok = graph(
    [n("A", "inference"), n("B", "source")],
    [{ from: "A", to: "B", type: "derived_from" }],
  );
  const f = projectTruthInvariant({
    slug: "demo",
    graph: ok,
  } as unknown as PackModel);
  assert.equal(f.path, "TRUTH_MONOTONICITY.md");
  assert.match(
    f.content,
    /monotone non-increasing|CTX\.002/i,
    "states the invariant",
  );
  assert.match(f.content, /PASS/i, "reports the verdict (this pack passes)");
});
