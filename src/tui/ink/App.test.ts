import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { App } from "./App.js";
import { fixtureGraph } from "./fixtures.js";

const tick = () => new Promise((r) => setTimeout(r, 20));
const DOWN = "[B";
const UP = "[A";

test("arrow-down moves selection and Tab flags the selected node", async () => {
  const persisted: Array<{ flagged: string[]; rejected: string[] }> = [];
  const { stdin, lastFrame } = render(
    h(App, {
      slug: "fixture",
      graph: fixtureGraph(),
      initialState: { flagged: [], rejected: [] },
      onPersist: (s: { flagged: string[]; rejected: string[] }) =>
        persisted.push({ flagged: [...s.flagged], rejected: [...s.rejected] }),
    }),
  );
  await tick();
  // First node (ATT.004) is selected initially.
  assert.match(lastFrame() ?? "", /› .*ATT\.004/);

  stdin.write(DOWN);
  await tick();
  // Second node (ATT.005) now selected.
  assert.match(lastFrame() ?? "", /› .*ATT\.005/);

  stdin.write("\t"); // Tab flags the selected node (letters now filter)
  await tick();
  // The newly selected node was flagged and persisted.
  const last = persisted.at(-1);
  assert.ok(last, "expected onPersist to fire");
  assert.ok(last.flagged.includes("ATT.005"), "ATT.005 should be flagged");
});

test("arrow-up clamps at the top and enter opens the reader", async () => {
  const { stdin, lastFrame } = render(
    h(App, {
      slug: "fixture",
      graph: fixtureGraph(),
      initialState: { flagged: [], rejected: [] },
      onPersist: () => {},
    }),
  );
  await tick();
  stdin.write(UP); // already at top — stays on ATT.004
  await tick();
  assert.match(lastFrame() ?? "", /› .*ATT\.004/);

  stdin.write("\r"); // enter → reading mode shows the capsule
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /⟡/);
  assert.match(f, /Selected attribute/);
});

test("typing filters the tree to matching nodes (type-to-filter)", async () => {
  const { stdin, lastFrame } = render(
    h(App, {
      slug: "fixture",
      graph: fixtureGraph(),
      initialState: { flagged: [], rejected: [] },
      onPersist: () => {},
    }),
  );
  await tick();
  for (const ch of "005") {
    stdin.write(ch);
    await tick();
  }
  const f = lastFrame() ?? "";
  assert.match(f, /ATT\.005/, "the matching node stays");
  assert.doesNotMatch(f, /ATT\.004/, "non-matching nodes are filtered out");
  assert.match(f, /filter: 005/, "the footer shows the active filter");
});
