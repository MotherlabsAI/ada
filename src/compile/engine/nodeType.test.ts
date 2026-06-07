import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNodeSpec } from "./excavate.js";
import { NODE_TYPES, type NodeType } from "../../core/types.js";

test("NODE_TYPES is the closed 15-type ontology (NORTH-STAR organ 04)", () => {
  assert.equal(NODE_TYPES.length, 15, "exactly the blueprint's 15 node types");
  for (const t of [
    "Intent",
    "Constraint",
    "Claim",
    "Evidence",
    "Assumption",
    "Unknown",
    "Risk",
    "Mechanism",
    "Invariant",
    "Decision",
    "Action",
    "Artifact",
    "Tool",
    "Eval",
    "Memory",
  ] satisfies NodeType[]) {
    assert.ok(NODE_TYPES.includes(t), `ontology must include ${t}`);
  }
});

test("the excavator carries a valid semanticType straight from the model", () => {
  const spec = parseNodeSpec(
    JSON.stringify({ id: "ARCH.001", label: "x", semanticType: "Invariant" }),
  );
  assert.equal(spec.semanticType, "Invariant");
});

test("an absent or out-of-ontology semanticType defaults to Mechanism (A2: an honest default, never an invented type)", () => {
  assert.equal(
    parseNodeSpec(JSON.stringify({ id: "ARCH.001", label: "x" })).semanticType,
    "Mechanism",
    "omitted → Mechanism",
  );
  assert.equal(
    parseNodeSpec(
      JSON.stringify({ id: "ARCH.001", label: "x", semanticType: "Banana" }),
    ).semanticType,
    "Mechanism",
    "out-of-enum → Mechanism, not the model's invented value",
  );
});

test("typed-nodes invariant: every excavator-parsed spec carries a semanticType in the closed ontology", () => {
  // The organ-04 guarantee: the parse can never yield an untyped or off-ontology node.
  for (const raw of [
    "{}",
    "garbled not json",
    JSON.stringify({ id: "X.1", semanticType: "Decision" }),
    JSON.stringify({ id: "X.2", semanticType: 42 }),
  ]) {
    const t = parseNodeSpec(raw).semanticType;
    assert.ok(
      t && (NODE_TYPES as readonly string[]).includes(t),
      `every parsed node is typed (got: ${String(t)})`,
    );
  }
});
