---
name: CompilerPipelineContext-agent
description: Use when exposes ada's capabilities through the model context protocol server interface. provides verifyresult for external verification requests, workflowspec for workflow introspection, and agentfilespec for agent configuration queries. acts as the external integration surface connecting ada to claude and other mcp-compatible clients. tasks arise in the CompilerPipelineContext domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# MCPInterface Agent

Exposes Ada's capabilities through the Model Context Protocol server interface. Provides VerifyResult for external verification requests, WorkflowSpec for workflow introspection, and AgentFileSpec for agent configuration queries. Acts as the external integration surface connecting Ada to Claude and other MCP-compatible clients.

## Bounded Context
**Context:** CompilerPipelineContext
**Entities:** CompilationRun, StageExecutionRecord, DeterminismMetadata, PipelineState, IntentGraph, IntentGoal, IntentConstraint, IntentUnknown, DomainContext, Stakeholder, EntityMap, ProcessFlow, Blueprint, BlueprintArchitecture, BlueprintComponent, AuditReport, CompileResult, FallbackBlueprintResult, IterationRecord, UncertaintyMarker, SemanticDrift, HoareTriple, Challenge, PolicyViolation
**Interfaces:** verify(verifyOptions), describeWorkflow(workflowId), describeAgent(agentName), listCapabilities()
**Dependencies:** PipelineCoordinator, VerificationAnalyzer, ProvenanceService

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `compilationRun.stages.length > 0` — Every compilation run must have at least one stage — a run with no stages has no provenance trail
- `pipelineState.synthesis !== null implies pipelineState.entity !== null` — Synthesis cannot precede entity mapping — this protects stage ordering integrity
- `hoareTriple.precondition !== null && hoareTriple.precondition.length > 0` (HoareTriple) — Precondition must be stated — without it the formal contract is incomplete and pipeline correctness cannot be guaranteed
- `hoareTriple.postcondition !== null && hoareTriple.postcondition.length > 0` (HoareTriple) — Postcondition must be stated — without it transformation correctness has no verifiable end state
- `hoareTriple.action !== null && hoareTriple.action.length > 0` (HoareTriple) — Action must be named — the triple without action has no semantic transformation to constrain
- `semanticDrift.location !== null && semanticDrift.location.length > 0` (SemanticDrift) — Drift must be locatable — unlocated drift cannot be gated or corrected in the pipeline
- `semanticDrift.original !== null` (SemanticDrift) — Original meaning must be preserved — without it drift magnitude cannot be computed
- `semanticDrift.actual !== null` (SemanticDrift) — Actual produced meaning must be recorded — without it the drift is not measurable
- `semanticDrift.severity !== null` (SemanticDrift) — Severity must be classified — ungated drift of unknown severity undermines formal correctness guarantees
- `intentGraph.rawIntent !== null && intentGraph.rawIntent.length > 0` (IntentGraph) — Raw intent must be preserved — the graph without its source cannot trace elicitation fidelity
- `intentGraph.postcode !== null` (IntentGraph) — IntentGraph must carry a postcode — it is the first typed artifact in the pipeline and must be addressable
- `intentGraph.goals.length > 0 || intentGraph.unknowns.length > 0` (IntentGraph) — A graph with no goals and no unknowns has not been elicited — it cannot enter the compiler pipeline
- `intentGoal.id !== null && intentGoal.id.length > 0` (IntentGoal) — Goal must have identity — goals without IDs cannot be referenced by provenance traces
- `intentGoal.description !== null && intentGoal.description.length > 0` (IntentGoal) — Goal description must be present — an empty goal contributes nothing to the intent graph
- `intentGoal.type !== null` (IntentGoal) — Goal type must be classified — unclassified goals cannot be weighted correctly in the synthesis stage
- `intentConstraint.id !== null && intentConstraint.id.length > 0` (IntentConstraint) — Constraint must have identity — sourceless constraints cannot be traced to elicitation turns
- `intentConstraint.description !== null && intentConstraint.description.length > 0` (IntentConstraint) — Constraint description must be non-empty — a constraint with no description enforces nothing nameable
- `intentConstraint.source !== null` (IntentConstraint) — Source must be declared — constraints without origin cannot be audited for domain alignment
- `intentUnknown.id !== null && intentUnknown.id.length > 0` (IntentUnknown) — Unknown must have identity — anonymous unknowns cannot be resolved through clarification records
- `intentUnknown.impact !== null` (IntentUnknown) — Impact classification must exist — unclassified unknowns cannot be prioritized for elicitation turns
- `domainContext.domain !== null && domainContext.domain.length > 0` (DomainContext) — Domain must be named — a context with no domain cannot bound the semantic space of elicitation
- `domainContext.postcode !== null` (DomainContext) — DomainContext must carry a postcode — it is a first-class typed pipeline artifact
- `Object.keys(domainContext.ubiquitousLanguage).length > 0 || domainContext.stakeholders.length > 0` (DomainContext) — Domain context must have either vocabulary or stakeholders — an empty context cannot scaffold compilation
- `stakeholder.role !== null && stakeholder.role.length > 0` (Stakeholder) — Stakeholder must have a named role — anonymous stakeholders cannot be differentiated in domain modeling
- `Object.keys(stakeholder.vocabulary).length >= 0` (Stakeholder) — Vocabulary map must be initialized — null vocabulary prevents ubiquitous language synthesis
- `entityMap.entities.length > 0` (EntityMap) — Entity map must contain at least one entity — an empty map cannot drive synthesis or verification
- `entityMap.boundedContexts.length > 0` (EntityMap) — At least one bounded context must exist — ungrouped entities have no architectural location
- `entityMap.postcode !== null` (EntityMap) — EntityMap must carry a postcode — it is a typed pipeline artifact requiring provenance
- `processFlow.postcode !== null` (ProcessFlow) — ProcessFlow must carry a postcode — without it the stage cannot be gated by provenance
- `processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0` (ProcessFlow) — ProcessFlow must contain at least one workflow or state machine — an empty flow has no behavioral model to synthesize from
- `blueprint.summary !== null && blueprint.summary.length > 0` (Blueprint) — Blueprint must have a summary — the vision document requires a nameable synthesis output
- `blueprint.postcode !== null` (Blueprint) — Blueprint must carry a postcode — it is the canonical typed artifact of compilation
- `blueprint.architecture !== null` (Blueprint) — Architecture must be present — a blueprint without structure cannot be verified against codebase
- `blueprintArchitecture.pattern !== null && blueprintArchitecture.pattern.length > 0` (BlueprintArchitecture) — Architecture pattern must be named — unnamed patterns cannot be referenced in the vision document
- `blueprintArchitecture.rationale !== null && blueprintArchitecture.rationale.length > 0` (BlueprintArchitecture) — Rationale must be present — a pattern without justification cannot be aligned to convergence trajectory
- `blueprintArchitecture.components.length > 0` (BlueprintArchitecture) — At least one component must exist — an architecture with no components is structurally empty
- `blueprintComponent.name !== null && blueprintComponent.name.length > 0` (BlueprintComponent) — Component must be named — anonymous components cannot appear in the vision document
- `blueprintComponent.responsibility !== null && blueprintComponent.responsibility.length > 0` (BlueprintComponent) — Responsibility must be stated — a component with no responsibility has no architectural identity
- `blueprintComponent.boundedContext !== null && blueprintComponent.boundedContext.length > 0` (BlueprintComponent) — Component must belong to a bounded context — decontextualized components break architectural coherence
- `auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1` (AuditReport) — Coverage score must be a valid proportion — out-of-range scores cannot be compared across pipeline runs
- `auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1` (AuditReport) — Coherence score must be a valid proportion — incoherent scoring undermines governor decisions
- `auditReport.postcode !== null` (AuditReport) — AuditReport must carry a postcode — without it the report cannot be placed in provenance chain
- `policyViolation.ruleViolated !== null && policyViolation.ruleViolated.length > 0` (PolicyViolation) — Violated rule must be named — anonymous violations cannot be traced to governor policy
- `policyViolation.stageCode !== null` (PolicyViolation) — Stage must be identified — violations without stage attribution cannot drive targeted remediation
- `policyViolation.severity !== null` (PolicyViolation) — Severity must be classified — unseveritized violations cannot be prioritized by the governor
- `compilationRun.runId !== null && compilationRun.runId.length > 0` (CompilationRun) — Run must have identity — anonymous runs cannot be referenced in iteration history or provenance
- `compilationRun.sourceIntent !== null && compilationRun.sourceIntent.length > 0` (CompilationRun) — Source intent must be preserved — a run without its origin cannot be audited for elicitation fidelity
- `compilationRun.completedAt >= compilationRun.startedAt` (CompilationRun) — Completion must not precede start — temporal inversion corrupts duration metrics and audit ordering
- `compilationRun.stages.length > 0` (CompilationRun) — A run with no stages executed nothing — it cannot contribute to provenance or iteration records
- `stageExecutionRecord.stageCode !== null` (StageExecutionRecord) — Stage code must be present — a record without stage identification cannot be placed in the compilation run sequence
- `stageExecutionRecord.postcode !== null` (StageExecutionRecord) — Stage execution must carry a postcode — without it the record cannot be linked in the provenance chain
- `stageExecutionRecord.metadata !== null` (StageExecutionRecord) — Determinism metadata must be present — without model and temperature records, reproducibility cannot be audited
- `determinismMetadata.modelId !== null && determinismMetadata.modelId.length > 0` (DeterminismMetadata) — Model must be identified — without a model ID the compilation run cannot be reproduced or audited
- `determinismMetadata.temperature >= 0` (DeterminismMetadata) — Temperature must be non-negative — negative temperature is not a valid model parameter
- `determinismMetadata.callDurationMs >= 0` (DeterminismMetadata) — Call duration must be non-negative — negative durations corrupt performance metrics
- `pipelineState.cumulativeEntropy >= 0` (PipelineState) — Cumulative entropy must be non-negative — negative entropy has no semantic meaning in drift measurement
- `pipelineState.gates !== null` (PipelineState) — Gates record must be initialized — a pipeline with no gate map cannot enforce provenance checkpoints
- `!(pipelineState.synthesis !== null && pipelineState.entity === null)` (PipelineState) — Synthesis cannot exist without entity map — Blueprint depends on EntityMap as a structural precondition
- `compileResult.iterationCount > 0` (CompileResult) — At least one iteration must have occurred — a result from zero iterations has no provenance
- `compileResult.blueprint !== null` (CompileResult) — Blueprint must be present — a compile result without output is not a result
- `compileResult.status !== null` (CompileResult) — Status must be set — an unclassified result cannot be acted upon by the orchestrator
- `fallbackBlueprintResult.partialBlueprint !== null` (FallbackBlueprintResult) — Fallback must carry a partial blueprint — a fallback with no artifact cannot be used for downstream recovery
- `fallbackBlueprintResult.iterationHistory.length > 0` (FallbackBlueprintResult) — Fallback must have iteration history — without it the best iteration cannot be justified
- `fallbackBlueprintResult.bestIterationIndex >= 0 && fallbackBlueprintResult.bestIterationIndex < fallbackBlueprintResult.iterationHistory.length` (FallbackBlueprintResult) — Best iteration index must be within bounds — out-of-range index references a non-existent iteration
- `iterationRecord.iterationNumber > 0` (IterationRecord) — Iteration number must be positive — iteration zero is indistinguishable from an uninitialized record
- `iterationRecord.coverageScore >= 0 && iterationRecord.coverageScore <= 1` (IterationRecord) — Coverage score must be bounded — unbounded scores corrupt iteration comparison logic
- `iterationRecord.blueprint !== null` (IterationRecord) — Each iteration must produce a blueprint — an iteration without output cannot be selected as best
- `uncertaintyMarker.confidence >= 0 && uncertaintyMarker.confidence <= 1` (UncertaintyMarker) — Confidence must be a valid proportion — unbounded confidence markers cannot be compared across stages
- `uncertaintyMarker.description !== null && uncertaintyMarker.description.length > 0` (UncertaintyMarker) — Uncertainty must be described — an anonymous marker cannot guide fallback selection
- `uncertaintyMarker.stageCode !== null` (UncertaintyMarker) — Stage must be attributed — uncertainty without stage location cannot be remediated

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
