---
name: EntropyContext-agent
description: Use when filters candidate entitybindings by the hard entropy threshold (< 0.30, c1), computes aggregate entropy across accepted bindings, and evaluates whether the aggregate target (≤ 0.30) was achieved. all thresholds are compile-time constants. pure domain logic. tasks arise in the EntropyContext domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# EntropyEvaluator Agent

Filters candidate EntityBindings by the hard entropy threshold (< 0.30, C1), computes aggregate entropy across accepted bindings, and evaluates whether the aggregate target (≤ 0.30) was achieved. All thresholds are compile-time constants. Pure domain logic.

## Bounded Context
**Context:** EntropyContext
**Entities:** Entropy, HardThreshold, AggregateEntropy, TargetAchieved
**Interfaces:** filterByThreshold(bindings: EntityBinding[]): EntityBinding[], computeAggregate(bindings: EntityBinding[]): AggregateEntropy, evaluateTarget(aggregate: AggregateEntropy): TargetAchieved

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `HardThreshold.value === 0.30` — hard threshold is invariant across all entropy evaluations in this context
- `TargetAchieved.value === (AggregateEntropy.value <= HardThreshold.value)` — target-achieved flag is a pure derivation; no other logic may set it independently
- `entropy.value >= 0 && entropy.value <= 1` (Entropy) — entropy is bounded to [0, 1]
- `typeof entropy.value === 'number' && !isNaN(entropy.value)` (Entropy) — entropy must be a real numeric scalar
- `hardThreshold.value === 0.30` (HardThreshold) — threshold is exactly 0.30; not a parameter, not overridable
- `Object.isFrozen(hardThreshold)` (HardThreshold) — hard threshold is a compile-time constant, never mutated at runtime
- `aggregateEntropy.value >= 0 && aggregateEntropy.value <= 1` (AggregateEntropy) — aggregate entropy is a unit scalar
- `aggregateEntropy.bindingCount >= 0` (AggregateEntropy) — binding count is non-negative
- `aggregateEntropy.bindingCount === 0 ? aggregateEntropy.value === 0 : true` (AggregateEntropy) — aggregate entropy over zero bindings is defined as zero
- `targetAchieved.value === (targetAchieved.aggregateEntropy.value <= targetAchieved.threshold.value)` (TargetAchieved) — targetAchieved.value is purely derived from aggregateEntropy vs. threshold; no independent assignment
- `targetAchieved.threshold.value === 0.30` (TargetAchieved) — target is always evaluated against the hard threshold, not a caller-supplied value

## Workflow Steps
### check-idempotency (execute-disambiguation-rerun)
- **Pre:** RunID.value is non-empty and well-formed
- **Action:** query artifact store for existing VersionedArtifact keyed by RunID
- **Post:** IdempotencyGuard.existingArtifact is either populated with prior VersionedArtifact or confirmed absent
- **Failure modes:**
  - precondition: RunID is malformed or empty → reject with validation error; do not proceed to artifact store query
  - action: artifact store is unreachable → surface store connectivity error; do not assume artifact is absent

### return-existing-artifact (execute-disambiguation-rerun)
- **Pre:** IdempotencyGuard.existingArtifact is populated
- **Action:** return IdempotencyGuard.existingArtifact to caller without re-executing any disambiguation logic
- **Post:** caller receives the pre-existing VersionedArtifact; engine state is unchanged
- **Failure modes:**
  - postcondition: returned artifact fails schema validation indicating store corruption → surface integrity error; do not silently return corrupt artifact

### hydrate-ambiguity-set (execute-disambiguation-rerun)
- **Pre:** IdempotencyGuard.existingArtifact is absent AND PriorRunArtifact keyed by RunID exists in artifact store with non-empty ambiguitySet
- **Action:** load PriorRunArtifact from store; extract AmbiguitySet and bind sourceRunId to current RunID
- **Post:** AmbiguitySet.entries is non-empty and AmbiguitySet.sourceRunId equals RunID.value
- **Failure modes:**
  - precondition: PriorRunArtifact does not exist for given RunID → reject with not-found error; pipeline cannot proceed without a prior run to re-disambiguate
  - precondition: PriorRunArtifact.ambiguitySet is empty — no ambiguous entries remain from prior pass → short-circuit: write a VersionedArtifact with empty acceptedBindings and targetAchieved=true by vacuous satisfaction
  - action: AmbiguitySet deserialization fails due to schema version mismatch → surface schema mismatch error with prior run version; do not proceed with partially hydrated set

