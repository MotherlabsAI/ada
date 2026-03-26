---
name: intent-to-blueprint-compilation
description: "Use when ElicitationSession emits HandoffRecord with ratified IntentGraph pattern detected."
---

# intent-to-blueprint-compilation

Trigger: ElicitationSession emits HandoffRecord with ratified IntentGraph

## Steps
1. **validate-intent-graph-completeness**
   - Pre: `HandoffRecord exists, IntentGraph.goals is non-empty, no unresolved Gap records remain in ElicitationSession, all IntentConstraints have a source`
   - Action: `CompilerPipeline ingests IntentGraph, instantiates CompilationRun with a new runId, records DeterminismMetadata snapshot of input hash`
   - Post: `CompilationRun exists in state 'initializing', DeterminismMetadata.inputHash is recorded, IntentGraph.unknowns count is captured as baseline`

2. **execute-entity-and-process-stage**
   - Pre: `CompilationRun is in state 'initializing', IntentGraph is bound to run, DomainContext is resolvable from IntentGraph goals`
   - Action: `Pipeline executes entity-mapping stage: derives EntityMap and ProcessFlow from IntentGraph using DomainContext, records StageExecutionRecord for this stage`
   - Post: `StageExecutionRecord exists with stage='entity_process', EntityMap is populated with at least one entity, ProcessFlow has at least one transition, CompilationRun advances to 'compiling'`

3. **syn-gate-entity-stage**
   - Pre: `StageExecutionRecord for 'entity_process' exists, SYNGate for upstreamStage='entity_process' is in state 'idle', EntityMap and ProcessFlow are populated`
   - Action: `SYNGate evaluates passRate of entity-stage outputs: checks EntityMap completeness, ProcessFlow consistency, and UncertaintyMarker density against requiredPassRate threshold`
   - Post: `SYNGate transitions to 'passed' if passRate >= passRateTarget; CompilationRun is permitted to advance to blueprint stage; SYNValidationResult is recorded`

4. **detect-semantic-drift-during-compilation**
   - Pre: `CompilationRun is in state 'compiling', at least one prior CompilationRun or IterationRecord exists for comparison baseline, StageExecutionRecords are being written`
   - Action: `SemanticDrift monitor runs concurrently with pipeline stages: compares current stage outputs against prior baseline for each stage, computes drift score per location`
   - Post: `SemanticDrift records are emitted for any location where actual output diverges from original beyond severity threshold; drift records are attached to CompilationRun without blocking it`

5. **blueprint-assembly-and-provenance-registration**
   - Pre: `All required SYNGates have passed, CompilationRun is in state 'compiling', no CRITICAL SemanticDrift is unacknowledged, EntityMap and ProcessFlow are finalized`
   - Action: `Pipeline assembles Blueprint from EntityMap, ProcessFlow, BlueprintArchitecture, and BlueprintComponents; assigns PostcodeAddress to Blueprint; registers ProvenanceRecord with upstreamPostcodes tracing back through all StageExecutionRecords`
   - Post: `Blueprint exists with a valid PostcodeAddress, ProvenanceRecord is registered in ProvenanceContext with full upstream chain, CompilationRun advances to state 'gated'`

6. **provenance-gate-challenge-resolution**
   - Pre: `CompilationRun is in state 'gated', ProvenanceGate exists for the Blueprint's PostcodeAddress transition, ProvenanceRecord is registered`
   - Action: `ProvenanceGate evaluates entropyEstimate of the transition from elicitation postcode to blueprint postcode; issues challenges if entropy exceeds threshold; awaits challenge resolution before passing`
   - Post: `ProvenanceGate transitions to 'passed', CompilationRun advances to 'verified', Blueprint is cleared for emission; ProvenanceGate.timestamp is recorded`

7. **emit-compile-result-and-checkpoint**
   - Pre: `CompilationRun is in state 'verified', ProvenanceGate has passed, no unacknowledged CRITICAL SemanticDrift exists, AuditReport is generated`
   - Action: `Pipeline emits CompileResult with status=SUCCESS, Blueprint, AuditReport, and full ProvenanceTrace; OrchestratorContext records SessionCheckpoint capturing the terminal state of this run`
   - Post: `CompileResult is persisted and accessible to downstream consumers, SessionCheckpoint exists in OrchestratorContext, CompilationRun transitions to state 'emitted'`
