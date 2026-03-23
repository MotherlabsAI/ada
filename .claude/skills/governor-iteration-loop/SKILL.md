---
name: governor-iteration-loop
description: "Use when GovernorDecision.verdict is ITERATE pattern detected."
---

# governor-iteration-loop

Trigger: GovernorDecision.verdict is ITERATE

## Steps
1. **extract-iteration-target**
   - Pre: `GovernorDecision.verdict is ITERATE and GovernorDecision.reentryStage is a valid stage code`
   - Action: `read GovernorDecision.violationIds and reentryStage; load the PipelineState snapshot captured at reentryStage; create IterationRecord with iterationNumber incremented from prior count`
   - Post: `IterationRecord exists with iterationNumber, reentryStage, violationIds, and a reference to the originating CompilationRun.runId`

2. **replay-pipeline-from-checkpoint**
   - Pre: `IterationRecord is present with valid reentryStage and iterationNumber is within ceiling`
   - Action: `restore PipelineState to snapshot at reentryStage; re-execute all stages from reentryStage onward using the same DeterminismMetadata (modelId, temperature); accumulate new StageExecutionRecords under the same CompilationRun.runId`
   - Post: `all stages from reentryStage to govern-blueprint have new StageExecutionRecords; PipelineState.cumulativeEntropy is updated; a new AuditReport and GovernorDecision are produced`

3. **seal-compilation-run**
   - Pre: `GovernorDecision.verdict is ACCEPT or REJECT (not ITERATE)`
   - Action: `set CompilationRun.completedAt to current timestamp; compute CompilationRun.totalDurationMs; attach final GovernorDecision, AuditReport, and Blueprint (if ACCEPT) or null Blueprint (if REJECT); write CompilationRun to provenance store`
   - Post: `CompilationRun is immutable and retrievable by runId; if ACCEPT then Blueprint is the authoritative output; if REJECT then CompilationRun.stages contains the full failure trace`