### execute-second-pass-disambiguation (execute-disambiguation-rerun)
- **Pre:** AmbiguitySet.entries is non-empty and AmbiguitySet.sourceRunId is bound
- **Action:** run DisambiguationPass with passOrdinal=2 over AmbiguitySet.entries; produce candidate EntityBindings each with confidence and entropy values assigned
- **Post:** DisambiguationPass.outputBindings is non-empty; each EntityBinding carries an Entropy.value in [0.0, 1.0]
- **Failure modes:**
  - action: disambiguation resolver returns no bindings for one or more ambiguity entries → record unresolved entries as EntityBindings with entropy=1.0 so they are excluded by the hard threshold filter
  - action: disambiguation resolver exceeds execution budget → abort pass; emit timeout error with passOrdinal and elapsed time; do not write partial artifact
  - postcondition: one or more EntityBinding.entropy values are outside [0.0, 1.0] → reject pass output as invalid; treat as action failure

### filter-bindings-by-hard-threshold (execute-disambiguation-rerun)
- **Pre:** DisambiguationPass.outputBindings is non-empty; HardThreshold.value = 0.30
- **Action:** retain only EntityBindings where Entropy.value < HardThreshold.value (strict less-than); discard all others
- **Post:** accepted set contains only EntityBindings with entropy strictly below 0.30; discarded set contains the remainder
- **Failure modes:**
  - postcondition: accepted set is empty — all bindings exceed or equal 0.30 → do not abort; proceed with empty accepted set; TargetAchieved will be false and this is a valid outcome to record

### compute-aggregate-entropy (execute-disambiguation-rerun)
- **Pre:** accepted binding set is defined (may be empty)
- **Action:** compute AggregateEntropy.value as mean entropy across all accepted EntityBindings; set AggregateEntropy.bindingCount to count of accepted bindings; if accepted set is empty set AggregateEntropy.value = 1.0
- **Post:** AggregateEntropy.value is in [0.0, 1.0] and AggregateEntropy.bindingCount >= 0
- **Failure modes:**
  - action: numeric overflow or NaN produced during mean computation → surface arithmetic error; do not write artifact with invalid aggregate entropy

### evaluate-target-achieved (execute-disambiguation-rerun)
- **Pre:** AggregateEntropy.value is a valid finite number in [0.0, 1.0]
- **Action:** set TargetAchieved.value = (AggregateEntropy.value <= 0.30); bind TargetAchieved.aggregateEntropy and TargetAchieved.threshold
- **Post:** TargetAchieved.value is a boolean; TargetAchieved.aggregateEntropy equals AggregateEntropy.value
- **Failure modes:**
  - precondition: AggregateEntropy.value is NaN or infinite → reject evaluation; do not produce a TargetAchieved with undefined boolean

### write-versioned-artifact (execute-disambiguation-rerun)
- **Pre:** TargetAchieved is fully bound; accepted bindings are finalized; no prior VersionedArtifact exists for this RunID (idempotency confirmed in step 1)
- **Action:** construct VersionedArtifact with {runId, version=2, acceptedBindings, aggregateEntropy, targetAchieved, createdAt=now}; write immutably to artifact store
- **Post:** VersionedArtifact is persisted with state=sealed; subsequent reads by RunID return this artifact
- **Failure modes:**
  - action: write fails due to store error → surface write error; caller must retry the full rerun — engine is stateless so retry is safe
  - action: concurrent write collision: another process wrote an artifact for this RunID between idempotency check and write → treat as idempotency hit; read and return the concurrently written artifact
  - postcondition: written artifact cannot be read back for verification → surface read-after-write failure; flag artifact as suspect; do not proceed to SYN gate trigger

### trigger-syn-gate-revaluation (execute-disambiguation-rerun)
- **Pre:** VersionedArtifact is sealed and readable; SYNGate.passRateTarget = 0.83
- **Action:** emit trigger event to SYNGate with triggerArtifact bound to the sealed VersionedArtifact
- **Post:** SYNGate transitions to evaluating state; trigger event is acknowledged
- **Failure modes:**
  - action: SYNGate trigger endpoint is unavailable → record trigger-pending status on VersionedArtifact metadata; allow caller to retry trigger without re-running disambiguation
  - postcondition: SYNGate does not acknowledge within timeout → surface trigger timeout; VersionedArtifact remains valid — trigger can be retried independently

