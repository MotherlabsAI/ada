import { test } from "node:test";
import assert from "node:assert/strict";
import { IMPRESSIVE_EXEMPLARS, GENERIC_EXEMPLARS } from "./calibration.js";
import { scoreNode } from "./rubric.js";

test("rubric marks every impressive exemplar pass-or-impress", () => {
  for (const ex of IMPRESSIVE_EXEMPLARS) {
    assert.notEqual(scoreNode(ex).verdict, "reject", `false-reject: ${ex.id}`);
  }
});

test("rubric rejects every generic exemplar", () => {
  for (const ex of GENERIC_EXEMPLARS) {
    assert.equal(scoreNode(ex).verdict, "reject", `false-accept: ${ex.id}`);
  }
});
