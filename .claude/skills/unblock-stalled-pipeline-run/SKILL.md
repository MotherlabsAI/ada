---
name: unblock-stalled-pipeline-run
description: "Use when detection that pipeline run ML.ENT.e80e3c97/v1 is in STALLED state at ENT stage with no recent state transition pattern detected."
---

# unblock-stalled-pipeline-run

Trigger: detection that pipeline run ML.ENT.e80e3c97/v1 is in STALLED state at ENT stage with no recent state transition

## Steps
1. **diagnose-stall-cause**
   - Pre: `pipelineRunId ML.ENT.e80e3c97/v1 exists in STALLED state; ENT stage is the current stage`
   - Action: `query C3AssignmentGap for pipelineRunId — check isResolved; query ENTGateRecord for pipelineRunId — check if evaluated; query active blockers for pipelineRunId; query ProvenanceChainRecord for provenanceIntact; query EntityMap for entityCount`
   - Post: `stall cause is classified into one of: GAP_UNRESOLVED, GATE_NOT_EVALUATED, EXTRACTION_NOT_STARTED, PROVENANCE_BROKEN, UNKNOWN; cause is logged with evidence postcodes`

2. **clear-open-blockers-and-gaps**
   - Pre: `stall cause is identified; C3AssignmentGap.isResolved=false OR active blockers exist for pipelineRunId`
   - Action: `if cause=GAP_UNRESOLVED: execute resolve-C3-assignment-gap sub-workflow; if cause=PROVENANCE_BROKEN: re-execute validate-three-hop-provenance-chain; if cause=EXTRACTION_NOT_STARTED: execute extract-and-register-entities sub-workflow; mark cleared blockers as RESOLVED with resolution timestamp`
   - Post: `C3AssignmentGap.isResolved=true; no active blockers remain for pipelineRunId; ComponentPackageMapping.isTotal=true`

3. **resume-pipeline-run-through-ENT-gate**
   - Pre: `pipelineRunId is in STALLED state; C3AssignmentGap.isResolved=true; EntityMap.entityCount >= 10; ProvenanceChainRecord.provenanceIntact=true; no active blockers`
   - Action: `transition pipeline run from STALLED to RESUMING; re-execute evaluate-ENT-gate step; on gate passed, transition pipeline run to ADVANCED; write final ENTGateRecord with passed=true`
   - Post: `pipeline run ML.ENT.e80e3c97/v1 is no longer in STALLED state; ENTGateRecord.passed=true; pipeline run state=ADVANCED; next stage is triggered`

4. **verify-codebase-integrity-after-changes**
   - Pre: `pipeline run has advanced past ENT stage; any TypeScript source files were modified during ENT integration implementation`
   - Action: `run TypeScript compiler with --noEmit; run existing test suite; verify no new type errors; verify all pre-existing tests pass; check that no ENT-stage entity files were accidentally deleted or overwritten`
   - Post: `TypeScript compilation exits with code 0; test suite passes with zero new failures; codebase is in consistent state with all ENT integration changes applied`
