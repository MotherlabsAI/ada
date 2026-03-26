---
name: DisambiguationContext-agent
description: Use when executes the int-rerun disambiguation sub-pipeline. identifies ambiguitysets where multiple entities may refer to the same concept (entitycount > 1). creates entitybindings mapping source entities to canonical targets with per-binding entropy. runs disambiguationpasses (ordered by ordinal) to progressively reduce aggregateentropy below hardcap. evaluates syngate with synvalidationresult (passed when passrate >= 0.83). produces immutable runartifacts (immutable === true) for each pipelinerun. manages stateless re-run capability for deterministic replay. tasks arise in the DisambiguationContext domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# DisambiguationPipeline Agent

Executes the INT-rerun disambiguation sub-pipeline. Identifies AmbiguitySets where multiple entities may refer to the same concept (entityCount > 1). Creates EntityBindings mapping source entities to canonical targets with per-binding entropy. Runs DisambiguationPasses (ordered by ordinal) to progressively reduce AggregateEntropy below hardCap. Evaluates SYNGate with SYNValidationResult (passed when passRate >= 0.83). Produces immutable RunArtifacts (immutable === true) for each PipelineRun. Manages stateless re-run capability for deterministic replay.

## Bounded Context
**Context:** DisambiguationContext
**Entities:** PipelineRun, RunArtifact, AmbiguitySet, EntityBinding, AggregateEntropy, DisambiguationPass, SYNGate, SYNValidationResult, CanonicalEntity
**Interfaces:** identifyAmbiguities(entityMap), createBindings(ambiguitySet), executePass(pipelineRunId, passOrdinal), computeAggregateEntropy(bindings), evaluateSYNGate(gateId, validationResult), emitRunArtifact(runId, stageLabel, content)
**Dependencies:** ProvenanceService

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `runArtifact.immutable === true` — All run artifacts in the disambiguation context are immutable — mutation of artifacts corrupts the re-run integrity guarantee
- `aggregateEntropy.value <= aggregateEntropy.hardCap implies synValidationResult.passed === true` — When aggregate entropy satisfies the hard cap, the SYN gate must pass — inconsistency indicates a broken validation chain
- `synGate.gateId !== null && synGate.gateId.length > 0` (SYNGate) — Gate must have identity — anonymous gates cannot be referenced in pipeline integrity records
- `synGate.requiredPassRate >= 0 && synGate.requiredPassRate <= 1` (SYNGate) — Pass rate must be a valid proportion — structural readiness enforcement requires a bounded threshold
- `synGate.upstreamStage !== null && synGate.upstreamStage.length > 0` (SYNGate) — Upstream stage must be named — a gate with no upstream reference cannot enforce sequential preconditions
- `ambiguitySet.setId !== null && ambiguitySet.setId.length > 0` (AmbiguitySet) — Ambiguity set must have identity — anonymous sets cannot be targeted by disambiguation passes
- `ambiguitySet.entityCount === ambiguitySet.memberEntityIds.length` (AmbiguitySet) — Declared entity count must match actual member count — a mismatch indicates corrupt set construction
- `ambiguitySet.entityCount > 1` (AmbiguitySet) — An ambiguity set must have more than one entity — a single-entity set is not ambiguous and cannot be disambiguated
- `entityBinding.bindingId !== null && entityBinding.bindingId.length > 0` (EntityBinding) — Binding must have identity — anonymous bindings cannot be filtered or resolved
- `entityBinding.perBindingEntropy >= 0` (EntityBinding) — Per-binding entropy must be non-negative — negative entropy has no semantic meaning in disambiguation
- `entityBinding.sourceEntityId !== null && entityBinding.sourceEntityId.length > 0` (EntityBinding) — Source entity must be identified — a binding without a source is structurally incomplete
- `entityBinding.canonicalTargetId !== null && entityBinding.canonicalTargetId.length > 0` (EntityBinding) — Canonical target must be identified — a binding without a target resolves nothing
- `aggregateEntropy.value >= 0` (AggregateEntropy) — Aggregate entropy must be non-negative — negative values are not valid entropy measurements
- `aggregateEntropy.hardCap > 0` (AggregateEntropy) — Hard cap must be positive — a zero or negative cap would block all pipeline runs
- `aggregateEntropy.bindingCount > 0` (AggregateEntropy) — Entropy must be computed over at least one binding — zero-binding entropy has no semantic basis
- `aggregateEntropy.satisfiesConstraint === (aggregateEntropy.value <= aggregateEntropy.hardCap)` (AggregateEntropy) — Constraint satisfaction flag must be consistent with value and cap — inconsistency would corrupt SYN gate evaluation
- `disambiguationPass.passId !== null && disambiguationPass.passId.length > 0` (DisambiguationPass) — Pass must have identity — anonymous passes cannot be referenced in disambiguation history
- `disambiguationPass.ordinal >= 0` (DisambiguationPass) — Pass ordinal must be non-negative — negative ordinals corrupt sequential pass ordering
- `disambiguationPass.targetEntityCount > 0` (DisambiguationPass) — Pass must target at least one entity — a pass with no targets has no disambiguation purpose
- `synValidationResult.passRate >= 0 && synValidationResult.passRate <= 1` (SYNValidationResult) — Pass rate must be a valid proportion — unbounded rates cannot be compared to the SYN gate threshold
- `synValidationResult.passedBindingCount <= synValidationResult.totalBindingCount` (SYNValidationResult) — Passed count cannot exceed total — a superset violation indicates corrupt binding evaluation
- `synValidationResult.gateId !== null && synValidationResult.gateId.length > 0` (SYNValidationResult) — Result must reference the gate it evaluates — a gateless validation result has no enforcement context
- `synValidationResult.passed === (synValidationResult.passRate >= 0.83)` (SYNValidationResult) — Passed flag must be consistent with the required pass rate threshold — inconsistency undermines pipeline integrity
- `pipelineRun.runId !== null && pipelineRun.runId.length > 0` (PipelineRun) — Run must have identity — anonymous runs cannot be referenced in provenance or parent chains
- `pipelineRun.passOrdinal >= 0` (PipelineRun) — Pass ordinal must be non-negative — negative ordinals corrupt run sequencing
- `pipelineRun.stage !== null && pipelineRun.stage.length > 0` (PipelineRun) — Run must declare its stage — a stageless run cannot be placed in the compilation sequence
- `runArtifact.immutable === true` (RunArtifact) — All run artifacts are immutable — mutable artifacts corrupt the provenance chain
- `runArtifact.stageLabel !== null && runArtifact.stageLabel.length > 0` (RunArtifact) — Artifact must declare its stage — a stageless artifact cannot be placed in run history
- `runArtifact.createdAt > 0` (RunArtifact) — Artifact must be timestamped — unordered artifacts corrupt run reconstruction
- `runArtifact.runId !== null && runArtifact.runId.length > 0` (RunArtifact) — Artifact must have a run identity — anonymous artifacts cannot be referenced in binding resolution

