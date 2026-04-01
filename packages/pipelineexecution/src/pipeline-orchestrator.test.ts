/**
 * Tests for PipelineOrchestrator.
 * Run: node --test dist/pipeline-orchestrator.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { PipelineOrchestrator } from "./pipeline-orchestrator.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

test("PipelineOrchestrator: run() produces successful CompileResult", async () => {
  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run();

  assert.equal(
    result.status,
    "success",
    `expected success, got: ${result.status}`,
  );
  assert.equal(result.compilationRunId, PIPELINE_RUN_ID);
  assert.equal(result.pipelineState, "success");
  assert.ok(result.completedAt > 0, "completedAt must be positive");
  assert.ok(result.iterationCount > 0, "iterationCount must be > 0");
  assert.ok(result.reason.length > 0, "reason must be non-empty");
});

test("PipelineOrchestrator: run() ENT stage result has passing gate", async () => {
  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run();

  assert.equal(result.entStageResult.gatePassed, true);
  assert.equal(result.entStageResult.mappingIsTotal, true);
  assert.ok(result.entStageResult.entityCount >= 10);
  assert.equal(result.entStageResult.provenanceIntact, true);
  assert.equal(result.entStageResult.allBlockersCleared, true);
  assert.equal(result.entStageResult.c3ResolvedPackage, "elicitation");
});

test("PipelineOrchestrator: run() produces governor decision postcode", async () => {
  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run();

  assert.ok(
    result.governorDecision !== null && result.governorDecision.length > 0,
    "governorDecision must be non-null when gate passes",
  );
});

test("PipelineOrchestrator: run() audit trail has records", async () => {
  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run();

  assert.ok(
    result.entStageResult.auditRecordCount > 0,
    "audit records must be written",
  );
});

test("PipelineOrchestrator: run() reason references pipeline run ID", async () => {
  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run();
  assert.ok(
    result.reason.includes(PIPELINE_RUN_ID),
    "reason must reference the pipeline run ID",
  );
});
