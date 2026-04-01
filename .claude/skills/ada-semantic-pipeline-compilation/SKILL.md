---
name: ada-semantic-pipeline-compilation
description: "Use when pipeline run ML.ENT.e80e3c97/v1 initiated or restarted via CompilationRun activation pattern detected."
---

# ada-semantic-pipeline-compilation

Trigger: pipeline run ML.ENT.e80e3c97/v1 initiated or restarted via CompilationRun activation

## Steps
1. **load-blueprint-component-registry**
   - Pre: `pipelineRunId is active, no BlueprintComponentRegistry exists for this pipelineRunId, component source records are queryable`
   - Action: `query exactly 10 NamedBlueprintComponent records, assign sequential ordinals, bind to BlueprintComponentRegistry, compute and write registry postcode`
   - Post: `BlueprintComponentRegistry.totalComponentCount === 10, all 10 components have unique ordinals, registry.postcode is non-null and written`

2. **detect-c3-ordinal-assignment-gaps**
   - Pre: `BlueprintComponentRegistry exists with totalComponentCount === 10, ComponentPackageMapping does not yet exist for this pipelineRunId`
   - Action: `iterate all 10 component ordinals in sequence, check each against candidate package assignments, record any ordinal with no resolvable package assignment as a C3AssignmentGap`
   - Post: `all C3AssignmentGap records created with isResolved === false, gapId and pipelineRunId bound, candidatePackages populated where discoverable`

3. **collapse-c3-ordinal-gap**
   - Pre: `exactly one C3AssignmentGap exists with isResolved === false, candidatePackages.length >= 1, no other gaps are unresolved`
   - Action: `select resolvedPackage from candidatePackages using assignment priority rules, set C3AssignmentGap.isResolved = true, write resolutionProvenancePostcode, create ComponentPackageAssignment for the gap component, update ComponentPackageMapping.isTotal = true`
   - Post: `C3AssignmentGap.state === resolved, ComponentPackageMapping.isTotal === true, ComponentPackageMapping.assignmentCount === 10, postcode written on mapping`

4. **extract-entities-into-entity-map**
   - Pre: `ComponentPackageMapping.isTotal === true, ComponentPackageMapping.assignmentCount === 10, EntityMap does not exist for this pipelineRunId`
   - Action: `iterate all ComponentPackageAssignments, extract canonical entity name from each component, create ENTEntityRegistration per component, accumulate into EntityMap, write entityMapPostcode`
   - Post: `EntityMap.entityCount > 0, all ENTEntityRegistration records have non-null entityMapPostcode and provenanceRecordPostcode, EntityMap.postcode is written`

5. **validate-provenance-chains**
   - Pre: `EntityMap exists with entityCount > 0, ProvenanceChainRecord exists per component with hops array populated, each ProvenanceChainRecord.hopCount === 3`
   - Action: `for each ProvenanceChainRecord iterate its 3 ProvenanceChainHops, verify each isTraced === true, verify hop chain continuity where hops[n].toLabel === hops[n+1].fromLabel, write provenanceIntact flag and postcode`
   - Post: `all ProvenanceChainRecords have provenanceIntact === true, all hops have isTraced === true, postcode written on each record`

6. **evaluate-ent-gate**
   - Pre: `EntityMap.entityCount > 0, all ProvenanceChainRecords have provenanceIntact === true, no ENTBlockers are active for this pipelineRunId, no ENTGateRecord exists for this pipelineRunId`
   - Action: `create ENTGateRecord, evaluate entityCount > 0, evaluate provenanceIntact across all chains, evaluate allBlockersCleared, set passed = true if all conditions met, write evaluatedAt timestamp and governorDecisionPostcode`
   - Post: `ENTGateRecord.passed === true, ENTGateRecord.state === passed, governorDecisionPostcode written, CompileResult.governorDecision updated`

7. **finalize-compile-result**
   - Pre: `ENTGateRecord.passed === true, all pipeline stages have written postcodes, CompileResult exists in compiling state for this pipelineRunId`
   - Action: `set CompileResult.status = passed, bind governorDecision from ENTGateRecord.governorDecisionPostcode, set pipelineState = complete, increment iterationCount, write compilationRun terminal record`
   - Post: `CompileResult.status === passed, CompileResult.fallback === null, pipelineState === complete, iterationCount reflects total attempts`
