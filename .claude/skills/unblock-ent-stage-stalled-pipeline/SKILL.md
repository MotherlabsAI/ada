---
name: unblock-ent-stage-stalled-pipeline
description: "Use when StalledPipelineRun ML.ENT.e80e3c97/v1 detected with ENTBlocker present and C3AssignmentGap recorded pattern detected."
---

# unblock-ent-stage-stalled-pipeline

Trigger: StalledPipelineRun ML.ENT.e80e3c97/v1 detected with ENTBlocker present and C3AssignmentGap recorded

## Steps
1. **load-stalled-pipeline-state**
   - Pre: `StalledPipelineRun record exists in storage with runId=ML.ENT.e80e3c97/v1 and stageCode=ENT and status=stalled`
   - Action: `read PipelineState from storage, deserialize ENTBlocker list, deserialize C3AssignmentGap list, restore CompilationRun context into working memory`
   - Post: `PipelineState is hydrated in memory with all ENTBlockers enumerated, C3AssignmentGap bounds known, prior stage postcodes verified present`

2. **load-blueprint-component-registry**
   - Pre: `PipelineState is hydrated; BlueprintComponentRegistry postcode is recorded in PipelineState metadata; exactly 10 NamedBlueprintComponents expected per compilation manifest`
   - Action: `fetch BlueprintComponentRegistry by postcode from storage, verify component count equals 10, verify each NamedBlueprintComponent has non-null name, boundedContext, and ordinalSlot fields`
   - Post: `BlueprintComponentRegistry is loaded with exactly 10 verified NamedBlueprintComponents, each with a valid ordinalSlot in range [1..10], no duplicate ordinalSlots except within the C3 gap range`

3. **collapse-c3-ordinal-assignment-gap**
   - Pre: `BlueprintComponentRegistry loaded with 10 components; C3AssignmentGap specifies gapStart and gapEnd ordinal positions; components in gap range have conflicting or null ordinalSlot values`
   - Action: `sort all 10 components by existing non-gap ordinals, compute dense re-numbering that fills gap without displacing locked ordinals, assign new ordinalSlot values to gap-range components, write updated assignments back to BlueprintComponentRegistry, emit ProvenanceRecord for ordinal-collapse event`
   - Post: `BlueprintComponentRegistry contains exactly 10 components with strictly monotonic ordinalSlots [1..10] and no gaps; C3AssignmentGap record is marked resolved with resolutionPostcode pointing to updated registry`

4. **extract-entity-map-from-codebase**
   - Pre: `BlueprintComponentRegistry is gap-free with 10 monotonic components; CodebaseContext is available referencing Ada's TypeScript monorepo; IntentGraph postcode is recorded in PipelineState`
   - Action: `invoke LLM-assisted entity extraction over TypeScript source files scoped to each of the 8 bounded contexts, map extracted entities to their NamedBlueprintComponent by boundedContext, resolve cross-context entity references, produce EntityMap keyed by boundedContext with entity lists and property definitions`
   - Post: `EntityMap contains entries for all 8 bounded contexts; each entry has at least 1 entity; all entities named in IntentGraph ENTITIES section appear in EntityMap; EntityMap postcode is recorded in PipelineState`

5. **pass-ent-gate**
   - Pre: `EntityMap is complete with entries for all 8 bounded contexts; BlueprintComponentRegistry is gap-free; ordinal collapse ProvenanceRecord is confirmed written; ENTGateRecord does not already exist for this runId with status=passed`
   - Action: `evaluate ENT gate criteria: coverageScore = (entitiesFound / entitiesExpected), coherenceScore = (entitiesWithAllPropertiesMapped / entitiesFound), verify coverageScore >= 0.85 and coherenceScore >= 0.80, verify all 10 BlueprintComponents are bound to at least 1 entity, write ENTGateRecord with scores and decision, update CompilationRun gatePassRate`
   - Post: `ENTGateRecord exists with status=passed, gatePassRate in CompilationRun reflects ENT gate result, PipelineStage for ENT transitions to passed state, StalledPipelineRun record is marked unblocked`

6. **verify-3-hop-provenance-chains**
   - Pre: `ENTGateRecord has status=passed; EntityMap postcode, BlueprintComponentRegistry postcode, and ordinal-collapse ProvenanceRecord postcode are all recorded in PipelineState; IntentGraph postcode exists as the root anchor`
   - Action: `for each ENT output artifact (EntityMap, BlueprintComponentRegistry, ENTGateRecord): traverse ProvenanceChain records backward from artifact postcode, count hops until IntentGraph postcode is reached, verify hop count equals exactly 3, verify each intermediate hop has a valid ProvenanceRecord with non-null stageCode and timestamp`
   - Post: `all 3 ENT output artifacts have verified 3-hop provenance chains terminating at IntentGraph postcode; ProvenanceChain records are written for each verified chain with hopCount=3; CompilationRun audit log records provenance verification as passed`