### ingest-trigger-artifact (syn-gate-revaluation)
- **Pre:** trigger event carries a valid VersionedArtifact reference; SYNGate is in idle or pending-trigger state
- **Action:** load VersionedArtifact from artifact store using triggerArtifact reference; bind it as evaluation input
- **Post:** VersionedArtifact is loaded and its acceptedBindings and aggregateEntropy are accessible to evaluator
- **Failure modes:**
  - precondition: SYNGate is already in evaluating state for a different artifact — concurrent trigger collision → queue the new trigger; do not corrupt in-flight evaluation
  - action: VersionedArtifact referenced by trigger cannot be found in store → reject trigger with not-found error; gate does not evaluate phantom artifacts

### compute-pass-rate (syn-gate-revaluation)
- **Pre:** VersionedArtifact.acceptedBindings is accessible; VersionedArtifact.aggregateEntropy is a valid finite number
- **Action:** evaluate bindings against SYN gate criteria; derive pass rate as ratio of gate-passing bindings to total accepted bindings
- **Post:** pass rate is a finite value in [0.0, 1.0]; binding-level gate results are recorded
- **Failure modes:**
  - action: accepted bindings set is empty — pass rate is undefined → set pass rate = 0.0; gate result = failed
  - postcondition: computed pass rate exceeds 1.0 due to evaluation logic error → surface evaluation integrity error; do not emit gate result with invalid pass rate

### evaluate-syn-gate-threshold (syn-gate-revaluation)
- **Pre:** pass rate is a valid finite value in [0.0, 1.0]; SYNGate.passRateTarget = 0.83
- **Action:** compare computed pass rate to SYNGate.passRateTarget; set gate outcome to passed if pass rate >= 0.83 else failed
- **Post:** SYNGate transitions to passed or failed state; gate outcome and actual pass rate are recorded on evaluation result
- **Failure modes:**
  - postcondition: gate outcome cannot be persisted — evaluation result store write fails → surface write error; SYNGate remains in evaluating state; trigger retry of evaluation result write only, not full rerun

### emit-gate-result (syn-gate-revaluation)
- **Pre:** SYNGate is in passed or failed state; gate outcome is persisted
- **Action:** publish gate result event downstream with {passRate, targetAchieved, artifactRunId, artifactVersion}
- **Post:** downstream pipeline stages receive gate result; SYNGate returns to idle state
- **Failure modes:**
  - action: downstream event bus is unavailable → buffer gate result for retry; SYNGate holds failed-to-emit state until delivery is confirmed
  - postcondition: gate result delivered but SYNGate fails to transition back to idle — stuck in passed/failed → force idle transition via state reset; log stuck transition for observability

## Acceptance Criteria
- [ ] IdempotencyGuard.existingArtifact is either populated with prior VersionedArtifact or confirmed absent
- [ ] caller receives the pre-existing VersionedArtifact; engine state is unchanged
- [ ] AmbiguitySet.entries is non-empty and AmbiguitySet.sourceRunId equals RunID.value
- [ ] DisambiguationPass.outputBindings is non-empty; each EntityBinding carries an Entropy.value in [0.0, 1.0]
- [ ] accepted set contains only EntityBindings with entropy strictly below 0.30; discarded set contains the remainder
- [ ] AggregateEntropy.value is in [0.0, 1.0] and AggregateEntropy.bindingCount >= 0
- [ ] TargetAchieved.value is a boolean; TargetAchieved.aggregateEntropy equals AggregateEntropy.value
- [ ] VersionedArtifact is persisted with state=sealed; subsequent reads by RunID return this artifact
- [ ] SYNGate transitions to evaluating state; trigger event is acknowledged
- [ ] VersionedArtifact is loaded and its acceptedBindings and aggregateEntropy are accessible to evaluator
- [ ] pass rate is a finite value in [0.0, 1.0]; binding-level gate results are recorded
- [ ] SYNGate transitions to passed or failed state; gate outcome and actual pass rate are recorded on evaluation result
- [ ] downstream pipeline stages receive gate result; SYNGate returns to idle state

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
