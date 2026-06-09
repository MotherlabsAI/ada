import { test } from "node:test";
import assert from "node:assert/strict";
import {
  passingSet,
  ratchetAdmits,
  staleGreens,
  projectRatchet,
  type CheckState,
} from "./ratchet.js";
import type { PackModel } from "../core/types.js";

const c = (id: string, green: boolean, artifactHash = "h0"): CheckState => ({
  id,
  green,
  artifactHash,
});

test("passingSet is the set of currently-green check ids", () => {
  assert.deepEqual(
    [...passingSet([c("A", true), c("B", false), c("C", true)])].sort(),
    ["A", "C"],
  );
});

test("ratchetAdmits: a patch is admitted iff the green-set never shrinks (monotone passing-set, PLAN.001)", () => {
  assert.equal(
    ratchetAdmits(
      [c("A", true), c("B", true)],
      [c("A", true), c("B", true), c("C", true)],
    ).ok,
    true,
    "added a green → fine",
  );
  const r = ratchetAdmits(
    [c("A", true), c("B", true)],
    [c("A", true), c("B", false)],
  );
  assert.equal(
    r.ok,
    false,
    "a previously-green check went red → REJECT the patch",
  );
  assert.deepEqual(r.regressed, ["B"], "the regressed check is named");
});

test("staleGreens (VER.002): a green is NOT inherited — it expires when its artifact hash drifts", () => {
  const before = [c("A", true, "h1"), c("B", true, "h2")];
  const stale = staleGreens(before, { A: "h1", B: "hX" }); // B's artifact changed under it
  assert.deepEqual(
    stale,
    ["B"],
    "B's green is stale — must be re-earned, not trusted",
  );
});

test("projectRatchet emits RATCHET.md — the monotone gate + the no-inherited-green rule", () => {
  const f = projectRatchet({ slug: "demo" } as unknown as PackModel);
  assert.equal(f.path, "RATCHET.md");
  assert.match(
    f.content,
    /passing.?set|never shrink|monotone/i,
    "states the monotone gate",
  );
  assert.match(
    f.content,
    /hash|re-earned|inherited/i,
    "states hash-pinned, no inherited green",
  );
});
