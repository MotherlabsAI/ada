---
name: c3-gap-resolution-workflow
description: "Use when ComponentPackageMapping construction detects componentOrdinal=3 has multiple candidatePackages and no definitive assignedPackage — C3AssignmentGap record created with state=unresolved pattern detected."
---

# C3-Gap-Resolution-Workflow

Trigger: ComponentPackageMapping construction detects componentOrdinal=3 has multiple candidatePackages and no definitive assignedPackage — C3AssignmentGap record created with state=unresolved

## Steps
1. **classify-ordinal-3-component**
   - Pre: `NamedBlueprintComponent with ordinal=3 exists in loaded registry AND C3AssignmentGap record has state=unresolved AND candidatePackages list has at least 2 entries`
   - Action: `read component name, responsibility, and boundedContext fields for ordinal-3 component, classify component against each candidatePackage boundedContext label using string-similarity scoring, rank candidatePackages by affinity score descending, write ranked list back to C3AssignmentGap as annotated candidatePackages`
   - Post: `C3AssignmentGap.candidatePackages is annotated with affinity scores, top-ranked package is identifiable, classification metadata is logged for audit`

2. **determine-collapse-partner**
   - Pre: `C3AssignmentGap has annotated candidatePackages with scores AND top-ranked targetPackage is identified AND ComponentPackageMapping has at least one other assignment targeting the same top-ranked package`
   - Action: `find the existing ComponentPackageAssignment that already targets the top-ranked package, designate that assignment's component as the primaryComponent and ordinal-3 component as the collapsedComponent, construct CollapseRecord with primaryComponentId, primaryComponentOrdinal, collapsedComponentId=ordinal-3-componentId, collapsedComponentOrdinal=3, targetPackage, and collapseRationale`
   - Post: `CollapseRecord is written with all fields populated AND collapseRationale is non-null AND both primaryComponentOrdinal and collapsedComponentOrdinal are recorded AND the CollapseRecord is appended to ComponentPackageMapping.collapseRecords`

3. **write-resolution-provenance**
   - Pre: `CollapseRecord for ordinal-3 is written AND C3AssignmentGap.isResolved=false still (not yet finalized) AND ProvenanceChainRecord for ordinal-3 component exists`
   - Action: `create ENTProvenanceRecord documenting the C3 gap resolution decision: record resolvedPackage, scoring rationale, timestamp, and actorId; compute postcode from resolution record content; write resolutionProvenancePostcode to C3AssignmentGap; update ProvenanceChainRecord for ordinal-3 to reference the resolution provenance; set C3AssignmentGap.isResolved=true and state=resolved`
   - Post: `C3AssignmentGap.state=resolved AND resolutionProvenancePostcode is non-null AND ProvenanceChainRecord for ordinal-3 has a hop referencing the resolution provenance AND C3AssignmentGap.resolvedPackage is set`
