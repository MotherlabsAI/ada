import { test } from "node:test";
import assert from "node:assert/strict";
import { muDepth } from "./muDepth.js";
import type { PackModel } from "../core/types.js";

const ARTS = new Set(["graph.json", "ingestrepo"]);

function node(over: Record<string, unknown>) {
  return {
    id: "X.001",
    truth: "inference",
    label: "n",
    localContext: { summary: "", failureIfMissing: "" },
    worldLinks: { parents: [] },
    epistemics: { unknowns: [] },
    checkability: { candidates: [] },
    ...over,
  };
}
const pack = (nodes: unknown[], edges: unknown[] = []) =>
  ({ graph: { nodes, edges } }) as unknown as PackModel;

test("a grounded hole on a CONSEQUENTIAL + CONNECTED node counts as structurally deep", () => {
  const p = pack(
    [
      node({
        id: "ROOT.001",
        localContext: {
          summary: "",
          failureIfMissing: "if graph.json schema is wrong, X breaks",
        },
        worldLinks: { parents: ["ROOT.000"] },
        epistemics: { unknowns: ["the schema of graph.json is unspecified"] },
      }),
    ],
    [{ from: "ROOT.000", to: "ROOT.001" }],
  );
  assert.equal(muDepth(p, ARTS), 1);
});

test("a grounded-but-SHALLOW hole (no consequence, no edge) does NOT count as deep", () => {
  const p = pack([
    node({
      id: "U.001",
      localContext: { summary: "", failureIfMissing: "" }, // no consequence
      worldLinks: { parents: [] }, // disconnected
      epistemics: { unknowns: ["uses graph.json somewhere"] }, // grounded but bare
    }),
  ]);
  assert.equal(muDepth(p, ARTS), 0, "grounding alone is not depth");
});

test("consequential but DISCONNECTED, or connected but NOT consequential → not deep", () => {
  const consequentialOnly = pack([
    node({
      id: "A.1",
      localContext: {
        failureIfMissing: "breaks if graph.json changes",
        summary: "",
      },
      worldLinks: { parents: [] },
      epistemics: { unknowns: ["graph.json detail"] },
    }),
  ]); // consequential, but no edge/parent
  assert.equal(muDepth(consequentialOnly, ARTS), 0);

  const connectedOnly = pack(
    [
      node({
        id: "B.1",
        worldLinks: { parents: ["B.0"] },
        localContext: { failureIfMissing: "", summary: "" },
        epistemics: { unknowns: ["graph.json detail"] },
      }),
    ],
    [{ from: "B.0", to: "B.1" }],
  ); // connected, but no consequence
  assert.equal(muDepth(connectedOnly, ARTS), 0);
});
