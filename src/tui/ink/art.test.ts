import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gradient,
  bannerGradient,
  starFrame,
  STAR_FRAMES,
  WORDMARK,
} from "./art.js";

test("gradient ramps linearly between two hexes", () => {
  const g = gradient(3, "#000000", "#ffffff");
  assert.equal(g.length, 3);
  assert.equal(g[0], "#000000");
  assert.equal(g[2], "#ffffff");
  assert.match(g[1]!, /^#[0-9a-f]{6}$/);
});

test("starFrame cycles through the star glyphs and wraps", () => {
  assert.equal(starFrame(0), STAR_FRAMES[0]);
  assert.equal(starFrame(STAR_FRAMES.length), STAR_FRAMES[0]);
  assert.equal(starFrame(-1), STAR_FRAMES[STAR_FRAMES.length - 1]);
});

const PIG = { terracotta: "#B8543C", clay: "#C66A43", amber: "#D59632" };

test("bannerGradient returns one hex per wordmark row", () => {
  const g = bannerGradient(WORDMARK.length, 0, PIG);
  assert.equal(g.length, WORDMARK.length);
  for (const c of g) assert.match(c, /^#[0-9a-f]{6}$/);
});

test("bannerGradient is deterministic and animates (different steps differ)", () => {
  const a = bannerGradient(6, 0, PIG, 24).join();
  const a2 = bannerGradient(6, 0, PIG, 24).join();
  const b = bannerGradient(6, 6, PIG, 24).join();
  assert.equal(a, a2, "same step → same colours (pure)");
  assert.notEqual(a, b, "a different step should shift the ramp");
});

test("bannerGradient is a there-and-back cycle (period wraps to start)", () => {
  const start = bannerGradient(6, 0, PIG, 24).join();
  const wrapped = bannerGradient(6, 24, PIG, 24).join();
  assert.equal(start, wrapped, "one full period returns to the start colour");
});
