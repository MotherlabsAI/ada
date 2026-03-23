---
name: syn-gate-revaluation
description: "Use when SYNGate receives trigger event from sealed VersionedArtifact pattern detected."
---

# syn-gate-revaluation

Trigger: SYNGate receives trigger event from sealed VersionedArtifact

## Steps
1. **ingest-trigger-artifact**
   - Pre: `trigger event carries a valid VersionedArtifact reference; SYNGate is in idle or pending-trigger state`
   - Action: `load VersionedArtifact from artifact store using triggerArtifact reference; bind it as evaluation input`
   - Post: `VersionedArtifact is loaded and its acceptedBindings and aggregateEntropy are accessible to evaluator`

2. **compute-pass-rate**
   - Pre: `VersionedArtifact.acceptedBindings is accessible; VersionedArtifact.aggregateEntropy is a valid finite number`
   - Action: `evaluate bindings against SYN gate criteria; derive pass rate as ratio of gate-passing bindings to total accepted bindings`
   - Post: `pass rate is a finite value in [0.0, 1.0]; binding-level gate results are recorded`

3. **evaluate-syn-gate-threshold**
   - Pre: `pass rate is a valid finite value in [0.0, 1.0]; SYNGate.passRateTarget = 0.83`
   - Action: `compare computed pass rate to SYNGate.passRateTarget; set gate outcome to passed if pass rate >= 0.83 else failed`
   - Post: `SYNGate transitions to passed or failed state; gate outcome and actual pass rate are recorded on evaluation result`

4. **emit-gate-result**
   - Pre: `SYNGate is in passed or failed state; gate outcome is persisted`
   - Action: `publish gate result event downstream with {passRate, targetAchieved, artifactRunId, artifactVersion}`
   - Post: `downstream pipeline stages receive gate result; SYNGate returns to idle state`
