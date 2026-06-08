import { test } from "node:test";
import assert from "node:assert/strict";
import { projectDecomposition } from "./decomposition.js";
import type {
  PackModel,
  NodeCapsule,
  NodeType,
  TruthClass,
} from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  truth: TruthClass = "inference",
): NodeCapsule =>
  ({
    id,
    label: `${id} label`,
    semanticType,
    truth,
    localContext: { summary: `${id} summary` },
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

const find = (files: { path: string; content: string }[], p: string) =>
  files.find((f) => f.path === p)!;

test("projectDecomposition emits the 7 named atom files (the MVP decomposition set)", () => {
  const files = projectDecomposition(model([node("A.1", "Action")]));
  const paths = files.map((f) => f.path).sort();
  assert.deepEqual(paths, [
    "ACTIONS.md",
    "ASSUMPTIONS.md",
    "CLAIMS.md",
    "CONSTRAINTS.md",
    "DECISIONS.md",
    "FACTS.md",
    "UNKNOWNS.md",
  ]);
});

test("each atom file draws from the right semanticType / truth bucket", () => {
  const files = projectDecomposition(
    model([
      node("EV.1", "Evidence", "source"),
      node("CL.1", "Claim"),
      node("AS.1", "Assumption"),
      node("UN.1", "Unknown"),
      node("CO.1", "Constraint"),
      node("IN.1", "Invariant"),
      node("DE.1", "Decision"),
      node("AC.1", "Action"),
      node("RE.1", "Mechanism", "residue"),
    ]),
  );
  assert.match(
    find(files, "FACTS.md").content,
    /EV\.1/,
    "Evidence/source → FACTS",
  );
  assert.match(find(files, "CLAIMS.md").content, /CL\.1/, "Claim → CLAIMS");
  assert.match(
    find(files, "ASSUMPTIONS.md").content,
    /AS\.1/,
    "Assumption → ASSUMPTIONS",
  );
  assert.match(
    find(files, "UNKNOWNS.md").content,
    /UN\.1/,
    "Unknown → UNKNOWNS",
  );
  assert.match(
    find(files, "UNKNOWNS.md").content,
    /RE\.1/,
    "residue-truth → UNKNOWNS too",
  );
  assert.match(
    find(files, "CONSTRAINTS.md").content,
    /CO\.1[\s\S]*IN\.1|IN\.1[\s\S]*CO\.1/,
    "Constraint+Invariant → CONSTRAINTS",
  );
  assert.match(
    find(files, "DECISIONS.md").content,
    /DE\.1/,
    "Decision → DECISIONS",
  );
  assert.match(find(files, "ACTIONS.md").content, /AC\.1/, "Action → ACTIONS");
});

test("empty buckets are honest (a hole beats a fabricated atom) and output is deterministic", () => {
  const a = projectDecomposition(model([node("A.1", "Action")]));
  const b = projectDecomposition(model([node("A.1", "Action")]));
  assert.match(
    find(a, "FACTS.md").content,
    /_\(none/,
    "no facts → said plainly",
  );
  assert.equal(JSON.stringify(a), JSON.stringify(b), "byte-stable");
});
