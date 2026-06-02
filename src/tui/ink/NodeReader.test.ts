import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { NodeReader } from "./NodeReader.js";
import { fixtureGraph } from "./fixtures.js";

function att004() {
  return fixtureGraph().nodes.find((n) => n.id === "ATT.004")!;
}

test("node reader shows the capsule's content", () => {
  const { lastFrame } = render(h(NodeReader, { node: att004() }));
  const f = lastFrame() ?? "";
  // identity + summary (⟡)
  assert.match(f, /ATT\.004/);
  assert.match(f, /Selected attribute/);
  assert.match(f, /⟡/);
  assert.match(f, /summary/i);
  // why (∴) and failure (!)
  assert.match(f, /∴/);
  assert.match(f, /!/);
  // compiles-to (⊢)
  assert.match(f, /⊢/);
  assert.match(f, /blueprint/);
  // candidates (κ) and unknowns (Ω)
  assert.match(f, /κ/);
  assert.match(f, /attr_exists/);
  assert.match(f, /Ω/);
  assert.match(f, /pricing units/);
  // links
  assert.match(f, /PRO\.001/);
});

test("node reader renders without optional sections", () => {
  const bare = fixtureGraph().nodes.find((n) => n.id === "ATT.005")!;
  const { lastFrame } = render(h(NodeReader, { node: bare }));
  const f = lastFrame() ?? "";
  assert.match(f, /ATT\.005/);
  assert.match(f, /Sibling attribute/);
});
