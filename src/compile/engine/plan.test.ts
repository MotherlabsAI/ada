import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanPrompt, parseActionList, proposeActions } from "./plan.js";
import type { NodeSpec } from "../assemble.js";
import type { Seed } from "../../core/types.js";
import type { ModelClient } from "./model.js";

const seed = (): Seed =>
  ({
    rootIntent: "a governed record store",
    domain: "data infra",
    buildObjective: "records validated on one ingest path",
    trustObjective: "every write is checked",
    knownContext: [],
    unknownContext: [],
    assumptions: [],
    sources: [],
    constraints: [],
    risks: [],
  }) as unknown as Seed;

const world: NodeSpec[] = [
  {
    id: "DATA.001",
    label: "Record schema is fixed",
    cluster: "DATA",
    semanticType: "Invariant",
    summary: "records(id, kind, payload) — the contract every write obeys.",
    unknowns: ["retention window?"],
  } as unknown as NodeSpec,
  {
    id: "UNK.001",
    label: "No validation on the ingest path yet",
    cluster: "UNK",
    semanticType: "Unknown",
    summary: "writes currently bypass validation; the gap is unbuilt.",
    unknowns: ["which validator?"],
  } as unknown as NodeSpec,
];

const stub = (out: string): ModelClient => ({ complete: async () => out });

test("buildPlanPrompt frames the MOVE from current world → goal, lists the gaps, forbids fabrication (A2)", () => {
  const p = buildPlanPrompt(seed(), world);
  assert.match(
    p,
    /records validated on one ingest path/,
    "the goal is present",
  );
  assert.match(
    p,
    /No validation on the ingest path yet/,
    "the open gap is shown to plan against",
  );
  assert.match(p, /\bAction\b/, "it asks for Actions");
  assert.match(
    p,
    /already|do NOT invent|not an action|traced/i,
    "it forbids inventing a move the system already does (A2)",
  );
});

test("parseActionList extracts a JSON array of actions, tolerating fences/prose, dropping malformed", () => {
  const raw =
    "Here is the plan:\n```json\n" +
    JSON.stringify([
      {
        label: "Build the validating ingest gate",
        summary:
          "Add validate()→normalize()→persist as the single write path so every record is checked before it lands.",
        whyItMatters:
          "It is the only place validation can be enforced for all writes.",
        failureIfMissing:
          "Each call site validates differently and bad records slip in.",
        fromPrompt: ["records validated on one ingest path"],
        compilesTo: ["src/ingest.ts", "c/checks/ingest_validates.mjs"],
        checkClass: "C3",
        cCandidates: [
          "assert no write reaches the store without passing validate()",
        ],
        unknowns: ["which fields are required?"],
        truth: "inference",
        closesGap: "No validation on the ingest path yet",
      },
      { nonsense: true },
    ]) +
    "\n```\nThat covers it.";
  const drafts = parseActionList(raw);
  assert.equal(
    drafts.length,
    1,
    "the malformed entry is dropped, the real one kept",
  );
  assert.equal(drafts[0]!.label, "Build the validating ingest gate");
  assert.equal(drafts[0]!.closesGap, "No validation on the ingest path yet");
});

test("proposeActions gates the plan and emits typed Action nodes under PLAN, traced to the gap they close", async () => {
  const out = JSON.stringify([
    {
      label: "Build the validating ingest gate",
      summary:
        "Add validate()→normalize()→persist as the single write path so every record is checked before it lands.",
      whyItMatters:
        "It is the only place validation can be enforced for all writes.",
      failureIfMissing:
        "Each call site validates differently and bad records slip in.",
      fromPrompt: ["records validated on one ingest path"],
      compilesTo: ["src/ingest.ts", "c/checks/ingest_validates.mjs"],
      checkClass: "C3",
      cCandidates: [
        "assert no write reaches the store without passing validate()",
      ],
      unknowns: ["which fields are required?"],
      truth: "inference",
      closesGap: "No validation on the ingest path yet",
    },
    {
      // generic filler — MUST be gated out by the same rubric (A3)
      label: "Make it world-class",
      summary: "Leverage best practices for seamless quality.",
      whyItMatters: "It is very important.",
      failureIfMissing: "Things are worse.",
      fromPrompt: [],
      compilesTo: ["x"],
      checkClass: "C0",
      cCandidates: [],
      unknowns: [],
      truth: "inference",
      closesGap: "Record schema is fixed",
    },
  ]);
  const { actions, rejected } = await proposeActions(seed(), world, stub(out));
  assert.equal(actions.length, 1, "only the real move clears the gate");
  assert.equal(
    rejected.length,
    1,
    "the generic move is rejected, not silently dropped",
  );
  const a = actions[0]!;
  assert.equal(
    a.semanticType,
    "Action",
    "typed Action → flows into the POM's execution_plan",
  );
  assert.equal(a.cluster, "PLAN");
  assert.match(a.id, /^PLAN\.001$/, "clean positional id");
  assert.deepEqual(
    a.relations,
    [{ to: "UNK.001", type: "enables" }],
    "the action is wired to the gap node it closes (by resolving closesGap → that node's id)",
  );
});

test("proposeActions degrades to no actions on non-array output (stub/odd model → pack unchanged)", async () => {
  const { actions } = await proposeActions(seed(), world, stub('{"id":"X.1"}'));
  assert.deepEqual(
    actions,
    [],
    "a single-object (non-plan) response adds nothing",
  );
});
