---
name: ent-stage-pipeline-execution
description: "Use when PipelineRun ML.ENT.e80e3c97/v1 enters ENT stage with state=stalled pattern detected."
---

# ENT-Stage-Pipeline-Execution

Trigger: PipelineRun ML.ENT.e80e3c97/v1 enters ENT stage with state=stalled

## Steps
1. **load-blueprint-registry**
   - Pre: `BlueprintComponentRegistry exists with pipelineRunId=ML.ENT.e80e3c97/v1 AND totalComponentCount=10 AND postcode is valid AND all 10 NamedBlueprintComponent records have non-null ordinal and assignedPackage fields initialized`
   - Action: `read BlueprintComponentRegistry from store, deserialize all 10 NamedBlueprintComponent entries, verify postcode integrity, bind registry to ENT stage execution context`
   - Post: `registry is loaded in-memory with components array of length 10, each component has ordinal in [0..9], registryId matches pipelineRunId, execution context holds a live registry reference`

2. **build-component-package-mapping**
   - Pre: `registry is loaded with 10 components AND 8 WorkspacePackageNode records exist for this pipeline stage AND ComponentPackageMapping record is in draft state with isTotal=false`
   - Action: `iterate over 10 NamedBlueprintComponent records in ordinal order, create one ComponentPackageAssignment per component binding componentId to targetPackage, detect any component whose assignedPackage is null or ambiguous, write assignments array to ComponentPackageMapping, set assignmentCount=10`
   - Post: `ComponentPackageMapping has assignmentCount=10 AND assignments array contains 10 ComponentPackageAssignment records AND each assignment has isResolved=false initially AND collapseRecords array is populated for the two collapse events needed to achieve 10→8 mapping`

3. **resolve-c3-assignment-gap**
   - Pre: `C3AssignmentGap record exists with componentOrdinal=3 AND state=unresolved AND candidatePackages is non-empty AND ComponentPackageMapping is in draft state`
   - Action: `evaluate candidatePackages list using bounded-context affinity rules: select the WorkspacePackageNode whose boundedContext label best matches the NamedBlueprintComponent at ordinal-3, write resolvedPackage, set isResolved=true, write CollapseRecord pairing the collapsed component with the primary at same targetPackage, update C3AssignmentGap state to resolved, write resolutionProvenancePostcode`
   - Post: `C3AssignmentGap.isResolved=true AND resolvedPackage is non-null AND one CollapseRecord exists referencing componentOrdinal=3 as either primaryComponentOrdinal or collapsedComponentOrdinal AND corresponding ComponentPackageAssignment for ordinal-3 has isResolved=true`

4. **finalize-component-package-mapping**
   - Pre: `all 10 ComponentPackageAssignment records have isResolved=true AND C3AssignmentGap has state=resolved AND collapseRecords contains exactly 2 CollapseRecord entries producing the 10→8 collapse`
   - Action: `set ComponentPackageMapping.isTotal=true, compute and write mapping postcode from all assignment and collapse hashes, persist final mapping record`
   - Post: `ComponentPackageMapping.isTotal=true AND assignmentCount=10 AND collapseRecords.length=2 AND postcode is written and valid AND exactly 8 distinct targetPackage values appear across all assignments`

5. **extract-canonical-entities-into-entity-map**
   - Pre: `ComponentPackageMapping.isTotal=true AND ENTEntityMap record exists for pipelineRunId with entityCount=0 AND all 10 NamedBlueprintComponent records have non-null boundedContext`
   - Action: `for each NamedBlueprintComponent in ordinal order: instantiate CanonicalEntity with entityId, label derived from component name, sourceComponentId, sourceComponentOrdinal, boundedContext, category, properties, invariants, and provenancePostcode; create ENTEntityRegistration linking sourceComponentId to canonicalEntityId; append entity to ENTEntityMap.entities array; increment entityCount`
   - Post: `ENTEntityMap.entityCount=10 AND entities array contains 10 CanonicalEntity records AND each CanonicalEntity has a non-null provenancePostcode AND 10 ENTEntityRegistration records exist each with a non-null entityMapPostcode`

6. **validate-provenance-chain-records**
   - Pre: `ENTEntityMap.entityCount=10 AND one ProvenanceChainRecord exists per component (10 total) each with hopCount=3 AND each ProvenanceChainRecord has 3 ProvenanceChainHop entries`
   - Action: `for each ProvenanceChainRecord: iterate hops in hopIndex order, verify each hop has isTraced=true and non-null provenanceRecordPostcode, verify fromLabel→toLabel transitions form a valid three-hop chain (source component → canonical entity → entity map), set provenanceIntact=true if all 3 hops pass, write chain postcode`
   - Post: `all 10 ProvenanceChainRecord entries have provenanceIntact=true AND every ProvenanceChainHop has isTraced=true AND no hop has a null provenanceRecordPostcode`

7. **evaluate-ent-gate**
   - Pre: `ComponentPackageMapping.isTotal=true AND ENTEntityMap.entityCount=10 AND all ProvenanceChainRecord entries have provenanceIntact=true AND ENTGateRecord exists with state=pending`
   - Action: `load ENTGateRecord, evaluate all gate criteria in sequence: (1) mapping totality check, (2) entity count check against expected=10, (3) provenance integrity check across all chains, (4) C3 gap resolution confirmation; if all criteria pass set ENTGateRecord state to passed; write ENTStageResult with outcome=pass and timestamp; if any criterion fails set state to failed and record which criterion failed`
   - Post: `ENTGateRecord.state=passed AND ENTStageResult.outcome=pass AND ENTStageResult is persisted with pipelineRunId=ML.ENT.e80e3c97/v1`

8. **unblock-pipeline-run**
   - Pre: `ENTGateRecord.state=passed AND ENTStageResult.outcome=pass AND PipelineRun ML.ENT.e80e3c97/v1 has state=stalled`
   - Action: `locate StalledPipelineRun record for ML.ENT.e80e3c97/v1, clear ENTBlocker records associated with this run, transition PipelineRun state from stalled to proceeding, emit pipeline-continuation event to downstream stage`
   - Post: `PipelineRun state=proceeding AND no active ENTBlocker records remain for this pipelineRunId AND downstream stage has received continuation signal`
