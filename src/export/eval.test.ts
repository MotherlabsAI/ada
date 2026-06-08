import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScorecard, evalExports } from "./eval.js";
import type {
  PackModel,
  NodeCapsule,
  NodeType,
  CheckClass,
} from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  checkClass: CheckClass = "C0",
  truth = "inference",
): NodeCapsule =>
  ({
    id,
    label: id,
    semanticType,
    truth,
    checkability: { class: checkClass },
  }) as unknown as NodeCapsule;

const model = (
  nodes: NodeCapsule[],
  edges: PackModel["graph"]["edges"] = [],
): PackModel =>
  ({ slug: "demo", graph: { nodes, edges } }) as unknown as PackModel;

test("computeScorecard measures structural proxies deterministically (no model, no Date)", () => {
  const m = model(
    [
      node("R.0", "Intent"),
      node("I.1", "Invariant", "C3"),
      node("A.1", "Action"),
      node("U.1", "Unknown", "C0", "residue"),
    ],
    [
      { from: "R.0", to: "I.1", type: "contains" },
      { from: "A.1", to: "U.1", type: "enables" },
      { from: "I.1", to: "A.1", type: "disambiguates" },
    ],
  );
  const s = computeScorecard(m);
  assert.equal(s.nodes, 4);
  assert.equal(s.distinctTypes, 4, "type diversity counted");
  assert.equal(s.checkable, 1, "C3+ nodes counted");
  assert.equal(s.residue, 1, "residue counted");
  assert.equal(s.typedEdges, 2, "non-contains edges counted");
  assert.equal(s.hasPlan, true, "Action present → a plan exists");
  assert.equal(s.hasDistinctions, true, "a disambiguates edge present");
  // determinism: same in → same out
  assert.deepEqual(computeScorecard(m), s);
});

test("evalExports emit EVAL_PLAN + EVAL_REPORT + scorecard.json; the OUTCOME eval is held-out, not self-graded (A2/A4)", () => {
  const files = evalExports(model([node("A.1", "Action")]));
  assert.deepEqual(files.map((f) => f.path).sort(), [
    "EVAL_PLAN.md",
    "EVAL_REPORT.md",
    "scorecard.json",
  ]);
  const plan = files.find((f) => f.path === "EVAL_PLAN.md")!.content;
  assert.match(
    plan,
    /structural/i,
    "the deterministic structural rung is named",
  );
  assert.match(
    plan,
    /held-out|north-star/i,
    "the outcome rung is held-out / the north-star gate",
  );
  assert.match(
    plan,
    /not self-grad|cannot self|human|A4/i,
    "the compiler does NOT self-grade whether its output helps (de-circularity honesty)",
  );
  const report = files.find((f) => f.path === "EVAL_REPORT.md")!.content;
  assert.match(
    report,
    /proxy/i,
    "the report labels its numbers as a PROXY, not proof",
  );
  assert.doesNotThrow(
    () => JSON.parse(files.find((f) => f.path === "scorecard.json")!.content),
    "scorecard.json is valid JSON",
  );
});
