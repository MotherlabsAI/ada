---
name: EntropyControl-agent
description: Use when computes per-binding entropy and aggregate entropy. enforces the hard cap (aggregate ≤ 0.30) per c2. reports whether the constraint is satisfied. exists because aggregateentropy and perbindingentropy entities define the measurement model, the workflow step recompute-aggregate-entropy requires post-filtering recalculation, and g2 sets the aggregate target. tasks arise in the EntropyControl domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# EntropyEvaluator Agent

Computes per-binding entropy and aggregate entropy. Enforces the hard cap (aggregate ≤ 0.30) per C2. Reports whether the constraint is satisfied. Exists because AggregateEntropy and PerBindingEntropy entities define the measurement model, the workflow step recompute-aggregate-entropy requires post-filtering recalculation, and G2 sets the aggregate target.

## Bounded Context
**Context:** EntropyControl
**Entities:** AggregateEntropy, PerBindingEntropy
**Interfaces:** computePerBindingEntropy(binding: EntityBinding), computeAggregateEntropy(acceptedBindings: EntityBinding[]), checkHardCap(aggregateEntropy: number), satisfiesConstraint(aggregateEntropy: number)

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `aggregateEntropy.hardCap === perBindingEntropy.threshold` — aggregate hard cap and per-binding threshold are the same scalar value
- `aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= 0.30)` — aggregate entropy satisfaction is anchored to the fixed 0.30 cap
- `aggregateEntropy.value >= 0 && aggregateEntropy.value <= 1` (AggregateEntropy) — aggregate entropy is a unit-interval scalar
- `aggregateEntropy.hardCap === 0.30` (AggregateEntropy) — hard cap is invariantly 0.30
- `aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)` (AggregateEntropy) — satisfaction flag is derived from value vs hard cap comparison
- `aggregateEntropy.priorRunValue === 0.72` (AggregateEntropy) — prior run value is a fixed historical datum for this pipeline instance
- `perBindingEntropy.value >= 0 && perBindingEntropy.value <= 1` (PerBindingEntropy) — per-binding entropy is a unit-interval scalar
- `perBindingEntropy.threshold === 0.30` (PerBindingEntropy) — exclusion threshold is fixed at 0.30
- `perBindingEntropy.exceedsThreshold === (perBindingEntropy.value >= 0.30)` (PerBindingEntropy) — exceedsThreshold is derived strictly from value >= 0.30

## Workflow Steps
### assert-stateless-rerun-eligibility (INT-Stage-Disambiguation-Rerun)
- **Pre:** INTStage.isStateless == true AND INTStage.runId == 'ML.INT.01d32819' AND INTStage.version == 'v1' AND INTStage.aggregateEntropy == 0.72
- **Action:** verify that the target INT stage run is stateless and its current aggregateEntropy exceeds hardCap, marking the run as eligible for reprocessing
- **Post:** rerun eligibility flag is set; stage run is locked against concurrent mutation; aggregateEntropy.priorRunValue recorded as 0.72
- **Failure modes:**
  - precondition: INTStage.isStateless == false, meaning prior run carried mutable state that would corrupt rerun isolation → abort rerun; emit stateful-stage-rerun-violation event; escalate to pipeline operator
  - precondition: aggregateEntropy value has drifted from 0.72 due to a concurrent partial write, making baseline comparison invalid → re-fetch entropy snapshot; compare against audit log; halt if mismatch persists

### load-entity-set-26 (INT-Stage-Disambiguation-Rerun)
- **Pre:** EntitySet26.identifiedInRunId == 'ML.INT.01d32819' AND EntitySet26.cardinality == 26 AND rerun eligibility flag is set
- **Action:** load all 26 EntityMention records where memberOfSet26 == true, binding each to its current ConflictingIntegrationMapping record
- **Post:** 26 EntityMention instances are resident in working memory, each paired with its ConflictingIntegrationMapping; no entity is missing or duplicated
- **Failure modes:**
  - action: fewer than 26 EntityMention records resolve with memberOfSet26 == true, indicating index corruption or partial write from prior run → log missing entity ids; halt pipeline; trigger EntitySet26 integrity repair job
  - postcondition: one or more EntityMention records lack an associated ConflictingIntegrationMapping, leaving them unprocessable by the disambiguation pass → synthesize a placeholder ConflictingIntegrationMapping with isResolved == false and candidateCount == 0; flag for manual review