## Workflow Steps
### validate-intent-graph-completeness (intent-to-blueprint-compilation)
- **Pre:** HandoffRecord exists, IntentGraph.goals is non-empty, no unresolved Gap records remain in ElicitationSession, all IntentConstraints have a source
- **Action:** CompilerPipeline ingests IntentGraph, instantiates CompilationRun with a new runId, records DeterminismMetadata snapshot of input hash
- **Post:** CompilationRun exists in state 'initializing', DeterminismMetadata.inputHash is recorded, IntentGraph.unknowns count is captured as baseline
- **Failure modes:**
  - precondition: IntentGraph contains unresolved Gaps — elicitation was prematurely closed → reject HandoffRecord, emit CompilationReadinessAssessment with isReady=false and list of blocking gaps, return session to 'clarifying' state
  - precondition: IntentGraph.goals is empty — no actionable intent was captured → abort CompilationRun instantiation, log PolicyViolation with type EMPTY_INTENT, notify orchestrator to restart ElicitationSession
  - action: DeterminismMetadata hash computation fails due to non-serializable IntentGraph field → log UncertaintyMarker at stage 'intake', flag CompilationRun as non-deterministic, proceed with warning rather than hard abort

### execute-entity-and-process-stage (intent-to-blueprint-compilation)
- **Pre:** CompilationRun is in state 'initializing', IntentGraph is bound to run, DomainContext is resolvable from IntentGraph goals
- **Action:** Pipeline executes entity-mapping stage: derives EntityMap and ProcessFlow from IntentGraph using DomainContext, records StageExecutionRecord for this stage
- **Post:** StageExecutionRecord exists with stage='entity_process', EntityMap is populated with at least one entity, ProcessFlow has at least one transition, CompilationRun advances to 'compiling'
- **Failure modes:**
  - postcondition: EntityMap is empty — domain extraction produced no entities from IntentGraph → create UncertaintyMarker at location 'entity_stage', emit SemanticDrift record with severity=HIGH comparing expected entity count to zero, trigger IterationRecord and re-enter elicitation with gap targeting domain terminology
  - action: DomainContext resolution times out or returns ambiguous context → suspend stage execution, emit Challenge targeting IntentGraph.rawIntent, await ClarificationAnswerRecord before retrying stage
  - postcondition: ProcessFlow contains a transition with no defined trigger — incomplete behavioral model → log UncertaintyMarker for each triggerless transition, allow pipeline to continue but mark CompilationRun as requiring manual review before gate

