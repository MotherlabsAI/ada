import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { Text } from "ink";
import { render } from "ink-testing-library";

test("ink renders text", () => {
  const { lastFrame } = render(h(Text, null, "hello-ada"));
  assert.match(lastFrame() ?? "", /hello-ada/);
});
