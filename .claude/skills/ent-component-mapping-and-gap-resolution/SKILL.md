---
name: ent-component-mapping-and-gap-resolution
description: "Use when StalledPipelineRun detected at ENT stage with blockerCount >= 1 and C3AssignmentGap.isResolved = false pattern detected."
---

# ent-component-mapping-and-gap-resolution

Trigger: StalledPipelineRun detected at ENT stage with blockerCount >= 1 and C3AssignmentGap.isResolved = false

## Steps
1. **enumerate-blueprint-components**
   - Pre: `BlueprintComponentRegistry exists with registryId bound to pipelineRunId ML.ENT.e80e3c97/v1 AND totalComponentCount is declared`
   - Action: `iterate registry.components to materialize 10 NamedBlueprintComponent records, each with componentId, ordinal (1–10), name, responsibility, and boundedContext populated from Blueprint or BlueprintArchitecture artifacts`
   - Post: `exactly 10 NamedBlueprintComponent records exist with ordinals 1–10, all names non-null, assignedPackage may be null for unresolved entries`

2. **build-initial-component-package-mapping**
   - Pre: `10 NamedBlueprintComponent records exist AND ComponentPackageMapping record for pipelineRunId is absent or in DRAFT state AND 8 target workspace packages are enumerable (compiler, config-writer, elicitation, governor, int-rerun, mcp-server, orchestrator, provenance)`
   - Action: `for each NamedBlueprintComponent with a determinable package assignment, create a ComponentPackageAssignment record with isResolved=true; for C3 (ordinal=3) leave isResolved=false and populate candidatePackages; set ComponentPackageMapping.assignmentCount and compute isTotal = (resolvedCount == 10)`
   - Post: `ComponentPackageMapping exists with assignmentCount=10, 9 ComponentPackageAssignment records have isResolved=true, exactly 1 record (C3) has isResolved=false, isTotal=false`

3. **resolve-c3-assignment-gap**
   - Pre: `C3AssignmentGap.isResolved=false AND C3AssignmentGap.candidatePackages is non-empty AND C3AssignmentGap.gapId is linked to ENTBlocker.linkedGapId AND pipelineRunId matches`
   - Action: `evaluate candidatePackages against C3 component's responsibility and boundedContext; select resolvedPackage deterministically (one of the 8 workspace packages); set C3AssignmentGap.resolvedPackage, set isResolved=true; update corresponding ComponentPackageAssignment.targetPackage and isResolved=true; write resolutionProvenancePostcode`
   - Post: `C3AssignmentGap.isResolved=true AND C3AssignmentGap.resolvedPackage is one of {compiler, config-writer, elicitation, governor, int-rerun, mcp-server, orchestrator, provenance} AND ComponentPackageAssignment for C3 has isResolved=true AND provenanceRecordPostcode is set`

4. **finalize-mapping-and-clear-ent-blocker**
   - Pre: `C3AssignmentGap.isResolved=true AND all 10 ComponentPackageAssignment records have isResolved=true AND ENTBlocker linked to C3 gap has isCleared=false`
   - Action: `set ComponentPackageMapping.isTotal=true; set ENTBlocker.isCleared=true, record ENTBlocker.clearedAt timestamp, write clearanceProvenancePostcode; update StalledPipelineRun.blockerCount to 0`
   - Post: `ComponentPackageMapping.isTotal=true AND ENTBlocker.isCleared=true AND StalledPipelineRun.blockerCount=0 AND StalledPipelineRun.resumable=true`