### syn-gate-entity-stage (intent-to-blueprint-compilation)
- **Pre:** StageExecutionRecord for 'entity_process' exists, SYNGate for upstreamStage='entity_process' is in state 'idle', EntityMap and ProcessFlow are populated
- **Action:** SYNGate evaluates passRate of entity-stage outputs: checks EntityMap completeness, ProcessFlow consistency, and UncertaintyMarker density against requiredPassRate threshold
- **Post:** SYNGate transitions to 'passed' if passRate >= passRateTarget; CompilationRun is permitted to advance to blueprint stage; SYNValidationResult is recorded
- **Failure modes:**
  - postcondition: SYNGate fails — passRate below passRateTarget due to too many UncertaintyMarkers in entity stage → SYNGate transitions to 'failed', CompilationRun is blocked from advancing, IterationRecord is created capturing failure delta, pipeline emits diagnostic listing which EntityMap entries lack sufficient definition, orchestrator re-triggers elicitation for targeted clarification
  - action: SYNGate evaluation is non-deterministic — same inputs produce different passRate on retry due to LLM variance in scoring → record DeterminismMetadata flag 'gate_variance_detected', run gate evaluation three times and take median passRate, log SemanticDrift with location='syn_gate_entity' if variance exceeds threshold

### detect-semantic-drift-during-compilation (intent-to-blueprint-compilation)
- **Pre:** CompilationRun is in state 'compiling', at least one prior CompilationRun or IterationRecord exists for comparison baseline, StageExecutionRecords are being written
- **Action:** SemanticDrift monitor runs concurrently with pipeline stages: compares current stage outputs against prior baseline for each stage, computes drift score per location
- **Post:** SemanticDrift records are emitted for any location where actual output diverges from original beyond severity threshold; drift records are attached to CompilationRun without blocking it
- **Failure modes:**
  - precondition: No prior baseline exists — first compilation run has no comparison target → SemanticDrift monitor bootstraps a null baseline, records all outputs as 'original', no drift is reported for first run; subsequent runs will have baseline
  - postcondition: SemanticDrift severity=CRITICAL detected — core IntentGoal meaning has inverted between iterations → escalate to GovernanceContext, emit PolicyViolation, pause CompilationRun, require human-in-loop acknowledgment before pipeline may continue; do not auto-resolve
  - action: Drift monitor itself introduces latency that stalls main pipeline stages → enforce async execution boundary — drift monitor writes to separate audit stream and never blocks stage execution; if monitor crashes, pipeline continues and drift gap is flagged in AuditReport

