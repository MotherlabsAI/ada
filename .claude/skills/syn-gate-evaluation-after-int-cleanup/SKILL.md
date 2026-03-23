---
name: syn-gate-evaluation-after-int-cleanup
description: "Use when INTStage.aggregateEntropy satisfiesConstraint == true following successful disambiguation rerun pattern detected."
---

# SYN-Gate-Evaluation-After-INT-Cleanup

Trigger: INTStage.aggregateEntropy satisfiesConstraint == true following successful disambiguation rerun

## Steps
1. **bind-syn-gate-to-int-run**
   - Pre: `INTStage.aggregateEntropy <= 0.30 AND AggregateEntropy.satisfiesConstraint == true AND SYNGate.intStageRunId is unset`
   - Action: `set SYNGate.intStageRunId = 'ML.INT.01d32819'; set SYNGate.passRateTarget = 0.83; initialize SYNGate.observedPassRate = null; set SYNGate.selfResolved = false`
   - Post: `SYNGate is bound to the completed INT stage run; passRateTarget is recorded; gate is in EVALUATING state`

2. **evaluate-syn-gate-pass-rate**
   - Pre: `SYNGate is in EVALUATING state AND SYNGate.intStageRunId == 'ML.INT.01d32819' AND accepted EntityBinding count > 0`
   - Action: `stream all accepted EntityBinding records into the SYN gate evaluator; compute GatePassRate.value as the fraction of bindings that satisfy SYN gate admission criteria; write result to SYNGate.observedPassRate and GatePassRate.value; compare against GatePassRate.target == 0.83`
   - Post: `SYNGate.observedPassRate is set to a value in [0,1]; GatePassRate.meetsTarget is set to true if observedPassRate >= 0.83, false otherwise`

3. **resolve-syn-gate-self-resolution**
   - Pre: `GatePassRate.meetsTarget == true AND SYNGate.observedPassRate >= 0.83 AND SYNGate.selfResolved == false`
   - Action: `set SYNGate.selfResolved = true; transition SYNGate to PASSED state; emit syn-gate-passed event carrying observedPassRate and intStageRunId; release downstream pipeline stages blocked on this gate`
   - Post: `SYNGate.selfResolved == true AND SYNGate is in PASSED state AND downstream pipeline stages are unblocked`

4. **audit-entropy-gate-binding-triad**
   - Pre: `SYNGate is in PASSED state AND INTStage.aggregateEntropy <= 0.30 AND DisambiguationPass.conflictsResolved == 26`
   - Action: `write an immutable audit record linking RunID, DisambiguationPass.passIndex, AggregateEntropy.value, AggregateEntropy.priorRunValue, GatePassRate.value, and SYNGate.selfResolved into the Ada monorepo pipeline audit log`
   - Post: `audit record is durably persisted; it references all five key artifacts; record is immutable and timestamped; G1 through G5 satisfaction flags are encoded in the record`
