import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNode, renderTree } from "./navigator.js";
import { fixtureGraph } from "./ink/fixtures.js";

test("the static inspector PROJECTS the sectioned reader — one source of truth with the Ink path (ROOT.001)", () => {
  const g = fixtureGraph();
  const node = g.nodes[0]!;
  const out = renderNode(g, node);
  // It now renders lines.ts readerLines: section labels, not the old ⟡/∴/! glyph-soup.
  assert.match(out, /SUMMARY/, "the sectioned reader's SUMMARY label");
  assert.match(
    out,
    /FAILURE IF MISSING/,
    "the sectioned reader's failure label",
  );
  assert.doesNotMatch(out, /⟡/, "the old static-only glyph format is gone");
  assert.ok(out.includes(node.id), "the node id is present");
});

test("the static tree PROJECTS graphTree — verification stripe + connectors, not the old ◆ header (ROOT.001)", () => {
  const g = fixtureGraph();
  const out = renderTree(g, { flagged: [], rejected: [] });
  assert.match(out, /[├└]─/, "graphTree connectors, not flat cluster lines");
  assert.match(out, /[✓⊙Ω]/, "the per-node verification stripe is present");
  assert.doesNotMatch(out, /◆ /, "the old deep-blue ◆ cluster header is gone");
});
