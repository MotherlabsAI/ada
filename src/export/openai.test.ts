import { test } from "node:test";
import assert from "node:assert/strict";
import { openaiExports } from "./openai.js";
import type { PackModel } from "../core/types.js";

const model = (): PackModel =>
  ({ slug: "demo", graph: { nodes: [], edges: [] } }) as unknown as PackModel;

test("openaiExports emits the agents/handoffs/guardrails config (valid, deterministic JSON)", () => {
  const a = openaiExports(model());
  assert.deepEqual(
    a.map((f) => f.path).sort(),
    ["agents.json", "guardrails.json", "handoffs.json"],
    "the OpenAI Agents SDK trio is emitted",
  );
  for (const f of a)
    assert.doesNotThrow(() => JSON.parse(f.content), `${f.path} is valid JSON`);
  assert.equal(
    JSON.stringify(a),
    JSON.stringify(openaiExports(model())),
    "byte-stable",
  );
});

test("the agents are the governed set, each pointing at the pack's governed context", () => {
  const agents = JSON.parse(
    openaiExports(model()).find((f) => f.path === "agents.json")!.content,
  );
  const names = agents.map((a: { name: string }) => a.name);
  for (const want of ["governor", "architect", "implementer", "verifier"]) {
    assert.ok(names.includes(want), `the ${want} agent is defined`);
  }
  assert.match(
    JSON.stringify(agents),
    /POM\.md|AUTONOMY_CONTRACT\.md/,
    "agent instructions point at the governed family",
  );
});

test("guardrails encode the authority boundary (A1 floor, residue blocks, fail closed)", () => {
  const guards = JSON.parse(
    openaiExports(model()).find((f) => f.path === "guardrails.json")!.content,
  );
  const blob = JSON.stringify(guards);
  assert.match(
    blob,
    /A1|approval/i,
    "the propose-only authority floor is a guardrail",
  );
  assert.match(blob, /residue|unknown|hole/i, "residue blocks action");
  assert.match(blob, /fail closed|fail-closed/i, "verification fails closed");
});
