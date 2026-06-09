import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attribute,
  projectAttribution,
  type FailureContext,
} from "./attribution.js";
import type { PackModel } from "../core/types.js";

const ctx = (lastGreenHash: string, currentHash: string): FailureContext => ({
  checkId: "C.1",
  lastGreenHash,
  currentHash,
});

test("attribute: artifact bytes UNCHANGED since last green ⇒ exogenous (the world broke, not my artifact)", () => {
  const r = attribute(ctx("h1", "h1"));
  assert.equal(r.kind, "exogenous");
  assert.equal(
    r.route,
    "world-handler",
    "do NOT repair an innocent artifact — handle the dependency/world",
  );
});

test("attribute: artifact bytes CHANGED then went red ⇒ endogenous (my patch broke it) → repair lane", () => {
  const r = attribute(ctx("h1", "h2"));
  assert.equal(r.kind, "endogenous");
  assert.equal(r.route, "repair-lane");
});

test("projectAttribution emits ATTRIBUTION.md — the one deterministic handle + the don't-repair-the-innocent rule", () => {
  const f = projectAttribution({ slug: "demo" } as unknown as PackModel);
  assert.equal(f.path, "ATTRIBUTION.md");
  assert.match(f.content, /exogenous|endogenous/i, "names both failure kinds");
  assert.match(
    f.content,
    /unchanged|content hash|bytes/i,
    "states the deterministic handle",
  );
  assert.match(
    f.content,
    /repair.*innocent|not.*repair|world/i,
    "an exogenous failure must not enter the repair lane",
  );
});
