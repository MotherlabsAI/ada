---
name: ent-entity-registration-provenance-validation-and-gate-passage
description: "Use when ComponentPackageMapping.isTotal=true AND StalledPipelineRun.blockerCount=0 AND StalledPipelineRun.resumable=true pattern detected."
---

# ent-entity-registration-provenance-validation-and-gate-passage

Trigger: ComponentPackageMapping.isTotal=true AND StalledPipelineRun.blockerCount=0 AND StalledPipelineRun.resumable=true

## Steps
1. **extract-and-register-entities-from-mapping**
   - Pre: `ComponentPackageMapping.isTotal=true AND all 10 ComponentPackageAssignment.isResolved=true AND EntityMap target registry is accessible for pipelineRunId ML.ENT.e80e3c97/v1`
   - Action: `for each ComponentPackageAssignment, extract entity name from componentName, determine targetRegistryType (EntityMap for domain entities, ProvenanceRecord sink for events, type registry for type-tagged components), create ENTEntityRegistration record with sourceComponentId, extractedEntityName, targetRegistryType, entityMapPostcode; write registration to EntityMap; increment entity count`
   - Post: `ENTEntityRegistration records created for all 10 components AND EntityMap contains entityCount >= 10 entries bound to pipelineRunId AND each ENTEntityRegistration has provenanceRecordPostcode set`

2. **validate-three-hop-provenance-chain**
   - Pre: `ENTEntityRegistration records exist for all 10 components AND ProvenanceChainRecord for pipelineRunId is absent or in PENDING state AND each ComponentPackageAssignment has provenanceRecordPostcode set`
   - Action: `for each component, trace hop-1: component → assignedPackage (via ComponentPackageAssignment.provenanceRecordPostcode), trace hop-2: assignedPackage → pipeline stage (via package's stage binding ProvenanceRecord), trace hop-3: pipeline stage → pipelineRunId (via StalledPipelineRun / ENTProvenanceRecord chain); create ProvenanceChainHop records for each hop with isTraced=true/false; set ProvenanceChainRecord.provenanceIntact = (all hops isTraced=true)`
   - Post: `ProvenanceChainRecord.hopCount=3 AND all ProvenanceChainHop.isTraced=true AND ProvenanceChainRecord.provenanceIntact=true AND postcode written`

3. **evaluate-ent-gate**
   - Pre: `EntityMap.entityCount >= 10 AND ProvenanceChainRecord.provenanceIntact=true AND StalledPipelineRun.blockerCount=0 AND ENTBlocker.isCleared=true for all blockers of pipelineRunId`
   - Action: `create ENTGateRecord with entityCount from EntityMap, provenanceIntact from ProvenanceChainRecord, allBlockersCleared from ENTBlocker aggregate state; invoke GovernorDecision (SYNGate at ENT boundary); if all conditions met set passed=true; write governorDecisionPostcode and evaluatedAt`
   - Post: `ENTGateRecord.passed=true AND governorDecisionPostcode is set AND evaluatedAt is recorded AND pipeline run stage advances beyond ENT`

4. **write-audit-provenance-records-for-all-mapping-and-extraction-actions**
   - Pre: `all prior steps in both workflows have completed AND each step produced at least one action with a subjectId AND no ProvenanceRecord postcode is null for any completed action`
   - Action: `for each action performed in steps 1–7 that has not yet received a finalized ENTProvenanceRecord: write ENTProvenanceRecord with stage=ENT, upstreamPostcodes linking to prior records in chain, content describing the action, actionType matching the step's provenanceActionType, subjectId, pipelineRunId, and timestamp; seal audit trail as append-only`
   - Post: `ENTProvenanceRecord exists for every action performed across both workflows AND upstreamPostcodes form a directed acyclic chain from step-1 through step-7 AND no orphan actions exist (every action has a postcode)`
