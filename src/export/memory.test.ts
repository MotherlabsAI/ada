import { test } from "node:test";
import assert from "node:assert/strict";
import { projectMemoryPolicy } from "./memory.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  truth = "inference",
): NodeCapsule =>
  ({ id, semanticType, truth, label: id }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("projectMemoryPolicy declares the 3 classes and the evidence-gated promotion rule", () => {
  const md = projectMemoryPolicy(model([node("M.1", "Memory")]));
  for (const cls of ["working", "durable", "residue"]) {
    assert.match(
      md,
      new RegExp(`\\*\\*${cls}\\*\\*`),
      `the ${cls} class is declared`,
    );
  }
  assert.match(
    md,
    /EVIDENCE_LEDGER\.jsonl/,
    "promotion is gated on the evidence ledger (memory is earned)",
  );
  assert.match(
    md,
    /invalidation/i,
    "a promoted memory must name its invalidation rule",
  );
  assert.match(md, /demot/i, "demotion rules are present");
});

test("projectMemoryPolicy wires to THIS pack — Memory nodes are candidates, residue is not promotable", () => {
  const md = projectMemoryPolicy(
    model([
      node("M.1", "Memory"),
      node("R.1", "Unknown", "residue"),
      node("R.2", "Unknown", "residue"),
    ]),
  );
  assert.match(md, /M\.1/, "Memory nodes surface as promotion candidates");
  assert.match(
    md,
    /2 residue|residue.*not promotable/i,
    "residue is held back, not promoted",
  );
});

test("projectMemoryPolicy is honest when the pack has no Memory candidates", () => {
  const md = projectMemoryPolicy(model([node("I.1", "Invariant")]));
  assert.match(md, /none yet|no Memory/i, "no fabricated promotions");
});