### blueprint-assembly-and-provenance-registration (intent-to-blueprint-compilation)
- **Pre:** All required SYNGates have passed, CompilationRun is in state 'compiling', no CRITICAL SemanticDrift is unacknowledged, EntityMap and ProcessFlow are finalized
- **Action:** Pipeline assembles Blueprint from EntityMap, ProcessFlow, BlueprintArchitecture, and BlueprintComponents; assigns PostcodeAddress to Blueprint; registers ProvenanceRecord with upstreamPostcodes tracing back through all StageExecutionRecords
- **Post:** Blueprint exists with a valid PostcodeAddress, ProvenanceRecord is registered in ProvenanceContext with full upstream chain, CompilationRun advances to state 'gated'
- **Failure modes:**
  - precondition: A SYNGate in 'failed' state was bypassed — upstream stage passed without meeting gate threshold → abort blueprint assembly immediately, emit PolicyViolation type=GATE_BYPASS, flag CompilationRun as CORRUPT, require full pipeline restart; this is a critical integrity failure
  - action: PostcodeAddress generation produces a collision with an existing ProvenanceRecord → increment version field of PostcodeAddress, retry registration; if three consecutive collisions occur, halt and emit AuditReport flagging provenance namespace exhaustion
  - postcondition: ProvenanceRecord upstream chain is broken — one or more StageExecutionRecords are missing from the chain → emit VerificationFinding with type=BROKEN_PROVENANCE_CHAIN, mark Blueprint as unverifiable, prevent emission to downstream consumers until chain is reconstructed or gap is explicitly acknowledged

### provenance-gate-challenge-resolution (intent-to-blueprint-compilation)
- **Pre:** CompilationRun is in state 'gated', ProvenanceGate exists for the Blueprint's PostcodeAddress transition, ProvenanceRecord is registered
- **Action:** ProvenanceGate evaluates entropyEstimate of the transition from elicitation postcode to blueprint postcode; issues challenges if entropy exceeds threshold; awaits challenge resolution before passing
- **Post:** ProvenanceGate transitions to 'passed', CompilationRun advances to 'verified', Blueprint is cleared for emission; ProvenanceGate.timestamp is recorded
- **Failure modes:**
  - action: ProvenanceGate issues challenges but no resolver is registered — challenges hang indefinitely → apply challenge timeout policy: after defined TTL, escalate to GovernorDecision for manual override or automatic rejection; never allow gate to hang silently
  - postcondition: ProvenanceGate transitions to 'rejected' — entropy too high, meaning the Blueprint is too semantically distant from the source intent → emit CompileResult with status=FAILED_PROVENANCE_GATE, attach entropyEstimate delta, return CompilationRun to 'initializing' with IterationRecord capturing the rejection reason; optionally re-enter elicitation to reduce entropy at source
  - precondition: ProvenanceGate's fromPostcode does not match the IntentGraph's registered postcode — chain of custody is broken → reject gate evaluation entirely, emit PolicyViolation type=POSTCODE_MISMATCH, halt CompilationRun and require provenance audit before any further processing

### emit-compile-result-and-checkpoint (intent-to-blueprint-compilation)
- **Pre:** CompilationRun is in state 'verified', ProvenanceGate has passed, no unacknowledged CRITICAL SemanticDrift exists, AuditReport is generated
- **Action:** Pipeline emits CompileResult with status=SUCCESS, Blueprint, AuditReport, and full ProvenanceTrace; OrchestratorContext records SessionCheckpoint capturing the terminal state of this run
- **Post:** CompileResult is persisted and accessible to downstream consumers, SessionCheckpoint exists in OrchestratorContext, CompilationRun transitions to state 'emitted'
- **Failure modes:**
  - action: SessionCheckpoint write fails — orchestrator storage is unavailable → retry checkpoint write up to three times with exponential backoff; if all retries fail, emit CompileResult anyway but flag it as UNCHECKPOINTED; alert operator that replay capability is degraded
  - postcondition: CompileResult is emitted but downstream consumer rejects Blueprint schema — version mismatch between compiler and consumer → log VerificationFinding type=SCHEMA_MISMATCH, trigger TypeRegistryContext verification scan to detect divergence between compiler output schema and registered PackageBoundary types

