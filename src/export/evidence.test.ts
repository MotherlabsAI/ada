import { test } from "node:test";
import assert from "node:assert/strict";
import { projectEvidenceLedger, compileEvidence } from "./evidence.js";
import type { PackModel, NodeCapsule } from "../core/types.js";

const n = (id: string, extra: Partial<NodeCapsule> = {}): NodeCapsule =>
  ({
    id,
    truth: "inference",
    checkability: { class: "C0" },
    ...extra,
  }) as unknown as NodeCapsule;

const model = (
  nodes: NodeCapsule[],
  edges: PackModel["graph"]["edges"] = [],
): PackModel =>
  ({ slug: "demo", graph: { nodes, edges } }) as unknown as PackModel;

test("compileEvidence records the compile as the seed evidence entry — deterministic, NO timestamp", () => {
  const m = model(
    [
      n("ROOT.000"),
      n("A.1", { checkability: { class: "C3" } } as Partial<NodeCapsule>),
      n("R.1", { truth: "residue" } as Partial<NodeCapsule>),
    ],
    [{ from: "ROOT.000", to: "A.1", type: "contains" }],
  );
  const e = compileEvidence(m);
  assert.equal(e.event, "compiled");
  assert.equal(e.slug, "demo");
  assert.equal(e.nodes, 3);
  assert.equal(e.edges, 1);
  assert.equal(e.checkable, 1, "C3+ nodes counted");
  assert.equal(e.residue, 1, "residue counted");
  assert.equal(
    e.gate,
    "passed",
    "a written pack cleared the gate by construction",
  );
  assert.ok(
    !("at" in e) && !("timestamp" in e),
    "no wall-clock field — the compile entry must stay byte-deterministic (INVARIANT.003)",
  );
});

test("projectEvidenceLedger emits valid JSONL (one parseable line per entry) and is byte-stable", () => {
  const m = model([n("ROOT.000"), n("A.1")]);
  const a = projectEvidenceLedger(m);
  const b = projectEvidenceLedger(m);
  assert.equal(a, b, "two projections are byte-identical (deterministic seed)");
  const lines = a.trim().split("\n");
  for (const line of lines) {
    assert.doesNotThrow(
      () => JSON.parse(line),
      "every ledger line is valid JSON",
    );
  }
  assert.equal(
    JSON.parse(lines[0]!).event,
    "compiled",
    "the seed entry is the compile event",
  );
});
