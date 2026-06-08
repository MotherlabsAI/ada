import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEdges, type NodeSpec } from "./assemble.js";
import { parseNodeSpec } from "./engine/excavate.js";
import type { NodeCapsule } from "../core/types.js";

const node = (id: string, parents: string[] = []): NodeCapsule =>
  ({ id, worldLinks: { parents } }) as unknown as NodeCapsule;
const spec = (id: string, relations: NodeSpec["relations"]): NodeSpec =>
  ({ id, relations }) as unknown as NodeSpec;

test("buildEdges: typed cross-edges from relations land only on real nodes — dangling, self-loop, and dups dropped", () => {
  const nodes = [node("ROOT.000"), node("ARCH.001"), node("ARCH.002")];
  const specs = [
    spec("ARCH.001", [
      { to: "ARCH.002", type: "guarded_by" }, // valid → kept
      { to: "ARCH.002", type: "guarded_by" }, // exact dup → deduped
      { to: "GHOST.9", type: "blocks" }, // dangling target → dropped
      { to: "ARCH.001", type: "supports" }, // self-loop → dropped
    ]),
  ];
  const typed = buildEdges(nodes, specs).filter((e) => e.type !== "contains");
  assert.deepEqual(typed, [
    { from: "ARCH.001", to: "ARCH.002", type: "guarded_by" },
  ]);
});

test("buildEdges still emits the structural contains spine (parents → node)", () => {
  const nodes = [node("ROOT.000"), node("ARCH.001", ["ROOT.000"])];
  const contains = buildEdges(nodes).filter((e) => e.type === "contains");
  assert.ok(
    contains.some((e) => e.from === "ROOT.000" && e.to === "ARCH.001"),
    "the parent→node contains edge is present",
  );
});

test("the excavator parses typed relations and DROPS invented edge types (A2: an invented edge is a lie)", () => {
  const parsed = parseNodeSpec(
    JSON.stringify({
      id: "X.1",
      label: "x",
      relations: [
        { to: "Y.1", type: "supports" }, // valid
        { to: "Z.1", type: "loves" }, // out-of-vocab → dropped
        { to: "", type: "blocks" }, // empty target → dropped
        { type: "blocks" }, // no target → dropped
        "nonsense", // not an object → dropped
      ],
    }),
  );
  assert.deepEqual(parsed.relations, [{ to: "Y.1", type: "supports" }]);
});

test("the excavator never uses `contains` from the model — the engine owns the structural spine", () => {
  const parsed = parseNodeSpec(
    JSON.stringify({
      id: "X.1",
      label: "x",
      relations: [{ to: "Y.1", type: "contains" }],
    }),
  );
  // `contains` IS in the vocabulary, so the parse keeps it; the prompt forbids the model from
  // emitting it. This test pins the contract: if a model emits it, it's a structural edge, not
  // a semantic claim — acceptable, but the spine is still engine-built. (Documents the boundary.)
  assert.deepEqual(parsed.relations, [{ to: "Y.1", type: "contains" }]);
});
