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

test("projectPOM surfaces the normalize expansion (known/open context) and never emits a blank non_goals", () => {
  // The intent front-end (normalize) expands thin intent into a rich Seed — knownContext and
  // unknownContext. That expansion must reach the POM (A2: the headline output traces to the
  // normalized intent), not leak out. The old `non_goals` line claimed a field the Seed never
  // models and went BLANK when unknownContext was populated — a gloss this pins shut.
  const md = projectPOM({
    slug: "demo",
    seed: {
      rootIntent: "a citable notes tool",
      domain: "knowledge management",
      buildObjective: "notes linked to sources",
      trustObjective: "every cite resolves",
      knownContext: ["users keep notes in markdown"],
      unknownContext: ["what counts as a source?"],
    },
    graph: { nodes: [], edges: [] },
  } as unknown as PackModel);
  assert.match(
    md,
    /known going in[\s\S]*users keep notes in markdown/,
    "knownContext from normalize reaches the intent_kernel",
  );
  assert.match(
    md,
    /open at intake[\s\S]*what counts as a source\?/,
    "unknownContext from normalize is surfaced (not mislabeled non_goals)",
  );
  assert.doesNotMatch(
    md,
    /non_goals:\*\*\s*\n/,
    "no blank field is emitted (the old non_goals gloss is gone)",
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

test("projectPOM renders DISTINCTIONS from `disambiguates` edges — the distinguish operator splits fused concepts", () => {
  // The intent conflated "idea" with "product"; the excavator split them and joined the two
  // nodes with a `disambiguates` edge. current_state must SHOW that split (not gloss it), so an
  // operator reads two distinct concepts where the prompt fused one. (NORTH-STAR: distinguish.)
  const md = projectPOM(
    model(
      [
        node("IDEA.1", "Claim", "the idea"),
        node("PROD.1", "Claim", "the product"),
      ],
      [{ from: "IDEA.1", to: "PROD.1", type: "disambiguates" }],
    ),
  );
  assert.match(
    md,
    /distinctions[\s\S]*IDEA\.1` disambiguates `PROD\.1/,
    "a disambiguates edge renders as a distinction, not a contradiction",
  );
  // And it must NOT be miscategorised as a contradiction (a split ≠ a conflict): the pair never
  // renders with the word `contradicts`, and the contradictions section stays empty for this input.
  assert.doesNotMatch(
    md,
    /IDEA\.1` contradicts/,
    "a disambiguates edge is never relabelled as a contradiction",
  );
  assert.match(
    md,
    /### contradictions\n_\(none surfaced\)_/,
    "with only a disambiguation present, contradictions is empty",
  );
});
