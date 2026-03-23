---
name: int-stage-disambiguation-rerun
description: "Use when operator invokes rerun of ML.INT.01d32819/v1 with disambiguation pass enabled pattern detected."
---

# INT-Stage-Disambiguation-Rerun

Trigger: operator invokes rerun of ML.INT.01d32819/v1 with disambiguation pass enabled

## Steps
1. **assert-stateless-rerun-eligibility**
   - Pre: `INTStage.isStateless == true AND INTStage.runId == 'ML.INT.01d32819' AND INTStage.version == 'v1' AND INTStage.aggregateEntropy == 0.72`
   - Action: `verify that the target INT stage run is stateless and its current aggregateEntropy exceeds hardCap, marking the run as eligible for reprocessing`
   - Post: `rerun eligibility flag is set; stage run is locked against concurrent mutation; aggregateEntropy.priorRunValue recorded as 0.72`

2. **load-entity-set-26**
   - Pre: `EntitySet26.identifiedInRunId == 'ML.INT.01d32819' AND EntitySet26.cardinality == 26 AND rerun eligibility flag is set`
   - Action: `load all 26 EntityMention records where memberOfSet26 == true, binding each to its current ConflictingIntegrationMapping record`
   - Post: `26 EntityMention instances are resident in working memory, each paired with its ConflictingIntegrationMapping; no entity is missing or duplicated`

3. **execute-disambiguation-pass**
   - Pre: `all 26 EntityMention records are loaded AND each has a ConflictingIntegrationMapping with isResolved == false AND DisambiguationPass.appliedToStageRunId is unset`
   - Action: `instantiate DisambiguationPass with passIndex = 1 and targetEntityCount = 26; for each EntityMention, score all candidateBindings, select the binding with minimum perBindingEntropy, and write the winning EntityBinding; mark ConflictingIntegrationMapping.isResolved = true for each resolved entity`
   - Post: `DisambiguationPass.conflictsResolved == 26 AND DisambiguationPass.appliedToStageRunId == 'ML.INT.01d32819' AND every ConflictingIntegrationMapping.isResolved == true`

4. **filter-low-confidence-bindings**
   - Pre: `DisambiguationPass has completed AND all EntityBinding records for the 26 entities are written AND each EntityBinding has a perBindingEntropy value`
   - Action: `iterate all 26 EntityBinding records; for each where PerBindingEntropy.exceedsThreshold == true (perBindingEntropy.value >= 0.30), set EntityBinding.isAccepted = false and EntityBinding.isHighConfidence = false; for all others set isAccepted = true and isHighConfidence = true`
   - Post: `no EntityBinding with perBindingEntropy.value >= 0.30 has isAccepted == true; accepted binding count is recorded; rejected bindings are quarantined`

5. **recompute-aggregate-entropy**
   - Pre: `all EntityBinding.isAccepted flags are resolved AND at least one EntityBinding.isAccepted == true`
   - Action: `compute new AggregateEntropy.value as the mean of perBindingEntropy.value across all accepted EntityBindings; compare result against AggregateEntropy.hardCap of 0.30; set AggregateEntropy.satisfiesConstraint accordingly; write new value to INTStage.aggregateEntropy`
   - Post: `INTStage.aggregateEntropy reflects the post-disambiguation value; AggregateEntropy.satisfiesConstraint == true if and only if the new value <= 0.30; priorRunValue remains 0.72 for audit`
