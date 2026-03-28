---
name: ada-semantic-compilation-pipeline
description: "Use when invocation of Ada compiler entry point with sourceIntent, initiating CompilationRun with generated runId pattern detected."
---

# ada-semantic-compilation-pipeline

Trigger: invocation of Ada compiler entry point with sourceIntent, initiating CompilationRun with generated runId

## Steps
1. **initialize-compilation-run**
   - Pre: `sourceIntent is non-empty AND no active CompilationRun exists for the same pipelineRunId AND workspace packages are resolvable across all 8 targets`
   - Action: `allocate CompilationRun record with runId, set startedAt timestamp, set PipelineState.pipelineState to 'loading', emit run-started event`
   - Post: `CompilationRun.state = 'running', PipelineState.pipelineState = 'loading', runId is globally unique and indexed`

2. **load-blueprint-component-registry**
   - Pre: `CompilationRun.state = 'running' AND PipelineState.pipelineState = 'loading' AND registry source artifact is accessible at expected postcode address`
   - Action: `deserialize BlueprintComponentRegistry from registry source, validate totalComponentCount = 10, index all 10 NamedBlueprintComponent entries by ordinal and componentId, stamp registryId and pipelineRunId`
   - Post: `BlueprintComponentRegistry.totalComponentCount = 10, all 10 NamedBlueprintComponent records have non-null assignedPackage candidates OR are flagged for gap resolution, PipelineState.pipelineState transitions to 'binding'`

3. **resolve-c3-ordinal-gap-and-build-package-mapping**
   - Pre: `BlueprintComponentRegistry is loaded with 10 components AND PipelineState.pipelineState = 'binding' AND ComponentPackageMapping does not yet exist for this pipelineRunId`
   - Action: `iterate all 10 NamedBlueprintComponent entries to construct ComponentPackageAssignment records; detect C3AssignmentGap at ordinal-3 (isResolved=false); invoke gap-collapse sub-workflow to select resolvedPackage from candidatePackages; write ComponentPackageAssignment for C3 with isResolved=true; finalize ComponentPackageMapping with isTotal=true when all 10 assignments are resolved`
   - Post: `ComponentPackageMapping.isTotal = true, ComponentPackageMapping.assignmentCount = 10, C3AssignmentGap.isResolved = true AND C3AssignmentGap.state = 'collapsed', all ComponentPackageAssignment records have non-null targetPackage, PipelineState.pipelineState transitions to 'extracting'`

4. **extract-canonical-entities-into-entity-map**
   - Pre: `ComponentPackageMapping.isTotal = true AND PipelineState.pipelineState = 'extracting' AND no EntityMap exists for this pipelineRunId`
   - Action: `for each of the 10 NamedBlueprintComponent entries, extract entity name to produce CanonicalEntity with entityId and label; create ENTEntityRegistration linking sourceComponentId to entityMapPostcode and provenanceRecordPostcode; aggregate all 10 CanonicalEntity instances into EntityMap; stamp EntityMap with entityCount, pipelineRunId, and postcode`
   - Post: `EntityMap.entityCount = 10, EntityMap.postcode is a valid resolvable address, all 10 ENTEntityRegistration records exist with non-null provenanceRecordPostcode, PipelineState.entity is populated, PipelineState.pipelineState transitions to 'validating'`

5. **validate-provenance-chain-records**
   - Pre: `EntityMap is populated with entityCount = 10 AND PipelineState.pipelineState = 'validating' AND ProvenanceChainRecord entries exist (or must be constructed) for each of the 10 components`
   - Action: `for each NamedBlueprintComponent, traverse its ProvenanceChainRecord; assert hopCount = 3; validate each of the 3 ProvenanceChainHop entries for non-null hop data and correct sequential ordering; set ProvenanceChainRecord.provenanceIntact = true if all 3 hops pass; accumulate results; if all 10 chains are intact set ProvenanceGate to passing`
   - Post: `all 10 ProvenanceChainRecord instances have provenanceIntact = true AND hopCount = 3, ProvenanceGate is in passing state, PipelineState.verify is populated, PipelineState.pipelineState transitions to 'gating'`

6. **evaluate-ent-gate**
   - Pre: `ProvenanceGate is in passing state AND PipelineState.pipelineState = 'gating' AND ENTGateRecord for pipelineRunId ML.ENT.e80e3c97/v1 exists AND no active ENTBlocker is registered against this pipelineRunId`
   - Action: `load ENTGateRecord for ML.ENT.e80e3c97/v1; evaluate all registered ENTEntityRegistration entries against gate criteria; verify EntityMap postcode matches expected gate configuration; assert no ENTBlocker records are active; produce ENTStageResult with passing status; stamp ENTStageResult with evaluated pipelineRunId and timestamp`
   - Post: `ENTStageResult.status = 'passing', no active ENTBlocker exists for ML.ENT.e80e3c97/v1, PipelineState.gates includes ENT gate as passed, PipelineState.pipelineState transitions to 'emitting'`

7. **emit-compile-result**
   - Pre: `ENTStageResult.status = 'passing' AND PipelineState.pipelineState = 'emitting' AND all 8 workspace packages have zero TypeScript compilation errors AND all PipelineState stage fields (intent, persona, entity, process, synthesis, verify, governor, gates) are populated`
   - Action: `invoke TypeScript compiler across all 8 target workspace packages; assert zero errors; issue GovernorDecision based on cumulative PipelineState; construct CompileResult with blueprint reference, governorDecision, populated PipelineState snapshot, status='success', iterationCount, compilationRun reference; set CompilationRun.completedAt and totalDurationMs; set PipelineState.pipelineState to terminal 'success'`
   - Post: `CompileResult.status = 'success', CompilationRun.state = 'succeeded', CompilationRun.completedAt is set, PipelineState.pipelineState = 'success', GovernorDecision is non-null and references this CompilationRun, zero TypeScript errors across all 8 packages`
