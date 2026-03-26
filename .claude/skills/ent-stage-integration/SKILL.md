---
name: ent-stage-integration
description: "Use when pipeline run enters ENT stage with a BlueprintComponentRegistry containing 10 components pattern detected."
---

# ENT-stage-integration

Trigger: pipeline run enters ENT stage with a BlueprintComponentRegistry containing 10 components

## Steps
1. **load-and-validate-blueprint-registry**
   - Pre: `BlueprintComponentRegistry exists for pipelineRunId with totalComponentCount=10 and postcode is set`
   - Action: `read all 10 NamedBlueprintComponents from registry, assert count matches totalComponentCount, verify each has ordinal, name, responsibility, boundedContext`
   - Post: `10 NamedBlueprintComponents are in memory, ordered by ordinal 0–9, each field non-null`

2. **assign-components-to-workspace-packages**
   - Pre: `10 NamedBlueprintComponents loaded; 8 WorkspacePackageNodes exist with known packageNames; no ComponentPackageMapping exists for this pipelineRunId`
   - Action: `iterate components by ordinal, match each to a targetPackage using boundedContext affinity rules, write one ComponentPackageAssignment per component, write ComponentPackageMapping with assignmentCount and isTotal flag`
   - Post: `ComponentPackageMapping exists with assignmentCount=10; each ComponentPackageAssignment has targetPackage set; isTotal=true only if all 10 are resolved; each WorkspacePackageNode has its assignedComponentIds updated`

3. **resolve-C3-assignment-gap**
   - Pre: `C3AssignmentGap exists for pipelineRunId with isResolved=false and candidatePackages is non-empty; ComponentPackageMapping.isTotal=false`
   - Action: `evaluate candidatePackages using responsibility-text similarity score; select highest-scoring package as resolvedPackage; write ENTProvenanceRecord for resolution decision; update C3AssignmentGap.isResolved=true and resolvedPackage; update corresponding ComponentPackageAssignment.targetPackage; set ComponentPackageMapping.isTotal=true`
   - Post: `C3AssignmentGap.state=RESOLVED; ComponentPackageAssignment for ordinal 3 has targetPackage non-null and isResolved=true; ComponentPackageMapping.isTotal=true; resolutionProvenancePostcode written`

4. **extract-and-register-entities-into-entity-map**
   - Pre: `ComponentPackageMapping.isTotal=true; all 10 ComponentPackageAssignments have isResolved=true; EntityMap for pipelineRunId does not yet exist or has entityCount=0`
   - Action: `for each ComponentPackageAssignment, read the NamedBlueprintComponent's name and responsibility, extract entity names using semantic parse, create one ENTEntityRegistration per extracted entity with sourceComponentId and targetRegistryType, write entityMapPostcode and provenanceRecordPostcode per registration, accumulate into EntityMap`
   - Post: `EntityMap exists with entityCount >= 10 (at least one entity per component); each ENTEntityRegistration has registeredAt timestamp, entityMapPostcode, and provenanceRecordPostcode non-null; EntityMap.postcode is written`

5. **validate-three-hop-provenance-chain**
   - Pre: `EntityMap.postcode exists; at least one ENTEntityRegistration per component exists with provenanceRecordPostcode set; ProvenanceChainRecord for pipelineRunId does not yet have provenanceIntact=true`
   - Action: `for each component, construct ProvenanceChainRecord with hopCount=3; trace hop 0: BlueprintComponentRegistry postcode → ComponentPackageAssignment provenanceRecordPostcode; trace hop 1: ComponentPackageAssignment → ENTEntityRegistration provenanceRecordPostcode; trace hop 2: ENTEntityRegistration → EntityMap postcode; mark each ProvenanceChainHop.isTraced; set ProvenanceChainRecord.provenanceIntact based on all hops traced`
   - Post: `ProvenanceChainRecord exists for pipelineRunId with hopCount=3; all ProvenanceChainHops have isTraced=true; ProvenanceChainRecord.provenanceIntact=true; ProvenanceChainRecord.postcode written`

6. **evaluate-ENT-gate**
   - Pre: `EntityMap.entityCount >= 1; ProvenanceChainRecord.provenanceIntact is determined (true or false); no uncleared ENT blockers remain in active state`
   - Action: `read entityCount from EntityMap; read provenanceIntact from ProvenanceChainRecord; read allBlockersCleared by querying active blocker list for pipelineRunId; compute passed = (entityCount > 0 AND provenanceIntact AND allBlockersCleared); write ENTGateRecord with evaluatedAt timestamp and governorDecisionPostcode; set ENTGateRecord.state`
   - Post: `ENTGateRecord exists with passed=true or passed=false; evaluatedAt is set; if passed=true then pipeline run advances past ENT stage; if passed=false then pipeline run remains at ENT stage with GATE_FAILED state`
