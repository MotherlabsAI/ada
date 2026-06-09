import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyDelta,
  applyChannel,
  authorityRank,
  isMonotone,
  projectRevocation,
  type Authority,
  type Delta,
} from "./revocation.js";
import type { PackModel } from "../core/types.js";

test("applyDelta shrinks authority — and can NEVER raise it (the loop can't re-grant itself)", () => {
  assert.equal(
    applyDelta("active", "NARROW"),
    "narrowed",
    "ACTIVE + NARROW → narrowed",
  );
  assert.equal(applyDelta("active", "PAUSE"), "paused");
  assert.equal(
    applyDelta("paused", "NARROW"),
    "paused",
    "NARROW can't lift a paused loop back up — monotone",
  );
  assert.equal(applyDelta("narrowed", "REVOKE"), "revoked");
  assert.equal(
    applyDelta("revoked", "NARROW"),
    "revoked",
    "REVOKE is terminal — nothing re-grants",
  );
});

test("applyChannel folds an append-only delta sequence; the result is the floor of all deltas", () => {
  assert.equal(
    applyChannel("active", ["NARROW", "PAUSE"] as Delta[]),
    "paused",
  );
  assert.equal(
    applyChannel("active", ["PAUSE", "REVOKE", "NARROW"] as Delta[]),
    "revoked",
    "once revoked, stays revoked",
  );
});

test("isMonotone: an authority trace never increases rank (bounded autonomy stays bounded)", () => {
  assert.equal(
    isMonotone(["active", "narrowed", "paused", "revoked"] as Authority[]),
    true,
  );
  assert.equal(
    isMonotone(["paused", "active"] as Authority[]),
    false,
    "paused→active is a re-grant — forbidden via the channel",
  );
  assert.ok(authorityRank("active") > authorityRank("revoked"));
});

test("projectRevocation emits REVOCATION.md — passive sovereignty: bounded-latency, monotone, no self-grant", () => {
  const f = projectRevocation({ slug: "demo" } as unknown as PackModel);
  assert.equal(f.path, "REVOCATION.md");
  assert.match(f.content, /PAUSE|NARROW|REVOKE/, "the three deltas");
  assert.match(
    f.content,
    /bounded.?latency|every checkpoint/i,
    "bounded-latency revocability (GOV.003)",
  );
  assert.match(
    f.content,
    /monotone|never.*grant|fresh.*compile/i,
    "re-granting needs a fresh human compile, not the channel",
  );
});
