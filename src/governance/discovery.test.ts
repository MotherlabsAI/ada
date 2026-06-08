import { test } from "node:test";
import assert from "node:assert/strict";
import { discoveryHoles, projectDiscovery } from "./discovery.js";
import type {
  PackModel,
  NodeCapsule,
  NodeType,
  TruthClass,
} from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  truth: TruthClass = "inference",
): NodeCapsule =>
  ({ id, label: `${id} label`, semanticType, truth }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("discoveryHoles reserves a budgeted, gated hole at every Unknown / residue node", () => {
  const holes = discoveryHoles(
    model([
      node("U.1", "Unknown"),
      node("R.1", "Mechanism", "residue"),
      node("M.1", "Mechanism"), // grounded → not a hole
    ]),
  );
  assert.deepEqual(holes.map((h) => h.at).sort(), ["R.1", "U.1"]);
  for (const h of holes) {
    assert.ok(
      h.maxChildren > 0,
      "each hole carries an expansion BUDGET (≤k children)",
    );
    assert.match(
      h.gatedBy,
      /human|A4/i,
      "each hole is gated (never auto-expanded)",
    );
  }
});

test("projectDiscovery emits DISCOVERY.md — reserved holes, budgeted, gated, never auto-filled", () => {
  const f = projectDiscovery(model([node("U.1", "Unknown")]));
  assert.equal(f.path, "DISCOVERY.md");
  assert.match(f.content, /U\.1/, "the blind point is named");
  assert.match(f.content, /budget|≤|max/i, "the expansion budget is stated");
  assert.match(
    f.content,
    /residue|hole beats|never auto/i,
    "a hole beats a guess — never auto-filled (A2)",
  );
});

test("projectDiscovery is honest when the compile is not blind anywhere", () => {
  const f = projectDiscovery(model([node("M.1", "Mechanism")]));
  assert.match(
    f.content,
    /none|no reserved/i,
    "no fabricated discovery points",
  );
});
