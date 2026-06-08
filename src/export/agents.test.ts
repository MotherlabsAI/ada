import { test } from "node:test";
import assert from "node:assert/strict";
import { projectAgentCharters } from "./agents.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (id: string, semanticType: NodeType, label: string): NodeCapsule =>
  ({
    id,
    label,
    semanticType,
    truth: "inference",
    localContext: { failureIfMissing: "" },
    epistemics: { unknowns: [] },
    checkability: { candidates: [] },
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("projectAgentCharters emits the governed set, each bound to autonomy + this pack's assets", () => {
  const md = projectAgentCharters(
    model([
      node("PLAN.001", "Action", "build the gate"),
      node("I.001", "Invariant", "a rule"),
      node("E.001", "Eval", "a check"),
    ]),
  );
  for (const agent of ["governor", "architect", "implementer", "verifier"]) {
    assert.match(
      md,
      new RegExp(`## ${agent}`),
      `the ${agent} charter is present`,
    );
  }
  // Every charter must carry authority + a stop condition + a forbidden list (not free agents).
  assert.match(
    md,
    /AUTONOMY_CONTRACT\.md/,
    "agents are bound to the autonomy contract (A4)",
  );
  assert.match(md, /stops when/i, "every agent has a stop condition");
  assert.match(md, /forbidden/i, "every agent has forbidden actions");
});

test("the implementer is scoped to the actual plan (the Action ids), not free to roam", () => {
  const md = projectAgentCharters(
    model([node("PLAN.001", "Action", "x"), node("PLAN.002", "Action", "y")]),
  );
  assert.match(
    md,
    /PLAN\.001/,
    "the implementer's scope names the real Action ids",
  );
  assert.match(md, /PLAN\.002/, "all plan Actions are in scope");
  assert.match(
    md,
    /A1|propose-only/,
    "the implementer runs at the A1 floor, bounded by the contract",
  );
});

test("the verifier outranks the generator and fails closed (binds to the pack's checks)", () => {
  const md = projectAgentCharters(
    model([node("E.001", "Eval", "every cite resolves")]),
  );
  assert.match(
    md,
    /## verifier[\s\S]*BLOCK|## verifier[\s\S]*block/,
    "the verifier can block promotion",
  );
  assert.match(
    md,
    /fail closed|fail-closed/i,
    "the verifier fails closed on the unseen",
  );
});
