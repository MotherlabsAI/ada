---
name: resolve-c3-assignment-gap-and-complete-package-mapping
description: "Use when ComponentPackageMapping.isTotal evaluates to false because C3AssignmentGap.state = 'open' pattern detected."
---

# resolve-c3-assignment-gap-and-complete-package-mapping

Trigger: ComponentPackageMapping.isTotal evaluates to false because C3AssignmentGap.state = 'open'

## Steps
1. **detect-c3-gap**
   - Pre: `ComponentPackageMapping exists with assignmentCount < 10 AND C3AssignmentGap.componentOrdinal = 3 AND C3AssignmentGap.state = 'open'`
   - Action: `query BlueprintComponentRegistry for ordinal-3 component; confirm candidatePackages list is non-empty; bind gapId to the active C3AssignmentGap record`
   - Post: `C3AssignmentGap record is located, gapId is bound, candidatePackages list is materialized and non-empty, state remains 'open'`

2. **select-collapse-resolution-strategy**
   - Pre: `C3AssignmentGap.state = 'open' AND candidatePackages is non-empty AND CollapseResolutionStrategy for this gapId does not yet exist`
   - Action: `evaluate each candidate package against: bounded context alignment of ordinal-3 component, existing priorOccupantComponentIds load, requiresSharedResponsibility flag; select collapseIntoPackage with highest alignment score; instantiate CollapseResolutionStrategy record with strategyId, targetGapId, collapseIntoPackage, selectionRationale, isApplied=false`
   - Post: `CollapseResolutionStrategy record exists with isApplied=false; collapseIntoPackage references a valid WorkspacePackageNode; selectionRationale is non-empty string`

3. **apply-collapse-strategy**
   - Pre: `CollapseResolutionStrategy.isApplied = false AND CollapseResolutionStrategy.collapseIntoPackage is a valid, reachable WorkspacePackageNode AND C3AssignmentGap.state = 'open'`
   - Action: `write collapseIntoPackage into C3AssignmentGap.resolvedPackage; transition C3AssignmentGap.state from 'open' to 'resolving'; set CollapseResolutionStrategy.isApplied = true; update ComponentPackageAssignment record for ordinal-3 with targetPackage = collapseIntoPackage and isResolved = true; write resolutionProvenancePostcode referencing CollapseResolutionStrategy.strategyId`
   - Post: `C3AssignmentGap.state = 'resolving'; CollapseResolutionStrategy.isApplied = true; ComponentPackageAssignment for ordinal-3 has isResolved = true; resolutionProvenancePostcode is non-null`

4. **finalize-assignment-and-mark-mapping-total**
   - Pre: `All 10 ComponentPackageAssignment records for this pipelineRunId have isResolved = true AND C3AssignmentGap.state = 'resolving'`
   - Action: `transition C3AssignmentGap.state to 'resolved'; set C3AssignmentGap.isResolved = true; populate C3AssignmentGap.resolutionProvenancePostcode; set ComponentPackageMapping.isTotal = true; set ComponentPackageMapping.assignmentCount = 10; write mapping postcode`
   - Post: `ComponentPackageMapping.isTotal = true AND ComponentPackageMapping.assignmentCount = 10 AND C3AssignmentGap.isResolved = true AND C3AssignmentGap.state = 'resolved'`
