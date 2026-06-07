import { test } from "node:test";
import assert from "node:assert/strict";
import { assertBackingHonest } from "./coherence.js";

const LIE =
  "Each rule is backed by a runnable check in `c/checks/` — `node c/checks/verify.mjs`.";
const HONEST =
  "Each rule is a deterministic invariant the executor MUST implement and verify; the assertion is the acceptance test.";

test("a runnable-backing claim with no shipped checks is a lie (A2)", () => {
  const v = assertBackingHonest(LIE, false);
  assert.equal(v.honest, false);
  assert.match(v.reason ?? "", /runnable/);
});

test("the same claim is honest when the pack actually ships runnable checks", () => {
  assert.deepEqual(assertBackingHonest(LIE, true), { honest: true });
});

test("the executor-implements framing is honest with no shipped checks", () => {
  assert.deepEqual(assertBackingHonest(HONEST, false), { honest: true });
});

test('"enforced by a deterministic C check" is also a runnable-backing claim', () => {
  const v = assertBackingHonest(
    "Every rule traces to a node id and is enforced by a deterministic C check.",
    false,
  );
  assert.equal(v.honest, false);
});
