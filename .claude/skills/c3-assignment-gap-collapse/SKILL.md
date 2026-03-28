---
name: c3-assignment-gap-collapse
description: "Use when C3AssignmentGap detected at ordinal-3 with isResolved=false during ComponentPackageMapping construction within the binding stage pattern detected."
---

# c3-assignment-gap-collapse

Trigger: C3AssignmentGap detected at ordinal-3 with isResolved=false during ComponentPackageMapping construction within the binding stage

## Steps
1. **detect-and-register-c3-gap**
   - Pre: `NamedBlueprintComponent at ordinal-3 exists in loaded BlueprintComponentRegistry AND no ComponentPackageAssignment with isResolved=true exists for this componentId AND C3AssignmentGap record does not yet exist for this pipelineRunId`
   - Action: `read ordinal-3 component's assignedPackage field; detect null or unresolved state; create C3AssignmentGap record with gapId, pipelineRunId, componentOrdinal=3, componentName, componentId, populate candidatePackages from boundedContext-aware package resolver; set state='detected', isResolved=false`
   - Post: `C3AssignmentGap record exists with state='detected', candidatePackages is non-empty array, isResolved=false, gapId is indexed for this pipelineRunId`

2. **evaluate-and-select-resolved-package**
   - Pre: `C3AssignmentGap.state = 'detected' AND candidatePackages is non-empty AND all candidatePackages are valid WorkspacePackageNode entries`
   - Action: `score each candidatePackage against selection criteria: boundedContext alignment, existing component co-location, package responsibility overlap with component's responsibility field; select highest-scoring candidate as resolvedPackage; transition C3AssignmentGap.state to 'resolving'; record selection rationale in resolutionProvenancePostcode`
   - Post: `C3AssignmentGap.state = 'resolving', resolvedPackage is set to highest-scoring candidatePackage, resolutionProvenancePostcode references a written ProvenanceChainRecord for this resolution decision`

3. **commit-collapse-and-write-assignment**
   - Pre: `C3AssignmentGap.state = 'resolving' AND resolvedPackage is set AND resolutionProvenancePostcode is a valid committed postcode address AND no conflicting ComponentPackageAssignment exists for the resolvedPackage`
   - Action: `write ComponentPackageAssignment for ordinal-3 with targetPackage=resolvedPackage, isResolved=true, provenanceRecordPostcode=resolutionProvenancePostcode; update C3AssignmentGap.state to 'collapsed', isResolved=true; update NamedBlueprintComponent.assignedPackage field with resolvedPackage; emit C3_GAP_COLLAPSED event`
   - Post: `C3AssignmentGap.isResolved = true, C3AssignmentGap.state = 'collapsed', ComponentPackageAssignment for ordinal-3 has isResolved=true and non-null targetPackage, NamedBlueprintComponent ordinal-3 has non-null assignedPackage matching resolvedPackage`