### snapshot-ingestion-and-symbol-extraction (formal-verification-and-drift-audit)
- **Pre:** CodebaseSnapshot is well-formed, TypeRegistryContext is populated with current TypeRegistryEntry and PackageBoundary records, snapshot has a unique identifier
- **Action:** VerificationContext extracts CodeSymbols from snapshot by traversing PackageBoundary definitions; indexes symbols against TypeRegistryEntry records; identifies all HoareTriple annotations present in codebase
- **Post:** CodeSymbol set is populated for this snapshot, HoareTriple index is built, snapshot is marked as 'indexed' in VerificationContext
- **Failure modes:**
  - precondition: TypeRegistryContext is stale — PackageBoundary definitions do not reflect the actual codebase state → trigger TypeRegistryContext refresh before proceeding; if refresh fails, proceed with stale registry but mark all VerificationFindings as REGISTRY_STALE and reduce confidence scores
  - action: CodeSymbol extraction encounters an unparseable source file — syntax error or unsupported construct → skip unparseable file, log VerificationFinding type=PARSE_FAILURE for the affected path, continue extraction for remaining files; report parse failure count in AuditReport
  - postcondition: HoareTriple index is empty — no formal annotations found in codebase → emit VerificationFinding type=NO_FORMAL_ANNOTATIONS with severity=WARNING; this is valid for early-stage codebases but signals that formal verification coverage is zero

### diff-against-prior-snapshot (formal-verification-and-drift-audit)
- **Pre:** Current snapshot is indexed, a prior CodebaseSnapshot exists in VerificationContext for comparison, both snapshots share the same AdaSystem.systemId
- **Action:** VerificationContext computes DiffResult between current and prior snapshot: identifies added, removed, and modified CodeSymbols and PackageBoundary changes; computes per-boundary change density
- **Post:** DiffResult is populated with symbol-level changes, PackageBoundary mutation list is produced, change density scores are available for downstream drift assessment
- **Failure modes:**
  - precondition: No prior snapshot exists — this is the first verification run → skip diff step, create a null DiffResult marked as 'baseline', continue to HoareTriple validation; drift detection will be deferred to the next run
  - action: Diff computation produces results that are too large to process — massive refactor or rename affecting majority of symbols → apply sampling strategy: diff only PackageBoundary-level changes for this run, defer symbol-level diff to background job, flag DiffResult as PARTIAL and note in AuditReport
  - postcondition: DiffResult shows a PackageBoundary was deleted that is referenced by active ProvenanceRecords → immediately emit VerificationFinding type=BROKEN_PACKAGE_REFERENCE with severity=CRITICAL, cross-reference all ProvenanceRecords pointing to deleted boundary, notify GovernanceContext to evaluate downstream impact

### hoare-triple-consistency-validation (formal-verification-and-drift-audit)
- **Pre:** HoareTriple index is built from current snapshot, DiffResult is available, BoundedContextResult targets are identified from PackageBoundary list
- **Action:** For each HoareTriple in the index: evaluate whether the precondition is satisfiable given current EntityMap and type definitions; verify that the postcondition is reachable from the action given current codebase state; record BoundedContextResult per context boundary
- **Post:** Each HoareTriple has a validation status (valid, weakened, violated, unverifiable); BoundedContextResult records exist per bounded context; VerificationReport is populated with all findings
- **Failure modes:**
  - action: A HoareTriple's precondition references a type that has been modified in the DiffResult — the formal contract may be stale → mark HoareTriple as 'weakened', emit VerificationFinding type=STALE_CONTRACT referencing both the triple and the DiffResult entry; require contract owner to re-ratify
  - postcondition: A HoareTriple is found to be violated — postcondition is unreachable given the action and current type definitions → emit VerificationFinding type=HOARE_VIOLATION with severity=HIGH, include the specific type mismatch or missing transition that causes the violation, escalate to GovernanceContext for PolicyViolation assessment
  - action: HoareTriple validation is computationally unbounded — a triple references a recursive or cyclic process definition → apply depth limit to validation traversal, mark triple as 'unverifiable' if limit is hit, log UncertaintyMarker at the problematic triple location, continue validation for remaining triples

