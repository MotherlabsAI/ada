import { test } from "node:test";
import assert from "node:assert/strict";
import { wrap, windowSlice, graphLines } from "./lines.js";
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

test("windowSlice returns everything when it already fits", () => {
  const items = [1, 2, 3];
  const { slice } = windowSlice(items, 0, 10);
  assert.deepEqual(slice, [1, 2, 3]);
});

test("graphLines marks the selected node's line", () => {
  const g = fixtureGraph();
  const first = g.nodes[0]!;
  const { lines, selectedLine } = graphLines(g, {
    selectedId: first.id,
    flagged: new Set(),
  });
  const line = lines[selectedLine]!;
  assert.ok(line.text.includes(first.id));
  assert.ok(line.text.startsWith("› "));
});
