import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isStrictlyDominated,
  validateGrantChain,
  projectSpawnAuthority,
  type SpawnGrant,
} from "./spawnAuthority.js";
import type { PackModel } from "../core/types.js";

const g = (depth: number, fanout: number): SpawnGrant => ({ depth, fanout });

test("isStrictlyDominated: a child grant must strictly shrink depth and never exceed fan-out (no escalation)", () => {
  assert.equal(
    isStrictlyDominated(g(2, 4), g(3, 8)),
    true,
    "depth↓, fan-out≤ → dominated",
  );
  assert.equal(
    isStrictlyDominated(g(2, 8), g(3, 8)),
    true,
    "equal fan-out, depth↓ → still dominated",
  );
  assert.equal(
    isStrictlyDominated(g(3, 4), g(3, 8)),
    false,
    "same depth → NOT strictly less → rejected",
  );
  assert.equal(
    isStrictlyDominated(g(2, 9), g(3, 8)),
    false,
    "fan-out exceeds parent → escalation, rejected",
  );
  assert.equal(
    isStrictlyDominated(g(4, 4), g(3, 8)),
    false,
    "deeper than parent → escalation, rejected",
  );
});

test("validateGrantChain: a descending chain is ok; any escalation names the violating hop (ORCH.003)", () => {
  assert.equal(
    validateGrantChain([g(3, 8), g(2, 4), g(1, 2)]).ok,
    true,
    "monotone descent",
  );
  const bad = validateGrantChain([g(3, 8), g(2, 4), g(2, 9)]);
  assert.equal(bad.ok, false, "a fan-out escalation breaks the chain");
  assert.equal(bad.violationAt, 2, "the violating hop index is named");
  assert.equal(
    validateGrantChain([]).ok,
    true,
    "empty chain is vacuously safe",
  );
  assert.equal(
    validateGrantChain([g(5, 5)]).ok,
    true,
    "a lone root grant is safe",
  );
});

test("projectSpawnAuthority emits SPAWN_AUTHORITY.md — root is human-set (A4), children strictly dominated, never ambient", () => {
  const f = projectSpawnAuthority({ slug: "demo" } as unknown as PackModel);
  assert.equal(f.path, "SPAWN_AUTHORITY.md");
  assert.match(
    f.content,
    /depth.*fan-?out|fan-?out.*depth/i,
    "the capability-token shape is documented",
  );
  assert.match(f.content, /A4|human/i, "the root grant is the human's gate");
  assert.match(
    f.content,
    /strictly dominat/i,
    "children must pass a strictly-dominated grant",
  );
  assert.match(
    f.content,
    /never ambient|not ambient/i,
    "authority is a token, never ambient",
  );
});
