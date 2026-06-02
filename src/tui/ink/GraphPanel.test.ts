import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { GraphPanel } from "./GraphPanel.js";
import { fixtureGraph } from "./fixtures.js";

test("highlights the selected node and lists clusters", () => {
  const { lastFrame } = render(
    h(GraphPanel, {
      graph: fixtureGraph(),
      selectedId: "ATT.004",
      flagged: new Set<string>(),
    }),
  );
  const f = lastFrame() ?? "";
  assert.match(f, /› .*ATT\.004/);
  assert.match(f, /◆ ATT/);
});

test("marks flagged nodes and renders every cluster", () => {
  const { lastFrame } = render(
    h(GraphPanel, {
      graph: fixtureGraph(),
      selectedId: "ATT.004",
      flagged: new Set<string>(["ATT.005"]),
    }),
  );
  const f = lastFrame() ?? "";
  assert.match(f, /◆ ATT/);
  assert.match(f, /◆ PRO/);
  assert.match(f, /ATT\.005/);
  assert.match(f, /⊙/);
});
