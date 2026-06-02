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
      checks: 3,
      residue: 8,
      clusters: 5,
    }),
  );
  const f = lastFrame() ?? "";
  assert.match(f, /demo/);
  assert.match(f, /24/);
  assert.match(f, /◈/);
});