### semantic-drift-classification-and-report-emission (formal-verification-and-drift-audit)
- **Pre:** VerificationReport has findings from HoareTriple validation and DiffResult analysis, SemanticDrift records from active CompilationRuns are accessible, BoundedContextResults are populated
- **Action:** VerificationContext classifies all SemanticDrift records by severity and location, correlates them with HoareTriple violations and DiffResult changes, assembles final VerificationReport with ranked findings and recommended interventions
- **Post:** VerificationReport is emitted and persisted, each SemanticDrift record has a classification and a linked VerificationFinding, AuditReport is updated with verification run metadata
- **Failure modes:**
  - precondition: SemanticDrift records from active CompilationRuns are in a transient state — drift monitor is mid-write when verification reads → apply read snapshot isolation: take a point-in-time copy of drift records at verification start, accept that very recent drift may not be included, note staleness window in AuditReport
  - postcondition: VerificationReport contains more CRITICAL findings than a defined threshold — system may be in a degraded state → emit escalation event to OrchestratorContext, trigger SessionCheckpoint to preserve current system state before any further compilation runs are permitted, notify team via configured channel
  - action: Correlation between SemanticDrift and HoareTriple violations fails — drift records lack location metadata to match against triple locations → emit VerificationFindings for drift and triples independently without correlation, note in AuditReport that cross-referencing was not possible, flag as a gap in provenance metadata coverage

### raw-intent-ingestion-and-gap-analysis (elicitation-session-to-handoff)
- **Pre:** RawIntent is non-empty string, ElicitationSession is in state 'open', no prior DraftIntentGraph exists for this session
- **Action:** ElicitationContext parses RawIntent into a DraftIntentGraph skeleton: extracts candidate IntentGoals, IntentConstraints, and flags unresolvable portions as Gap records
- **Post:** DraftIntentGraph exists with at least one IntentGoal, all unresolvable portions are recorded as Gap records with descriptions, ElicitationSession advances to 'clarifying'
- **Failure modes:**
  - precondition: RawIntent is too short or entirely ambiguous to yield any candidate IntentGoals → emit a ClarificationRequestRecord targeting the entire RawIntent, keep session in 'open' state, prompt user for restatement with scaffolded examples
  - postcondition: DraftIntentGraph has IntentGoals but all are typed as 'unknown' — domain is not recognizable → emit AdaProposal suggesting candidate domains based on vocabulary analysis of RawIntent, await user confirmation before advancing session state

### iterative-clarification-turns (elicitation-session-to-handoff)
- **Pre:** ElicitationSession is in state 'clarifying', at least one Gap exists in DraftIntentGraph, prior ElicitationTurn count is below maximum turn limit
- **Action:** For each Gap: Ada generates a ClarificationRequestRecord targeting the gap, records an ElicitationTurn, awaits ClarificationAnswerRecord, updates DraftIntentGraph to resolve or refine the gap
- **Post:** Gap count in DraftIntentGraph is reduced; each processed Gap either transitions to resolved or is marked as an acceptable unknown with an IntentUnknown record; ElicitationTurn history is complete
- **Failure modes:**
  - precondition: Maximum turn limit reached — session has been clarifying too long without resolving gaps → emit CompilationReadinessAssessment with isReady=false and a summary of unresolved gaps; present user with option to proceed with unknowns flagged or abandon session
  - action: ClarificationAnswerRecord introduces a new contradiction with an existing IntentConstraint → emit SemanticDrift record for the contradiction location, surface both the original constraint and the contradicting answer to the user in the next ElicitationTurn, require explicit resolution before advancing
  - postcondition: Gap count did not decrease after a full clarification cycle — user answers are not resolving ambiguities → switch clarification strategy: emit AdaProposal with a concrete interpretation of the gap rather than asking another question; let user confirm or reject Ada's interpretation to break the cycle