### execute-disambiguation-pass (INT-Stage-Disambiguation-Rerun)
- **Pre:** all 26 EntityMention records are loaded AND each has a ConflictingIntegrationMapping with isResolved == false AND DisambiguationPass.appliedToStageRunId is unset
- **Action:** instantiate DisambiguationPass with passIndex = 1 and targetEntityCount = 26; for each EntityMention, score all candidateBindings, select the binding with minimum perBindingEntropy, and write the winning EntityBinding; mark ConflictingIntegrationMapping.isResolved = true for each resolved entity
- **Post:** DisambiguationPass.conflictsResolved == 26 AND DisambiguationPass.appliedToStageRunId == 'ML.INT.01d32819' AND every ConflictingIntegrationMapping.isResolved == true
- **Failure modes:**
  - action: one or more EntityMention records have candidateCount == 0, meaning no candidate bindings exist to score, causing the scoring loop to skip that entity silently → detect zero-candidate entities before scoring; emit disambiguation-starvation warning; route affected entities to manual CanonicalReferent assignment
  - action: two or more candidateBindings tie on minimum perBindingEntropy, leaving conflict unresolved and ConflictingIntegrationMapping.isResolved remaining false → apply tiebreak by CanonicalReferent.namespace priority ordering; if tiebreak also fails, mark binding as DEFERRED and exclude from this pass
  - postcondition: DisambiguationPass.conflictsResolved < 26 after pass completion, meaning some entities were not resolved → collect unresolved entity ids; requeue for passIndex = 2 with expanded candidate search radius; increment failure counter

### filter-low-confidence-bindings (INT-Stage-Disambiguation-Rerun)
- **Pre:** DisambiguationPass has completed AND all EntityBinding records for the 26 entities are written AND each EntityBinding has a perBindingEntropy value
- **Action:** iterate all 26 EntityBinding records; for each where PerBindingEntropy.exceedsThreshold == true (perBindingEntropy.value >= 0.30), set EntityBinding.isAccepted = false and EntityBinding.isHighConfidence = false; for all others set isAccepted = true and isHighConfidence = true
- **Post:** no EntityBinding with perBindingEntropy.value >= 0.30 has isAccepted == true; accepted binding count is recorded; rejected bindings are quarantined
- **Failure modes:**
  - precondition: one or more EntityBinding records are missing a perBindingEntropy value because the scoring step emitted a null on degenerate input → assign perBindingEntropy.value = 1.0 (maximum entropy sentinel) to bindings with null entropy; mark isAccepted = false; log anomaly
  - postcondition: accepted binding count is zero because all 26 perBindingEntropy values exceed 0.30, leaving no valid bindings for downstream stages → abort entropy reduction step; escalate to operator with full entropy distribution report; do not advance to SYN gate evaluation

### recompute-aggregate-entropy (INT-Stage-Disambiguation-Rerun)
- **Pre:** all EntityBinding.isAccepted flags are resolved AND at least one EntityBinding.isAccepted == true
- **Action:** compute new AggregateEntropy.value as the mean of perBindingEntropy.value across all accepted EntityBindings; compare result against AggregateEntropy.hardCap of 0.30; set AggregateEntropy.satisfiesConstraint accordingly; write new value to INTStage.aggregateEntropy
- **Post:** INTStage.aggregateEntropy reflects the post-disambiguation value; AggregateEntropy.satisfiesConstraint == true if and only if the new value <= 0.30; priorRunValue remains 0.72 for audit
- **Failure modes:**
  - action: mean computation includes a rejected binding due to a flag read racing with a concurrent write, inflating the aggregate entropy value → re-read all isAccepted flags under a read lock; recompute; if result differs by more than epsilon, invalidate prior computation and retry once
  - postcondition: AggregateEntropy.satisfiesConstraint == false, meaning the new aggregateEntropy value still exceeds 0.30 after disambiguation, failing G2 → log entropy reduction shortfall; trigger passIndex = 2 disambiguation rerun with stricter candidateBinding pruning; do not advance pipeline

### bind-syn-gate-to-int-run (SYN-Gate-Evaluation-After-INT-Cleanup)
- **Pre:** INTStage.aggregateEntropy <= 0.30 AND AggregateEntropy.satisfiesConstraint == true AND SYNGate.intStageRunId is unset
- **Action:** set SYNGate.intStageRunId = 'ML.INT.01d32819'; set SYNGate.passRateTarget = 0.83; initialize SYNGate.observedPassRate = null; set SYNGate.selfResolved = false
- **Post:** SYNGate is bound to the completed INT stage run; passRateTarget is recorded; gate is in EVALUATING state
- **Failure modes:**
  - precondition: SYNGate.intStageRunId is already set to a different runId, indicating the gate was previously bound to a stale or parallel INT run → reject binding; emit syn-gate-collision event; require explicit gate reset before proceeding
  - postcondition: SYNGate transitions to EVALUATING but passRateTarget was not persisted due to a storage write failure, leaving it null → retry write with exponential backoff up to 3 attempts; if all fail, place gate in ERROR state and halt evaluation

