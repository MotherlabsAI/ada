import { test } from "node:test";
import assert from "node:assert/strict";
import { projectPOM } from "./pom.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  label: string,
  extra: Partial<NodeCapsule> = {},
): NodeCapsule =>
  ({
    id,
    label,
    semanticType,
    truth: "inference",
    epistemics: { unknowns: [] },
    checkability: { candidates: [] },
    ...extra,
  }) as unknown as NodeCapsule;

function model(nodes: NodeCapsule[], edges: PackModel["graph"]["edges"] = []) {
  return {
    slug: "demo",
    seed: {
      rootIntent: "a citable notes tool",
      domain: "knowledge management",
      buildObjective: "notes linked to sources",
      trustObjective: "every cite resolves",
      unknownContext: [],
    },
    graph: { nodes, edges },
  } as unknown as PackModel;
}

test("projectPOM files each typed node under its POM section (the unique function, deterministic)", () => {
  const md = projectPOM(
    model([
      node("ROOT.001", "Intent", "the core goal"),
      node("C.001", "Constraint", "must stay local"),
      node("I.001", "Invariant", "verifier outranks executor"),
      node("U.001", "Unknown", "what is a source?"),
      node("A.001", "Action", "build the parser"),
      node("E.001", "Eval", "every cite resolves test"),
      node("M.001", "Mechanism", "the lossy parse"),
    ]),
  );
  assert.match(
    md,
    /## intent_kernel[\s\S]*the core goal/,
    "Intent → intent_kernel",
  );
  assert.match(
    md,
    /## constraint_graph[\s\S]*must stay local/,
    "Constraint → constraint_graph",
  );
  assert.match(
    md,
    /invariants \(must hold\)[\s\S]*verifier outranks executor/,
    "Invariant → invariants",
  );
  assert.match(
    md,
    /## unknowns_graph[\s\S]*what is a source\?/,
    "Unknown → unknowns_graph",
  );
  assert.match(
    md,
    /## execution_plan[\s\S]*build the parser/,
    "Action → execution_plan",
  );
  assert.match(
    md,
    /## verifier[\s\S]*every cite resolves test/,
    "Eval → verifier",
  );
  assert.match(
    md,
    /## solution_space[\s\S]*the lossy parse/,
    "Mechanism → solution_space",
  );
});

test("projectPOM surfaces residue as Ω and a node's unknowns as verification_questions", () => {
  const md = projectPOM(
    model([
      node("R.001", "Unknown", "a residue hole", {
        truth: "residue",
      } as Partial<NodeCapsule>),
      node("X.001", "Mechanism", "carries a question", {
        epistemics: { unknowns: ["is the boundary controlled vocab?"] },
      } as Partial<NodeCapsule>),
    ]),
  );
  assert.match(
    md,
    /residue \(Ω[\s\S]*a residue hole/,
    "residue node listed under Ω",
  );
  assert.match(
    md,
    /verification_questions[\s\S]*is the boundary controlled vocab\?/,
    "node unknowns surfaced as questions",
  );
});

test("projectPOM renders contradictions from `contradicts` edges (the distinguish surface)", () => {
  const md = projectPOM(
    model(
      [node("A.1", "Claim", "x"), node("B.1", "Claim", "not x")],
      [{ from: "A.1", to: "B.1", type: "contradicts" }],
    ),
  );
  assert.match(
    md,
    /contradictions[\s\S]*A\.1` contradicts `B\.1/,
    "edge → contradiction line",
  );
});
