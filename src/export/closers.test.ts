import { test } from "node:test";
import assert from "node:assert/strict";
import { projectMvpClosers } from "./closers.js";
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";

const node = (id: string, semanticType: NodeType): NodeCapsule =>
  ({
    id,
    label: `${id} label`,
    semanticType,
    truth: "inference",
  }) as unknown as NodeCapsule;

const model = (nodes: NodeCapsule[]): PackModel =>
  ({
    slug: "demo",
    seed: {
      rootIntent: "a citable notes tool",
      domain: "knowledge management",
      buildObjective: "notes linked to sources",
      trustObjective: "every cite resolves",
      knownContext: ["markdown notes"],
      unknownContext: ["what is a source?"],
      constraints: ["local-first"],
    },
    graph: { nodes, edges: [] },
  }) as unknown as PackModel;

const find = (files: { path: string; content: string }[], p: string) =>
  files.find((f) => f.path === p)!;

test("projectMvpClosers emits the last 4 MVP-21 files", () => {
  const files = projectMvpClosers(model([node("ROOT.000", "Intent")]));
  assert.deepEqual(files.map((f) => f.path).sort(), [
    "INTENT.md",
    "SCOPE.md",
    "memory_write.json",
    "schema_graph_tree.md",
  ]);
});

test("INTENT + SCOPE project the seed honestly (goal in-scope, unknowns out / open)", () => {
  const files = projectMvpClosers(model([node("ROOT.000", "Intent")]));
  assert.match(
    find(files, "INTENT.md").content,
    /a citable notes tool/,
    "goal",
  );
  assert.match(
    find(files, "INTENT.md").content,
    /every cite resolves/,
    "trust objective",
  );
  assert.match(
    find(files, "SCOPE.md").content,
    /local-first/,
    "constraints scope the build",
  );
  assert.match(
    find(files, "SCOPE.md").content,
    /what is a source\?/,
    "open context surfaced",
  );
});

test("schema_graph_tree renders the ROOT→cluster→node tree; memory_write is valid evidence-gated JSON", () => {
  const files = projectMvpClosers(
    model([
      node("ROOT.000", "Intent"),
      node("DATA.001", "Invariant"),
      node("MEM.001", "Memory"),
    ]),
  );
  const tree = find(files, "schema_graph_tree.md").content;
  assert.match(tree, /DATA/, "clusters appear in the tree");
  assert.match(tree, /DATA\.001/, "nodes appear under their cluster");
  const mw = JSON.parse(find(files, "memory_write.json").content);
  assert.equal(
    mw.gate,
    "evidence-gated",
    "promotion is evidence-gated (MEMORY_POLICY)",
  );
  assert.deepEqual(
    mw.proposed,
    ["MEM.001"],
    "only Memory nodes are promotion candidates",
  );
});