### evaluate-syn-gate-pass-rate (SYN-Gate-Evaluation-After-INT-Cleanup)
- **Pre:** SYNGate is in EVALUATING state AND SYNGate.intStageRunId == 'ML.INT.01d32819' AND accepted EntityBinding count > 0
- **Action:** stream all accepted EntityBinding records into the SYN gate evaluator; compute GatePassRate.value as the fraction of bindings that satisfy SYN gate admission criteria; write result to SYNGate.observedPassRate and GatePassRate.value; compare against GatePassRate.target == 0.83
- **Post:** SYNGate.observedPassRate is set to a value in [0,1]; GatePassRate.meetsTarget is set to true if observedPassRate >= 0.83, false otherwise
- **Failure modes:**
  - action: SYN gate evaluator receives an EntityBinding whose CanonicalReferent.namespace is unrecognized, causing the evaluator to throw and halt mid-stream, leaving observedPassRate partially computed → catch evaluator exception; mark that binding as UNEVALUABLE; continue stream; note that final pass rate denominator excludes UNEVALUABLE bindings; log namespace anomaly
  - action: accepted EntityBinding stream is empty at evaluation time because a concurrent filter step purged bindings after the precondition check → detect empty stream at evaluator intake; abort evaluation; set SYNGate to BLOCKED state; re-trigger filter step under exclusive lock
  - postcondition: GatePassRate.meetsTarget == false because observedPassRate < 0.83, meaning G3 is not satisfied → log pass rate shortfall with delta to target; surface which EntityBindings failed SYN criteria; feed failure list back to disambiguation pass as additional conflict candidates for passIndex = 2

### resolve-syn-gate-self-resolution (SYN-Gate-Evaluation-After-INT-Cleanup)
- **Pre:** GatePassRate.meetsTarget == true AND SYNGate.observedPassRate >= 0.83 AND SYNGate.selfResolved == false
- **Action:** set SYNGate.selfResolved = true; transition SYNGate to PASSED state; emit syn-gate-passed event carrying observedPassRate and intStageRunId; release downstream pipeline stages blocked on this gate
- **Post:** SYNGate.selfResolved == true AND SYNGate is in PASSED state AND downstream pipeline stages are unblocked
- **Failure modes:**
  - precondition: GatePassRate.meetsTarget flips to false between the postcondition of the prior step and this step due to a late-arriving binding evaluation result, invalidating the gate pass decision → re-evaluate GatePassRate.meetsTarget under a consistency fence; if still false, abort self-resolution and route to FAILED state
  - action: syn-gate-passed event emission fails due to message bus unavailability, leaving downstream stages permanently blocked even though the gate internally resolved → retry event emission up to 5 times with jitter; if all attempts fail, write gate resolution to durable state store and allow downstream stages to poll for gate status
  - postcondition: one or more downstream pipeline stages fail to unblock because they read a stale EVALUATING state from cache rather than the updated PASSED state → invalidate downstream stage gate-status caches; broadcast cache-bust signal keyed on SYNGate.id; allow stages to re-read gate state

### audit-entropy-gate-binding-triad (SYN-Gate-Evaluation-After-INT-Cleanup)
- **Pre:** SYNGate is in PASSED state AND INTStage.aggregateEntropy <= 0.30 AND DisambiguationPass.conflictsResolved == 26
- **Action:** write an immutable audit record linking RunID, DisambiguationPass.passIndex, AggregateEntropy.value, AggregateEntropy.priorRunValue, GatePassRate.value, and SYNGate.selfResolved into the Ada monorepo pipeline audit log
- **Post:** audit record is durably persisted; it references all five key artifacts; record is immutable and timestamped; G1 through G5 satisfaction flags are encoded in the record
- **Failure modes:**
  - action: audit log write fails due to storage quota exhaustion, causing the record to be lost and leaving the pipeline run unaudited → attempt write to secondary audit sink; if that also fails, emit audit-loss-critical alert and halt further pipeline advancement until storage is recovered
  - postcondition: audit record is written but missing AggregateEntropy.priorRunValue because the value was not propagated from the first workflow, making entropy reduction delta unverifiable → re-read priorRunValue from the locked snapshot taken in assert-stateless-rerun-eligibility step; patch audit record; log patch event

## Acceptance Criteria
- [ ] rerun eligibility flag is set; stage run is locked against concurrent mutation; aggregateEntropy.priorRunValue recorded as 0.72
- [ ] 26 EntityMention instances are resident in working memory, each paired with its ConflictingIntegrationMapping; no entity is missing or duplicated
- [ ] DisambiguationPass.conflictsResolved == 26 AND DisambiguationPass.appliedToStageRunId == 'ML.INT.01d32819' AND every ConflictingIntegrationMapping.isResolved == true
- [ ] no EntityBinding with perBindingEntropy.value >= 0.30 has isAccepted == true; accepted binding count is recorded; rejected bindings are quarantined
- [ ] INTStage.aggregateEntropy reflects the post-disambiguation value; AggregateEntropy.satisfiesConstraint == true if and only if the new value <= 0.30; priorRunValue remains 0.72 for audit
- [ ] SYNGate is bound to the completed INT stage run; passRateTarget is recorded; gate is in EVALUATING state
- [ ] SYNGate.observedPassRate is set to a value in [0,1]; GatePassRate.meetsTarget is set to true if observedPassRate >= 0.83, false otherwise
- [ ] SYNGate.selfResolved == true AND SYNGate is in PASSED state AND downstream pipeline stages are unblocked
- [ ] audit record is durably persisted; it references all five key artifacts; record is immutable and timestamped; G1 through G5 satisfaction flags are encoded in the record

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
