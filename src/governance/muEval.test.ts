import { test } from "node:test";
import assert from "node:assert/strict";
import { muStats, compareArms } from "./muEval.js";

test("muStats computes n/mean/min/max/stdev over μ samples", () => {
  const s = muStats([2, 4, 4, 4, 5, 5, 7, 9]); // classic stdev=2 (population)
  assert.equal(s.n, 8);
  assert.equal(s.mean, 5);
  assert.equal(s.min, 2);
  assert.equal(s.max, 9);
  assert.equal(s.stdev, 2);
});

test("muStats is empty-safe", () => {
  assert.deepEqual(muStats([]), { n: 0, mean: 0, min: 0, max: 0, stdev: 0 });
});

test("compareArms flags a clearly separated improvement as signal", () => {
  // treatment (repo-aware) clearly fewer holes than baseline (intent-only), no overlap
  const c = compareArms([64, 66, 65], [50, 52, 48]);
  assert.ok(c.deltaMean > 0, "treatment has fewer holes on average");
  assert.equal(
    c.strictlyBelow,
    true,
    "every treatment run below every baseline run",
  );
  assert.equal(
    c.separated,
    true,
    "Δ exceeds combined spread → signal, not noise",
  );
});

test("compareArms refuses to call an overlapping Δ a signal (honest)", () => {
  // means differ but the runs overlap — within run-to-run noise
  const c = compareArms([60, 52, 65], [58, 50, 63]);
  assert.equal(c.strictlyBelow, false);
  assert.equal(
    c.separated,
    false,
    "overlapping arms are not a trustworthy signal",
  );
});

test("direction 'higher' (μ′ sense) rewards a higher treatment, separated when clean", () => {
  const c = compareArms([8, 9, 10], [18, 19, 20], "higher");
  assert.equal(
    c.strictlyAbove,
    true,
    "every treatment run above every baseline run",
  );
  assert.equal(
    c.separated,
    true,
    "Δ in the favourable (higher) direction exceeds the spread",
  );
});

test("direction 'higher' refuses an overlapping Δ (honest, μ′ sense)", () => {
  const c = compareArms([8, 20, 12], [10, 19, 11], "higher");
  assert.equal(c.strictlyAbove, false);
  assert.equal(c.separated, false);
});
