import { test } from "node:test";
import assert from "node:assert/strict";
import { projectLoopClosers } from "./loop.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (
  id: string,
  semanticType: NodeType,
  truth = "inference",
): NodeCapsule =>
  ({ id, label: `${id} label`, semanticType, truth }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

const find = (files: { path: string; content: string }[], p: string) =>
  files.find((f) => f.path === p)!;

test("projectLoopClosers emits recompile_triggers + SUCCESSOR_UPDATE (the L10 loop closers)", () => {
  const files = projectLoopClosers(model([node("R.1", "Unknown", "residue")]));
  assert.deepEqual(files.map((f) => f.path).sort(), [
    "SUCCESSOR_UPDATE.md",
    "recompile_triggers.yaml",
  ]);
});

test("recompile_triggers names the conditions that invalidate the pack (incl. open unknowns)", () => {
  const t = find(
    projectLoopClosers(model([node("U.1", "Unknown", "residue")])),
    "recompile_triggers.yaml",
  ).content;
  assert.match(t, /seed/i, "a seed change triggers recompile");
  assert.match(t, /U\.1/, "an open unknown resolving is a trigger");
});

test("SUCCESSOR_UPDATE carries residue + decisions forward and names the OWED outcome eval (the loop compounds, honestly)", () => {
  const s = find(
    projectLoopClosers(
      model([node("U.1", "Unknown", "residue"), node("D.1", "Decision")]),
    ),
    "SUCCESSOR_UPDATE.md",
  ).content;
  assert.match(s, /U\.1/, "open residue is handed to the next compile");
  assert.match(s, /D\.1/, "decisions are carried so they are not re-litigated");
  assert.match(
    s,
    /outcome eval|north-star|OWED/i,
    "the held-out outcome gate is carried as owed",
  );
});
