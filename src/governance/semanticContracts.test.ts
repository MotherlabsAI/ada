import { test } from "node:test";
import assert from "node:assert/strict";
import {
  semanticContracts,
  projectSemanticContracts,
} from "./semanticContracts.js";
import type { Graph, NodeCapsule, PackModel, NodeType } from "../core/types.js";

const n = (id: string, semanticType: NodeType): NodeCapsule =>
  ({
    id,
    label: `${id} label`,
    semanticType,
    truth: "inference",
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[], edges: Graph["edges"] = []): PackModel =>
  ({ slug: "demo", graph: { nodes, edges } }) as unknown as PackModel;

test("semanticContracts registers Invariant/Constraint nodes with their party set (the nodes bound to them)", () => {
  const cs = semanticContracts(
    model(
      [
        n("INV.1", "Invariant"),
        n("A.1", "Mechanism"),
        n("A.2", "Action"),
        n("M.1", "Mechanism"),
      ],
      [
        { from: "A.1", to: "INV.1", type: "guarded_by" },
        { from: "A.2", to: "INV.1", type: "depends_on" },
      ],
    ),
  );
  const inv = cs.find((c) => c.id === "INV.1")!;
  assert.deepEqual(
    inv.parties.sort(),
    ["A.1", "A.2"],
    "the bound nodes are its parties",
  );
  assert.equal(
    inv.shared,
    true,
    "≥2 parties → a SHARED contract (disjoint-write risk)",
  );
});

test("a single-party (or unbound) contract is registered but not flagged shared", () => {
  const cs = semanticContracts(
    model(
      [n("INV.1", "Constraint"), n("A.1", "Action")],
      [{ from: "A.1", to: "INV.1", type: "guarded_by" }],
    ),
  );
  assert.equal(
    cs[0]!.shared,
    false,
    "one party → no cross-node conflict surface",
  );
});

test("projectSemanticContracts emits the registry + hands disjoint-write DETECTION to the runtime merge scheduler", () => {
  const f = projectSemanticContracts(
    model(
      [n("INV.1", "Invariant"), n("A.1", "Action"), n("A.2", "Action")],
      [
        { from: "A.1", to: "INV.1", type: "guarded_by" },
        { from: "A.2", to: "INV.1", type: "guarded_by" },
      ],
    ),
  );
  assert.equal(f.path, "SEMANTIC_CONTRACTS.md");
  assert.match(f.content, /INV\.1/, "the contract is registered");
  assert.match(f.content, /A\.1.*A\.2|A\.2.*A\.1/, "its parties are listed");
  assert.match(
    f.content,
    /merge scheduler|runtime|disjoint/i,
    "detection is handed to the runtime",
  );
});