### schema-conformance-check-and-handoff (elicitation-session-to-handoff)
- **Pre:** ElicitationSession is in state 'proposing', DraftIntentGraph has no unresolved Gaps (only accepted IntentUnknowns), SchemaConformanceResult has not yet been run for this draft version
- **Action:** ElicitationContext runs SchemaConformanceResult check against the DraftIntentGraph: validates all required fields of IntentGraph, IntentGoal, IntentConstraint are present and typed correctly; if conformant, promotes DraftIntentGraph to IntentGraph and emits HandoffRecord
- **Post:** IntentGraph is finalized with a PostcodeAddress, HandoffRecord is emitted to CompilerPipelineContext, ElicitationSession transitions to 'ratified'
- **Failure modes:**
  - action: SchemaConformanceResult fails — required IntentGraph fields are missing or maltyped → return session to 'clarifying' state with a ClarificationRequestRecord targeting each failing field; do not emit HandoffRecord until conformance passes
  - postcondition: HandoffRecord is emitted but CompilerPipelineContext rejects it — schema version mismatch between elicitation and compiler → compensate by re-emitting HandoffRecord with explicit schema version header; if rejection persists, log VerificationFinding type=HANDOFF_SCHEMA_MISMATCH and alert orchestrator to reconcile package versions

## Acceptance Criteria
- [ ] CompilationRun exists in state 'initializing', DeterminismMetadata.inputHash is recorded, IntentGraph.unknowns count is captured as baseline
- [ ] StageExecutionRecord exists with stage='entity_process', EntityMap is populated with at least one entity, ProcessFlow has at least one transition, CompilationRun advances to 'compiling'
- [ ] SYNGate transitions to 'passed' if passRate >= passRateTarget; CompilationRun is permitted to advance to blueprint stage; SYNValidationResult is recorded
- [ ] SemanticDrift records are emitted for any location where actual output diverges from original beyond severity threshold; drift records are attached to CompilationRun without blocking it
- [ ] Blueprint exists with a valid PostcodeAddress, ProvenanceRecord is registered in ProvenanceContext with full upstream chain, CompilationRun advances to state 'gated'
- [ ] ProvenanceGate transitions to 'passed', CompilationRun advances to 'verified', Blueprint is cleared for emission; ProvenanceGate.timestamp is recorded
- [ ] CompileResult is persisted and accessible to downstream consumers, SessionCheckpoint exists in OrchestratorContext, CompilationRun transitions to state 'emitted'
- [ ] CodeSymbol set is populated for this snapshot, HoareTriple index is built, snapshot is marked as 'indexed' in VerificationContext
- [ ] DiffResult is populated with symbol-level changes, PackageBoundary mutation list is produced, change density scores are available for downstream drift assessment
- [ ] Each HoareTriple has a validation status (valid, weakened, violated, unverifiable); BoundedContextResult records exist per bounded context; VerificationReport is populated with all findings
- [ ] VerificationReport is emitted and persisted, each SemanticDrift record has a classification and a linked VerificationFinding, AuditReport is updated with verification run metadata
- [ ] DraftIntentGraph exists with at least one IntentGoal, all unresolvable portions are recorded as Gap records with descriptions, ElicitationSession advances to 'clarifying'
- [ ] Gap count in DraftIntentGraph is reduced; each processed Gap either transitions to resolved or is marked as an acceptable unknown with an IntentUnknown record; ElicitationTurn history is complete
- [ ] IntentGraph is finalized with a PostcodeAddress, HandoffRecord is emitted to CompilerPipelineContext, ElicitationSession transitions to 'ratified'

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
