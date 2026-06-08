import { test } from "node:test";
import assert from "node:assert/strict";
import { copilotExports } from "./copilot.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (id: string, semanticType: NodeType, label: string): NodeCapsule =>
  ({
    id,
    label,
    semanticType,
    truth: "inference",
    localContext: { summary: `${label} summary`, failureIfMissing: "" },
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({
    slug: "demo",
    seed: {
      domain: "knowledge management",
      rootIntent: "a citable notes tool",
    },
    graph: { nodes, edges: [] },
  }) as unknown as PackModel;

test("copilotExports emits .github/copilot-instructions.md grounded in the pack (the reach beyond Claude)", () => {
  const files = copilotExports(
    model([
      node("I.001", "Invariant", "every cite resolves"),
      node("C.001", "Constraint", "stays local"),
      node("PLAN.001", "Action", "build the parser"),
    ]),
  );
  const f = files.find((x) => x.path === ".github/copilot-instructions.md");
  assert.ok(f, "the canonical Copilot repo-instructions path is emitted");
  assert.match(
    f!.content,
    /knowledge management|citable notes/,
    "grounded in this project's intent",
  );
  assert.match(
    f!.content,
    /every cite resolves/,
    "the invariants Copilot must respect are carried",
  );
  assert.match(
    f!.content,
    /POM\.md|AUTONOMY_CONTRACT\.md/,
    "points at the governed family for depth",
  );
});

test("the Copilot export ports the authority boundary (Copilot proposes; humans gate — A4)", () => {
  const f = copilotExports(model([node("PLAN.001", "Action", "x")]))[0]!;
  assert.match(
    f.content,
    /propose|A1/i,
    "Copilot is bounded to propose-only by default",
  );
  assert.match(
    f.content,
    /AUTONOMY_CONTRACT/,
    "it defers to the autonomy contract",
  );
});
