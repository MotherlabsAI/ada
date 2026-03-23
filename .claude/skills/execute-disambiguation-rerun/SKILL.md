---
name: execute-disambiguation-rerun
description: "Use when RunID submitted to IntRerunEngine pattern detected."
---

# execute-disambiguation-rerun

Trigger: RunID submitted to IntRerunEngine

## Steps
1. **check-idempotency**
   - Pre: `RunID.value is non-empty and well-formed`
   - Action: `query artifact store for existing VersionedArtifact keyed by RunID`
   - Post: `IdempotencyGuard.existingArtifact is either populated with prior VersionedArtifact or confirmed absent`

2. **return-existing-artifact**
   - Pre: `IdempotencyGuard.existingArtifact is populated`
   - Action: `return IdempotencyGuard.existingArtifact to caller without re-executing any disambiguation logic`
   - Post: `caller receives the pre-existing VersionedArtifact; engine state is unchanged`

3. **hydrate-ambiguity-set**
   - Pre: `IdempotencyGuard.existingArtifact is absent AND PriorRunArtifact keyed by RunID exists in artifact store with non-empty ambiguitySet`
   - Action: `load PriorRunArtifact from store; extract AmbiguitySet and bind sourceRunId to current RunID`
   - Post: `AmbiguitySet.entries is non-empty and AmbiguitySet.sourceRunId equals RunID.value`

4. **execute-second-pass-disambiguation**
   - Pre: `AmbiguitySet.entries is non-empty and AmbiguitySet.sourceRunId is bound`
   - Action: `run DisambiguationPass with passOrdinal=2 over AmbiguitySet.entries; produce candidate EntityBindings each with confidence and entropy values assigned`
   - Post: `DisambiguationPass.outputBindings is non-empty; each EntityBinding carries an Entropy.value in [0.0, 1.0]`

5. **filter-bindings-by-hard-threshold**
   - Pre: `DisambiguationPass.outputBindings is non-empty; HardThreshold.value = 0.30`
   - Action: `retain only EntityBindings where Entropy.value < HardThreshold.value (strict less-than); discard all others`
   - Post: `accepted set contains only EntityBindings with entropy strictly below 0.30; discarded set contains the remainder`

6. **compute-aggregate-entropy**
   - Pre: `accepted binding set is defined (may be empty)`
   - Action: `compute AggregateEntropy.value as mean entropy across all accepted EntityBindings; set AggregateEntropy.bindingCount to count of accepted bindings; if accepted set is empty set AggregateEntropy.value = 1.0`
   - Post: `AggregateEntropy.value is in [0.0, 1.0] and AggregateEntropy.bindingCount >= 0`

7. **evaluate-target-achieved**
   - Pre: `AggregateEntropy.value is a valid finite number in [0.0, 1.0]`
   - Action: `set TargetAchieved.value = (AggregateEntropy.value <= 0.30); bind TargetAchieved.aggregateEntropy and TargetAchieved.threshold`
   - Post: `TargetAchieved.value is a boolean; TargetAchieved.aggregateEntropy equals AggregateEntropy.value`

8. **write-versioned-artifact**
   - Pre: `TargetAchieved is fully bound; accepted bindings are finalized; no prior VersionedArtifact exists for this RunID (idempotency confirmed in step 1)`
   - Action: `construct VersionedArtifact with {runId, version=2, acceptedBindings, aggregateEntropy, targetAchieved, createdAt=now}; write immutably to artifact store`
   - Post: `VersionedArtifact is persisted with state=sealed; subsequent reads by RunID return this artifact`

9. **trigger-syn-gate-revaluation**
   - Pre: `VersionedArtifact is sealed and readable; SYNGate.passRateTarget = 0.83`
   - Action: `emit trigger event to SYNGate with triggerArtifact bound to the sealed VersionedArtifact`
   - Post: `SYNGate transitions to evaluating state; trigger event is acknowledged`
