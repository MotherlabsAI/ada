import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wrap,
  windowSlice,
  graphTree,
  matchNode,
  resolvableLinks,
  breadcrumb,
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
