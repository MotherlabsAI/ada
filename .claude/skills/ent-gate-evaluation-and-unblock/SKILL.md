---
name: ent-gate-evaluation-and-unblock
description: "Use when provenance validation completes with all chains intact, pipeline run ML.ENT.e80e3c97/v1 is in stalled state awaiting gate clearance pattern detected."
---

# ent-gate-evaluation-and-unblock

Trigger: provenance validation completes with all chains intact, pipeline run ML.ENT.e80e3c97/v1 is in stalled state awaiting gate clearance

## Steps
1. **clear-active-ent-blockers**
   - Pre: `ENTGateRecord does not exist yet for pipelineRunId, one or more ENTBlocker records are active for this pipelineRunId`
   - Action: `enumerate all active ENTBlocker records, evaluate each blocker's clearance condition, mark clearable blockers as cleared, reject unclearable blockers with reason`
   - Post: `no ENTBlocker records remain active for this pipelineRunId, allBlockersCleared condition is satisfiable`

2. **evaluate-entity-count-condition**
   - Pre: `EntityMap exists for pipelineRunId with a valid postcode, allBlockersCleared === true`
   - Action: `read EntityMap.entityCount, assert entityCount > 0, bind entityCount to ENTGateRecord being constructed`
   - Post: `ENTGateRecord.entityCount === EntityMap.entityCount and entityCount > 0`

3. **evaluate-provenance-integrity-condition**
   - Pre: `all ProvenanceChainRecords for this pipelineRunId have been validated, each has hopCount === 3`
   - Action: `query all ProvenanceChainRecords for pipelineRunId, assert all provenanceIntact === true, bind aggregate provenanceIntact to ENTGateRecord`
   - Post: `ENTGateRecord.provenanceIntact === true, no ProvenanceChainRecord has provenanceIntact === false`

4. **write-ent-gate-record-and-governor-decision**
   - Pre: `ENTGateRecord.entityCount > 0, ENTGateRecord.provenanceIntact === true, ENTGateRecord.allBlockersCleared === true, no ENTGateRecord in passed state exists for this pipelineRunId`
   - Action: `set ENTGateRecord.passed = true, write evaluatedAt timestamp, create ENTProvenanceRecord for gate evaluation action, write governorDecisionPostcode, transition ENTGateRecord.state to passed`
   - Post: `ENTGateRecord.passed === true, ENTGateRecord.state === passed, governorDecisionPostcode is non-null and retrievable`

5. **unblock-stalled-pipeline-run**
   - Pre: `ENTGateRecord.passed === true for pipelineRunId ML.ENT.e80e3c97/v1, StalledPipelineRun record exists for this pipelineRunId`
   - Action: `read StalledPipelineRun record, verify blockingGateId matches the now-passed ENTGateRecord.gateId, mark StalledPipelineRun as unblocked, resume pipeline execution from the stalled stage`
   - Post: `StalledPipelineRun is no longer active, pipeline run ML.ENT.e80e3c97/v1 resumes execution, CompileResult.pipelineState transitions from stalled to running`
