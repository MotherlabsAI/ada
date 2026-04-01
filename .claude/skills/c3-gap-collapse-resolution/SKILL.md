---
name: c3-gap-collapse-resolution
description: "Use when C3AssignmentGap detected with isResolved === false during ordinal assignment scan for pipelineRunId ML.ENT.e80e3c97/v1 pattern detected."
---

# c3-gap-collapse-resolution

Trigger: C3AssignmentGap detected with isResolved === false during ordinal assignment scan for pipelineRunId ML.ENT.e80e3c97/v1

## Steps
1. **validate-single-gap-constraint**
   - Pre: `ordinal scan has completed across all 10 components, at least one C3AssignmentGap record exists with isResolved === false`
   - Action: `count all C3AssignmentGap records with isResolved === false for this pipelineRunId, assert count === 1`
   - Post: `exactly one unresolved C3AssignmentGap is confirmed, gap is safe to proceed with collapse resolution`

2. **enumerate-candidate-packages**
   - Pre: `exactly one C3AssignmentGap exists with isResolved === false, gap.componentId is present in registry`
   - Action: `query WorkspacePackageNode records for the monorepo, cross-reference gap.boundedContext against package assignments, populate C3AssignmentGap.candidatePackages with all valid workspace package names`
   - Post: `C3AssignmentGap.candidatePackages.length >= 1, all candidates are registered workspace packages in the pnpm monorepo`

3. **select-and-assign-resolution-package**
   - Pre: `C3AssignmentGap.candidatePackages.length >= 1, all candidates are valid workspace packages, C3AssignmentGap.isResolved === false`
   - Action: `apply assignment priority rules to select one package from candidatePackages, write selectedPackage to C3AssignmentGap.resolvedPackage, set isResolved = true, set state = resolved`
   - Post: `C3AssignmentGap.isResolved === true, resolvedPackage is non-null and is a valid workspace package, state === resolved`

4. **write-resolution-provenance-postcode**
   - Pre: `C3AssignmentGap.isResolved === true, resolvedPackage is non-null, ENTProvenanceRecord write infrastructure is available`
   - Action: `create ENTProvenanceRecord for the resolution action with stage=OrdinalAssignment, actionType=GapCollapse, subjectId=gapId, write postcode, bind postcode to C3AssignmentGap.resolutionProvenancePostcode`
   - Post: `C3AssignmentGap.resolutionProvenancePostcode is non-null, ENTProvenanceRecord exists and is retrievable by postcode`

5. **assert-mapping-totality**
   - Pre: `C3AssignmentGap.isResolved === true and resolutionProvenancePostcode is non-null, all 10 ComponentPackageAssignment records exist`
   - Action: `count all ComponentPackageAssignment records for pipelineRunId, assert count === 10, set ComponentPackageMapping.isTotal = true, write mapping postcode`
   - Post: `ComponentPackageMapping.isTotal === true, ComponentPackageMapping.assignmentCount === 10, ComponentPackageMapping.postcode is written`
