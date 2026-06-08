import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNode } from "./navigator.js";
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
