---
name: ent-gate-evaluation-pipeline
description: "Use when CompilationRun ML.ENT.e80e3c97/v1 initiated with ENT stage as next pending stage pattern detected."
---

# ent-gate-evaluation-pipeline

Trigger: CompilationRun ML.ENT.e80e3c97/v1 initiated with ENT stage as next pending stage

## Steps
1. **load-blueprint-component-registry**
   - Pre: `Blueprint artifact exists with valid postcode; BlueprintComponentRegistry is empty or uninitialized; 10 NamedBlueprintComponent definitions are resolvable from blueprint sections`
   - Action: `Iterate blueprint sections, instantiate NamedBlueprintComponent for each, assign initial ordinal values, insert into BlueprintComponentRegistry, record ComponentPackageMapping for each component`
   - Post: `BlueprintComponentRegistry contains exactly 10 components; each component has a postcode; ComponentPackageAssignment exists for each component; registry state transitions to loading-complete`

2. **detect-and-collapse-c3-ordinal-gap**
   - Pre: `BlueprintComponentRegistry is in loading-complete state with 10 components; ordinal sequence is inspectable; C3AssignmentGap record does not yet exist`
   - Action: `Sort components by current ordinal; scan for non-contiguous ordinal sequence; identify C3 gap position; create C3AssignmentGap record; reassign ordinals to produce contiguous sequence starting at 1; persist updated ordinals to each NamedBlueprintComponent`
   - Post: `No C3AssignmentGap remains open; all 10 components have strictly contiguous ordinals 1–10; ordinal sequence is monotonically increasing with no gaps; registry transitions to ordinal-validated state`

3. **extract-entity-map-from-blueprint**
   - Pre: `BlueprintComponentRegistry is in ordinal-validated state; Blueprint dataModel section is populated; 5 bounded contexts are present in blueprint architecture section`
   - Action: `For each bounded context in blueprint, traverse dataModel entries and extract named entities; assign each entity a canonical ENTEntityRegistration with postcode derived from compilation run and bounded context; assemble EntityMapRecord per bounded context; compose full EntityMap keyed by bounded context name`
   - Post: `EntityMap contains exactly 5 bounded context keys; each key maps to a non-empty list of EntityMapRecords; every EntityMapRecord has a valid postcode; ENTEntityRegistration exists for each extracted entity; EntityMap is stored as a provenance artifact with its own postcode`

4. **evaluate-ent-gate**
   - Pre: `EntityMap is fully populated and postcode-anchored; BlueprintComponentRegistry is in ordinal-validated state with 10 components; no open ENTBlocker records exist for this runId`
   - Action: `Instantiate ENTGateRecord for runId; evaluate each ENTEntityRegistration against schema rules; verify EntityMap completeness score meets threshold; verify ordinal contiguity proof from registry; record gate decision as passed or blocked with detailed rationale; emit ENTGateRecord with timestamp and postcode`
   - Post: `ENTGateRecord exists with status passed or blocked; if passed, CompilationRun stage pointer advances past ENT; if blocked, StalledPipelineRun record is created; ENTGateRecord postcode is registered in provenance store`

5. **verify-three-hop-provenance-chain**
   - Pre: `ENTGateRecord has status passed; ENTGateRecord postcode is registered; CompilationRun postcode is registered; IntentGraph postcode is registered; at least 2 intermediate ProvenanceRecord hops exist between ENTGateRecord and IntentGraph`
   - Action: `For each ENT-stage artifact postcode, traverse ProvenanceChain backward; record each ProvenanceChainHop; count hops until IntentGraph postcode is reached; validate that hop count equals exactly 3; assert each hop has a valid stageCode and timestamp ordering; emit ProvenanceChainRecord with verified hopCount`
   - Post: `ProvenanceChainRecord exists for each ENT artifact with hopCount exactly 3; each hop's fromPostcode and toPostcode are resolvable; timestamp ordering is strictly ascending from IntentGraph to ENT artifact; chain is marked verified in provenance store`

6. **emit-compile-result**
   - Pre: `ENTGateRecord status is passed; all ProvenanceChainRecords for ENT artifacts are verified with hopCount 3; no open ENTBlocker records; CompilationRun is in ent-evaluating state`
   - Action: `Aggregate gate scores, coverage metrics, and coherence scores from ENT stage artifacts; compute final confidence and gatePassRate for CompilationRun; instantiate CompileResult with decision passed and all artifact postcodes; register CompileResult postcode in provenance store; transition CompilationRun to complete`
   - Post: `CompileResult exists with decision passed; CompilationRun state is complete with completedAt timestamp; blueprintPostcode on CompilationRun matches Blueprint artifact; CompileResult is queryable by runId ML.ENT.e80e3c97/v1`
