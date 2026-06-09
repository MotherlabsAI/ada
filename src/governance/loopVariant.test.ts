import { test } from "node:test";
import assert from "node:assert/strict";
import {
  variant,
  strictlyDecreased,
  isConverged,
  projectLoopVariant,
  type LoopState,
} from "./loopVariant.js";
import type { PackModel } from "../core/types.js";

const s = (
  openChecks: number,
  unresolvedConflicts: number,
  frontierDepth: number,
): LoopState => ({
  openChecks,
  unresolvedConflicts,
  frontierDepth,
});

test("variant maps loop state to the lexicographic well-founded tuple (open_checks, conflicts, depth)", () => {
  assert.deepEqual(variant(s(3, 2, 1)), [3, 2, 1]);
});

test("strictlyDecreased is lexicographic — progress at ANY level counts, regress at a higher level does not", () => {
  assert.equal(
    strictlyDecreased(s(3, 2, 1), s(2, 9, 9)),
    true,
    "open_checks↓ dominates → progress",
  );
  assert.equal(
    strictlyDecreased(s(3, 2, 1), s(3, 1, 9)),
    true,
    "same open_checks, conflicts↓ → progress",
  );
  assert.equal(
    strictlyDecreased(s(3, 2, 1), s(3, 2, 0)),
    true,
    "same prefix, depth↓ → progress",
  );
  assert.equal(
    strictlyDecreased(s(3, 2, 1), s(3, 2, 1)),
    false,
    "no change → LIVELOCK (not decreasing)",
  );
  assert.equal(
    strictlyDecreased(s(3, 2, 1), s(3, 3, 0)),
    false,
    "conflicts↑ at same open_checks → not progress",
  );
});

test("isConverged: the measure bottoms out at (0,0,0) — well-founded, so the loop must terminate", () => {
  assert.equal(isConverged(s(0, 0, 0)), true);
  assert.equal(isConverged(s(0, 0, 1)), false, "frontier not exhausted");
});

test("projectLoopVariant emits LOOP_VARIANT.md — the halting argument + the livelock→replan escalation", () => {
  const f = projectLoopVariant({ slug: "demo" } as unknown as PackModel);
  assert.equal(f.path, "LOOP_VARIANT.md");
  assert.match(
    f.content,
    /well-founded|halts|terminat/i,
    "states the halting argument",
  );
  assert.match(
    f.content,
    /livelock|replan/i,
    "names the livelock→replan escalation",
  );
  assert.match(
    f.content,
    /ratchet/i,
    "distinguishes itself from the ratchet (no-regress vs must-progress)",
  );
});
