import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wrap,
  windowSlice,
  graphTree,
  matchNode,
  resolvableLinks,
  breadcrumb,
  clusterLabel,
} from "./lines.js";
import { clusterOf } from "../../core/ids.js";
import { fixtureGraph } from "./fixtures.js";

test("wrap never exceeds width and never drops words", () => {
  const text = "the quick brown fox jumps over the lazy dog repeatedly today";
  const lines = wrap(text, 20);
  for (const l of lines) assert.ok(l.length <= 20, `too wide: "${l}"`);
  assert.equal(lines.join(" ").split(/\s+/).join(" "), text);
});

test("windowSlice keeps focus visible and never exceeds height", () => {
  const items = Array.from({ length: 100 }, (_, i) => i);
  const { slice, start } = windowSlice(items, 80, 10);
  assert.equal(slice.length, 10);
  assert.ok(80 >= start && 80 < start + 10, "focus must be inside the window");
});

test("graphTree: areas closed by default, open to reveal nodes with connectors", () => {
  const g = fixtureGraph();
  const cluster = clusterOf(g.nodes[0]!.id);

  const closed = graphTree(g.nodes, {
    selectedRef: cluster,
    open: new Set(),
    flagged: new Set(),
  });
  assert.ok(
    closed.rows.some((r) => r.kind === "cluster" && r.ref === cluster),
    "cluster header shows",
  );
  assert.ok(
    !closed.rows.some((r) => r.kind === "node"),
    "no nodes while closed",
  );

  const opened = graphTree(g.nodes, {
    selectedRef: cluster,
    open: new Set([cluster]),
    flagged: new Set(),
  });
  const nodeRows = opened.rows.filter((r) => r.kind === "node");
  assert.ok(nodeRows.length > 0, "nodes appear when open");
  assert.ok(
    nodeRows.some((r) => /├─|└─/.test(r.text)),
    "connector lines present",
  );
});

test("matchNode: substring over id/label/summary; empty query matches all", () => {
  const n = fixtureGraph().nodes[0]!;
  assert.equal(matchNode(n, ""), true);
  assert.equal(matchNode(n, n.id.slice(0, 3)), true);
  assert.equal(matchNode(n, "zzz-no-such-token"), false);
});

test("resolvableLinks only returns edges that land on a real node", () => {
  const g = fixtureGraph();
  const ids = new Set(g.nodes.map((n) => n.id));
  for (const n of g.nodes) {
    for (const link of resolvableLinks(n, g)) {
      assert.ok(ids.has(link.id), `dangling link ${link.id}`);
    }
  }
});

test("breadcrumb joins the trail and elides a long one", () => {
  assert.equal(breadcrumb(["A", "B", "C"]), "A ▸ B ▸ C");
  assert.ok(breadcrumb(["a", "b", "c", "d", "e"]).startsWith("… ▸ "));
});

test("clusterLabel resolves a DYNAMIC code→label from the registry first (domain-adaptive)", () => {
  // ARCH/PIPE are not in the hardcoded map — they must resolve from the proposed registry.
  const registry = { ARCH: "Architecture", PIPE: "Compile pipeline" };
  assert.equal(clusterLabel("ARCH", registry), "Architecture");
  assert.equal(clusterLabel("PIPE", registry), "Compile pipeline");
});

test("clusterLabel still resolves known codes from the hardcoded map when no registry entry", () => {
  // No registry → fall back to the built-in map (back-compat for existing packs).
  assert.equal(clusterLabel("ROOT"), "Context root");
  assert.equal(clusterLabel("UNK"), "Unknown-unknowns");
  assert.equal(clusterLabel("L2C"), "Language → Code");
  // Registry present but missing this code → fall through to the hardcoded map.
  assert.equal(clusterLabel("ROOT", { ARCH: "Architecture" }), "Context root");
});

test("clusterLabel falls back to the raw code when neither registry nor map knows it", () => {
  assert.equal(clusterLabel("ZZZ"), "ZZZ");
  assert.equal(clusterLabel("ZZZ", { ARCH: "Architecture" }), "ZZZ");
});

test("a registry entry OVERRIDES the hardcoded map (proposed labels win)", () => {
  // If a pack proposes its own label for a code that also exists in the map, the pack's wins.
  assert.equal(clusterLabel("DATA", { DATA: "Tax records" }), "Tax records");
});

test("graphTree uses dynamic cluster labels from the registry when provided", () => {
  const g = fixtureGraph();
  const cluster = clusterOf(g.nodes[0]!.id);
  const rows = graphTree(g.nodes, {
    selectedRef: cluster,
    open: new Set(),
    flagged: new Set(),
    clusterLabels: { [cluster]: "Bespoke Area Name" },
  }).rows;
  const header = rows.find((r) => r.kind === "cluster" && r.ref === cluster)!;
  assert.ok(
    header.text.includes("Bespoke Area Name"),
    `header should show the dynamic label, got: ${header.text}`,
  );
});
