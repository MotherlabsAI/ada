import { test } from "node:test";
import assert from "node:assert/strict";
import { projectToolContracts } from "./tools.js";
import type { PackModel } from "../core/types.js";

const model = (shipsRunnableChecks = false): PackModel =>
  ({
    slug: "demo",
    shipsRunnableChecks,
    graph: { nodes: [], edges: [] },
  }) as unknown as PackModel;

test("projectToolContracts emits the bounded tool set, each with authority + preconditions + forbidden + on-failure", () => {
  const md = projectToolContracts(model());
  for (const tool of ["run-checks", "run-tests", "edit-file"]) {
    assert.match(
      md,
      new RegExp(`tool: ${tool}`),
      `the ${tool} contract is present`,
    );
  }
  assert.match(md, /authority A0/, "the read-only verify tool is A0");
  assert.match(md, /preconditions/i, "every tool declares preconditions");
  assert.match(
    md,
    /forbidden effects/i,
    "every tool declares forbidden effects",
  );
  assert.match(md, /on failure/i, "every tool declares failure behavior");
});

test("tools are bound to autonomy + the callers — no capability without a contract", () => {
  const md = projectToolContracts(model());
  assert.match(
    md,
    /AUTONOMY_CONTRACT\.md/,
    "ties to the authority ladder (A4)",
  );
  assert.match(
    md,
    /no tool runs above the caller's granted autonomy/i,
    "the binding rule is explicit",
  );
  assert.match(md, /caller: verifier/i, "run-checks is the verifier's tool");
  assert.match(
    md,
    /caller: implementer/i,
    "edit/test tools are the implementer's",
  );
});

test("run-checks honestly reflects whether the pack ships runnable checks (A2: no false backing)", () => {
  assert.match(
    projectToolContracts(model(true)),
    /runnable C-checks/,
    "real checks → named",
  );
  assert.match(
    projectToolContracts(model(false)),
    /no runnable checks yet|candidate/i,
    "no real checks → said plainly, not faked",
  );
});
