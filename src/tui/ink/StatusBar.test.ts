import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { StatusBar } from "./StatusBar.js";

test("status bar shows pack stats", () => {
  const { lastFrame } = render(
    h(StatusBar, {
      slug: "demo",
      nodes: 24,
      checkable: 16,
      gated: 8,
      residue: 8,
      clusters: 5,
    }),
  );
  const f = lastFrame() ?? "";
  assert.match(f, /demo/);
  assert.match(f, /24/);
  assert.match(f, /◈/);
  // the R1 scan readout, not the old `C N` line
  assert.match(f, /checkable/);
  assert.match(f, /gated/);
});
