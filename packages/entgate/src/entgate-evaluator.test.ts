/**
 * Tests for ENTGateEvaluator.
 * Run: node --test dist/entgate-evaluator.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTGateEvaluator } from "./entgate-evaluator.js";
import { PipelineRunManager, ProvenanceRecordWriter } from "@ada/ent";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

test("ENTGateEvaluator: gate passes when all conditions met", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(10, true, true, PIPELINE_RUN_ID);

  assert.equal(gate.passed, true);
  assert.equal(gate.entityCount, 10);
  assert.equal(gate.provenanceIntact, true);
  assert.equal(gate.allBlockersCleared, true);
  assert.equal(gate.state, "passed");
  assert.ok(gate.evaluatedAt !== null && gate.evaluatedAt > 0);
  assert.ok(
    gate.governorDecisionPostcode !== null &&
      gate.governorDecisionPostcode.length > 0,
  );
  assert.equal(gate.pipelineRunId, PIPELINE_RUN_ID);
});

test("ENTGateEvaluator: gate fails when entityCount=0", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(0, true, true, PIPELINE_RUN_ID);

  assert.equal(gate.passed, false);
  assert.equal(gate.state, "failed");
  assert.equal(gate.governorDecisionPostcode, null);
  assert.equal(gate.evaluatedAt, null);
});

test("ENTGateEvaluator: gate fails when provenanceIntact=false", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(10, false, true, PIPELINE_RUN_ID);
  assert.equal(gate.passed, false);
  assert.equal(gate.state, "failed");
});

test("ENTGateEvaluator: gate fails when allBlockersCleared=false", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(10, true, false, PIPELINE_RUN_ID);
  assert.equal(gate.passed, false);
  assert.equal(gate.state, "failed");
});

test("ENTGateEvaluator: getGate returns pending gate before evaluation", () => {
  const evaluator = new ENTGateEvaluator();
  const pending = evaluator.getGate();

  assert.equal(pending.passed, false);
  assert.equal(pending.state, "pending");
  assert.equal(pending.evaluatedAt, null);
  assert.equal(pending.governorDecisionPostcode, null);
});

test("ENTGateEvaluator: validateGateInvariants passes for valid passing gate", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(10, true, true, PIPELINE_RUN_ID);
  assert.doesNotThrow(() => evaluator.validateGateInvariants(gate));
});

test("ENTGateEvaluator: advancePipelineRun advances when gate passes", () => {
  const writer = new ProvenanceRecordWriter();
  const evaluator = new ENTGateEvaluator(writer);
  const runManager = new PipelineRunManager();
  const run = runManager.loadStalledRun(PIPELINE_RUN_ID);

  const gate = evaluator.evaluateGate(10, true, true, PIPELINE_RUN_ID);
  const result = evaluator.advancePipelineRun(gate, run);

  assert.equal(result.advanced, true);
  assert.ok(result.reason.length > 0);
  assert.ok(result.reason.includes(PIPELINE_RUN_ID));
});

test("ENTGateEvaluator: getGovernorDecision returns ACCEPT for passing gate", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(10, true, true, PIPELINE_RUN_ID);
  const decision = evaluator.getGovernorDecision(gate);
  assert.equal(decision, "ACCEPT");
});

test("ENTGateEvaluator: getGovernorDecision returns REJECT for failing gate", () => {
  const evaluator = new ENTGateEvaluator();
  const gate = evaluator.evaluateGate(0, true, true, PIPELINE_RUN_ID);
  const decision = evaluator.getGovernorDecision(gate);
  assert.equal(decision, "REJECT");
});
