import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isVerifierPath,
  verifierDenyGlobs,
  projectWriteFirewall,
} from "./writeFirewall.js";
import type { PackModel } from "../core/types.js";

const model = (): PackModel => ({ slug: "demo" }) as unknown as PackModel;

test("isVerifierPath flags the judge's namespace — checks, tests, registry, schemas (the generator may not write these)", () => {
  assert.equal(
    isVerifierPath("c/checks/verify.mjs"),
    true,
    "the C-checks ARE the judge",
  );
  assert.equal(isVerifierPath("src/foo.test.ts"), true, "tests are the judge");
  assert.equal(
    isVerifierPath("c/registry.yaml"),
    true,
    "the check registry is the judge",
  );
  assert.equal(
    isVerifierPath("schemas/asset.schema.json"),
    true,
    "validation schemas are the judge",
  );
  assert.equal(
    isVerifierPath("src/foo.ts"),
    false,
    "ordinary build output is NOT the judge — writable",
  );
  assert.equal(
    isVerifierPath("exports/blueprint/POM.md"),
    false,
    "context artifacts are writable",
  );
});

test("verifierDenyGlobs is a non-empty, deterministic deny-set the runtime hook can enforce", () => {
  const a = verifierDenyGlobs();
  assert.ok(a.length > 0, "there is a judge namespace to protect");
  assert.deepEqual(a, verifierDenyGlobs(), "deterministic");
  assert.ok(
    a.some((g) => /checks/.test(g)),
    "the C-checks are denied",
  );
});

test("projectWriteFirewall emits WRITE_FIREWALL.md — anti-Goodhart rule + how it's enforced (PreToolUse)", () => {
  const f = projectWriteFirewall(model());
  assert.equal(f.path, "WRITE_FIREWALL.md");
  assert.match(
    f.content,
    /cannot write its own judge|generator.*judge/i,
    "states the invariant",
  );
  assert.match(
    f.content,
    /Goodhart|editing the check|satisfaction surface/i,
    "names the anti-Goodhart reason",
  );
  assert.match(
    f.content,
    /PreToolUse|hook|deny/i,
    "names the runtime enforcement seam",
  );
  assert.match(
    f.content,
    /c\/checks|\.test\./,
    "lists the denied judge namespace",
  );
});
