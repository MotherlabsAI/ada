import { test } from "node:test";
import assert from "node:assert";
import { evaluateSemanticDrift } from "./semantic-drift.js";
import type { Blueprint } from "@ada/compiler";
import type { ClaudeEvent } from "@ada/orchestrator";

function makeBlueprint(): Blueprint {
  return {
    summary: "test blueprint",
    scope: {
      inScope: [],
      outOfScope: [],
      primaryActors: [],
      boundedContexts: [],
    },
    architecture: {
      pattern: "monolith",
      components: [],
      postcode: {
        raw: "ML.SYN.test01/v1",
        namespace: "ML",
        stage: "SYN",
        hash: "test01",
        version: 1,
      },
    },
    dataModel: {
      entities: [
        {
          name: "Payment",
          category: "substance",
          properties: [{ name: "amount", type: "number" }],
          invariants: [
            {
              predicate: "payment.amount > 0",
              description: "must be positive",
            },
          ],
        },
      ],
      boundedContexts: [],
      challenges: [],
      postcode: {
        raw: "ML.ENT.test02/v1",
        namespace: "ML",
        stage: "ENT",
        hash: "test02",
        version: 1,
      },
    },
    processModel: {
      workflows: [],
      stateMachines: [],
      hoareTriples: [],
      resolvedConflicts: [],
      challenges: [],
      postcode: {
        raw: "ML.PRO.test03/v1",
        namespace: "ML",
        stage: "PRO",
        hash: "test03",
        version: 1,
      },
    },
    nonFunctional: [],
    openQuestions: [],
    resolvedConflicts: [],
    postcode: {
      raw: "ML.SYN.test04/v1",
      namespace: "ML",
      stage: "SYN",
      hash: "test04",
      version: 1,
    },
  } as unknown as Blueprint;
}

test("semantic drift returns [] on empty event list", async () => {
  const blueprint = makeBlueprint();
  const result = await evaluateSemanticDrift(blueprint, []);
  // Either null (no API key) or empty array. Both are valid "no drift".
  assert.ok(result === null || (Array.isArray(result) && result.length === 0));
});

test("semantic drift returns null when API key is missing", async () => {
  const original = process.env["ANTHROPIC_API_KEY"];
  delete process.env["ANTHROPIC_API_KEY"];
  try {
    const blueprint = makeBlueprint();
    const events: ClaudeEvent[] = [
      {
        session_id: "test",
        parent_tool_use_id: null,
        event: { type: "content_block_stop" },
      } as unknown as ClaudeEvent,
    ];
    const result = await evaluateSemanticDrift(blueprint, events);
    assert.strictEqual(result, null);
  } finally {
    if (original !== undefined) process.env["ANTHROPIC_API_KEY"] = original;
  }
});
