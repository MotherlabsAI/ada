import { test } from "node:test";
import assert from "node:assert/strict";
import { projectAutonomyContract } from "./autonomy.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  label: string,
  failureIfMissing = "",
): NodeCapsule =>
  ({
    id,
    label,
    semanticType,
    truth: "inference",
    localContext: { failureIfMissing },
    epistemics: { unknowns: [] },
    checkability: { candidates: [] },
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("projectAutonomyContract binds every Action to the safe floor A1, with its blast radius (the AUTHORITY link)", () => {
  const md = projectAutonomyContract(
    model([
      node(
        "PLAN.001",
        "Action",
        "Build the validating ingest gate",
        "bad records slip in",
      ),
      node("M.001", "Mechanism", "not an action — should be ignored"),
    ]),
  );
  assert.match(
    md,
    /## Autonomy ladder[\s\S]*A0 read-only[\s\S]*A5 production-bounded/,
    "the full A0–A5 ladder",
  );
  assert.match(
    md,
    /`PLAN\.001` \*\*A1\*\* · Build the validating ingest gate/,
    "the Action is listed at the A1 default",
  );
  assert.match(
    md,
    /blast radius if mis-run: bad records slip in/,
    "its blast radius is carried",
  );
  assert.doesNotMatch(
    md,
    /not an action/,
    "non-Action nodes are not authorized here",
  );
});

test("projectAutonomyContract names the human gate (A4) — raising authority is the owner's call", () => {
  const md = projectAutonomyContract(model([node("PLAN.001", "Action", "x")]));
  assert.match(md, /AXIOM A4/, "ties to the governance axiom");
  assert.match(md, /A2\+/, "raising above the floor is gated");
});

test("projectAutonomyContract is honest when there are no Actions (nothing to authorize)", () => {
  const md = projectAutonomyContract(
    model([node("I.001", "Invariant", "a rule")]),
  );
  assert.match(md, /no Action nodes in this pack/, "no fabricated authority");
});
