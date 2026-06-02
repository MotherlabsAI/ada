import { test } from "node:test";
import assert from "node:assert/strict";
import { hasBannedGenericPhrase, specificityScore } from "./quality-signals.js";

test("flags generic filler phrases", () => {
  assert.equal(
    hasBannedGenericPhrase("Quality you can trust, leveraging best practices."),
    true,
  );
  assert.equal(
    hasBannedGenericPhrase(
      "Salience is a zero-sum budget allocated in the first 200ms.",
    ),
    false,
  );
});

test("specificity rewards numbers, named mechanisms, concrete nouns", () => {
  const high = specificityScore(
    "In the first 2.6s the pre-attentive system allocates a fixed pool by luminance and motion.",
  );
  const low = specificityScore(
    "This is important for users and helps them a lot.",
  );
  assert.ok(high > low);
  assert.ok(high >= 2);
  assert.equal(low <= 1, true);
});
