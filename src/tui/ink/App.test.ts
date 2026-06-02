import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { App } from "./App.js";
import { fixtureGraph } from "./fixtures.js";
import { clusterOf } from "../../core/ids.js";

const tick = () => new Promise((r) => setTimeout(r, 50));
const DOWN = "[B";
const RIGHT = "[C";

function mount(
  onPersist: (s: { flagged: string[]; rejected: string[] }) => void = () => {},
) {
  return render(
    h(App, {
      slug: "fixture",
      graph: fixtureGraph(),
      initialState: { flagged: [], rejected: [] },
      onPersist,
    }),
  );
}

test("areas are closed by default — headers show, nodes hidden", async () => {
  const cluster = clusterOf(fixtureGraph().nodes[0]!.id);
  const { lastFrame } = mount();
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, new RegExp(`▸ ● ${cluster}`), "closed area header");
  assert.doesNotMatch(f, /ATT\.004/, "nodes hidden until the area is opened");
});

test("right opens an area (connectors appear), enter reads a node", async () => {
  const { stdin, lastFrame } = mount();
  await tick();
  stdin.write(RIGHT); // open the first area
  await tick();
  const opened = lastFrame() ?? "";
  assert.match(opened, /ATT\.004/, "node now visible");
  assert.match(opened, /├─|└─/, "tree connector lines");

  stdin.write(DOWN); // move to first node
  await tick();
  stdin.write("\r"); // read it
  await tick();
  const reader = lastFrame() ?? "";
  assert.match(reader, /⟡/, "capsule summary marker");
  assert.match(reader, /ATT\.004/);
});

test("space flags the selected node and persists it", async () => {
  const persisted: Array<{ flagged: string[]; rejected: string[] }> = [];
  const { stdin } = mount((s) =>
    persisted.push({ flagged: [...s.flagged], rejected: [...s.rejected] }),
  );
  await tick();
  stdin.write(RIGHT); // open area
  await tick();
  stdin.write(DOWN); // select first node
  await tick();
  stdin.write(" "); // flag it
  await tick();
  const last = persisted.at(-1);
  assert.ok(last, "expected onPersist to fire");
  assert.ok(last.flagged.includes("ATT.004"), "ATT.004 should be flagged");
});
