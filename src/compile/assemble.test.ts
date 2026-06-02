import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePackGated } from "./assemble.js";
import { GENERIC_EXEMPLARS, IMPRESSIVE_EXEMPLARS } from "./calibration.js";

test("rejected nodes are dropped from the pack and counted", () => {
  const specs = [...IMPRESSIVE_EXEMPLARS, ...GENERIC_EXEMPLARS];
  const { model, rejected } = assemblePackGated("t", "intent", specs);
  assert.equal(rejected.length, GENERIC_EXEMPLARS.length);
  // ROOT.000 + kept specs
  assert.equal(model.graph.nodes.length, IMPRESSIVE_EXEMPLARS.length + 1);
});
