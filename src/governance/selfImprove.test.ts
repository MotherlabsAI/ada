import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diffGraphs,
  checkGateWeakening,
  extractGates,
  verifyPatch,
} from "./selfImprove.js";
import type { Graph, NodeCapsule } from "../core/types.js";

const n = (
  id: string,
  label: string,
  extra: Partial<NodeCapsule> = {},
): NodeCapsule =>
  ({ id, label, truth: "inference", ...extra }) as unknown as NodeCapsule;
const g = (nodes: NodeCapsule[], edges: Graph["edges"] = []): Graph =>
  ({ id: "x", version: "0", packSlug: "x", nodes, edges }) as Graph;

test("diffGraphs reports added / removed / changed nodes and edge churn (the shadow-compile evidence)", () => {
  const before = g(
    [n("A.1", "alpha"), n("A.2", "beta")],
    [{ from: "A.1", to: "A.2", type: "depends_on" }],
  );
  const after = g(
    [n("A.1", "alpha-RENAMED"), n("A.3", "gamma")],
    [{ from: "A.1", to: "A.3", type: "supports" }],
  );
  const d = diffGraphs(before, after);
  assert.deepEqual(d.addedNodes, ["A.3"]);
  assert.deepEqual(d.removedNodes, ["A.2"]);
  assert.deepEqual(d.changedNodes, ["A.1"], "A.1's label moved → changed");
  assert.equal(d.addedEdges, 1);
  assert.equal(d.removedEdges, 1);
});

test("checkGateWeakening: a patch may ADD gates but a removed gate fails (K10.7 anti-corruption)", () => {
  assert.deepEqual(
    checkGateWeakening(["g1", "g2"], ["g1", "g2", "g3"]),
    { ok: true, removed: [] },
    "adding a gate is fine",
  );
  const weakened = checkGateWeakening(["g1", "g2", "g3"], ["g1", "g3"]);
  assert.equal(weakened.ok, false);
  assert.deepEqual(weakened.removed, ["g2"], "the removed gate is named");
});

test("extractGates pulls test('…') titles — the enforced gate set of a suite", () => {
  const src = `
    test("no idle setInterval in the welcome", () => {});
    it('red is reserved for blockers', () => {});
    test(\`the inspector labels its sections\`, () => {});
  `;
  assert.deepEqual(extractGates(src), [
    "no idle setInterval in the welcome",
    "red is reserved for blockers",
    "the inspector labels its sections",
  ]);
});

test("verifyPatch: NOT promotable when any gate is weakened, however much else improved", () => {
  const before = g([n("A.1", "x")]);
  const after = g([n("A.1", "x"), n("A.2", "a shiny new node")]); // a real improvement…
  const verdict = verifyPatch({
    before,
    after,
    gatesBefore: ["gate-A", "gate-B"],
    gatesAfter: ["gate-A"], // …but it dropped gate-B
  });
  assert.equal(
    verdict.promotable,
    false,
    "dropping a gate blocks promotion outright",
  );
  assert.deepEqual(verdict.gateCheck.removed, ["gate-B"]);
  assert.match(verdict.reasons.join(" "), /weakens 1 gate/);
});

test("verifyPatch: promotable when no gate is weakened; the diff is attached as evidence", () => {
  const before = g([n("A.1", "x")]);
  const after = g([n("A.1", "x"), n("A.2", "added")]);
  const verdict = verifyPatch({
    before,
    after,
    gatesBefore: ["gate-A"],
    gatesAfter: ["gate-A", "gate-B"], // strengthened
  });
  assert.equal(verdict.promotable, true);
  assert.deepEqual(
    verdict.diff.addedNodes,
    ["A.2"],
    "the inspectable change is carried",
  );
});

test("the design-contract suite is itself a gate set the harness can guard against weakening", () => {
  // Real wiring sanity: our own design-contract test titles are extractable gates, so a future
  // self-patch that deletes one is detectable as a weakening — Ada can guard its own guards.
  const gates = extractGates(`
    test("MOTION CONTRACT — the welcome arms no idle timer", () => {});
    test("COLOR CONTRACT — the cursor bar is a fixed neutral", () => {});
  `);
  assert.equal(gates.length, 2);
  assert.equal(
    checkGateWeakening(gates, [gates[0]!]).ok,
    false,
    "deleting a contract test trips the guard",
  );
});
