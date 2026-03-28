---
name: evaluate-ent-stage-to-passing-result
description: "Use when ComponentPackageMapping.isTotal = true AND ENTBlocker.isCleared = false for pipelineRunId ML.ENT.e80e3c97/v1 pattern detected."
---

# evaluate-ent-stage-to-passing-result

Trigger: ComponentPackageMapping.isTotal = true AND ENTBlocker.isCleared = false for pipelineRunId ML.ENT.e80e3c97/v1

## Steps
1. **load-blueprint-component-registry**
   - Pre: `BlueprintComponentRegistry exists for pipelineRunId with totalComponentCount = 10 AND all 10 NamedBlueprintComponent records have non-null assignedPackage`
   - Action: `fetch BlueprintComponentRegistry by pipelineRunId; iterate all 10 NamedBlueprintComponent entries; verify each has componentId, ordinal, name, responsibility, boundedContext, and assignedPackage populated`
   - Post: `Registry is loaded in memory with exactly 10 components; each component record is complete and structurally valid; registry postcode matches expected value`

2. **extract-and-register-canonical-entities**
   - Pre: `BlueprintComponentRegistry is loaded with 10 complete components AND ENTEntityMap does not yet contain entries for this pipelineRunId OR ENTEntityMap.entityCount < expected entity count`
   - Action: `for each NamedBlueprintComponent in registry: instantiate CanonicalEntity with entityId and label derived from componentId and name; fire ENTEntityRegistration event with sourceComponentId, extractedEntityName, targetRegistryType='ENTEntityMap', registeredAt=now; accumulate entities into ENTEntityMap; increment entityCount per registration`
   - Post: `ENTEntityMap.entityCount equals number of registered entities; each CanonicalEntity has non-null entityId and label; each ENTEntityRegistration has non-null registrationId, registeredAt, provenanceRecordPostcode; ENTEntityMap.postcode is written`

3. **verify-three-hop-provenance-chains**
   - Pre: `ENTEntityMap is populated AND each ENTEntityRegistration has a non-null provenanceRecordPostcode AND ProvenanceChainRecord records exist or can be constructed for each registered entity`
   - Action: `for each ENTEntityRegistration: retrieve or construct ProvenanceChainRecord; traverse hops array; verify hopCount = 3; verify each hop links: (1) source NamedBlueprintComponent → (2) ENTEntityRegistration event → (3) ENTEntityMap entry; set provenanceIntact = true if all three hops resolve; write chain postcode`
   - Post: `Every ProvenanceChainRecord for this pipelineRunId has hopCount = 3 AND provenanceIntact = true AND postcode is non-null; no ProvenanceChainRecord has a broken hop`

4. **evaluate-ent-gate**
   - Pre: `All ProvenanceChainRecord.provenanceIntact = true AND ENTEntityMap.entityCount > 0 AND ENTEntityMap.postcode is non-null AND ComponentPackageMapping.isTotal = true AND BlueprintComponentRegistry.totalComponentCount = 10`
   - Action: `instantiate ENTGateRecord for pipelineRunId; evaluate all gate conditions: (1) registry completeness, (2) entity map population, (3) provenance chain integrity, (4) mapping totality; if all pass write ENTStageResult with passing=true; if any fail write ENTStageResult with passing=false and record which condition failed`
   - Post: `ENTStageResult exists with passing=true; ENTGateRecord references this pipelineRunId; all gate condition checks are recorded in ENTGateRecord`

5. **clear-ent-blocker-and-resume-pipeline**
   - Pre: `ENTStageResult.passing = true AND ENTBlocker.isCleared = false AND ENTBlocker.pipelineRunId = 'ML.ENT.e80e3c97/v1'`
   - Action: `set ENTBlocker.isCleared = true; write ENTBlocker.clearedAt = now; write ENTBlocker.clearanceProvenancePostcode referencing ENTStageResult; decrement StalledPipelineRun.blockerCount by 1; if blockerCount reaches 0 set StalledPipelineRun.resumable = true and transition pipeline state from 'stalled' to 'running'`
   - Post: `ENTBlocker.isCleared = true; StalledPipelineRun.blockerCount is decremented; if blockerCount = 0 then StalledPipelineRun.resumable = true and pipeline transitions to running state`
