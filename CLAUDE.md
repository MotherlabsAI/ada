# ada is a CLI semantic compiler that accepts natural language intent and transforms it through a gated 7-stage pipeline (INT→PER→ENT→PRO→SYN→AUD→GOV) into a governed Blueprint specification
## Status: GHOST — new project

## Summary
ada is a CLI semantic compiler that accepts natural language intent and transforms it through a gated 7-stage pipeline (INT→PER→ENT→PRO→SYN→AUD→GOV) into a governed Blueprint specification. Each stage reduces ambiguity, every artifact carries a PostcodeAddress for provenance tracing back to the original intent, and only a Governor ACCEPT verdict emits a final CompileResult. The system supports iterative re-runs when the Governor issues ITERATE, and resolves ambiguity interactively via CLI clarification prompts.

## Working Principles
- Read this file fully before doing anything
- Read all agent files in `.claude/agents/` to understand bounded contexts
- Delegate work to specialist agents by bounded context
- Follow the build order below — each step depends on the previous
- Do NOT circumvent hook enforcement — hooks enforce entity invariants
- Verify postconditions after each step before proceeding
- When uncertain, investigate first rather than asking

## Architecture
**Pattern:** gated-sequential-pipeline
**Rationale:** The 7 compilation stages are strictly sequential — each stage's output is the next stage's input, enforced by ProvenanceGates that validate entropy reduction between stages. The pipeline pattern directly maps to the semantic-compilation-pipeline workflow. Gates between stages are the enforcement mechanism for provenance integrity (G5) and determinism tracking (G8).

## Components
### IntentParser
**Responsibility:** Parses raw natural language intent string into a structured IntentGraph containing goals, constraints, unknowns, and stakeholders. Assigns the initial PostcodeAddress (stage=INT). Detects blocking unknowns for downstream ambiguity resolution.
**Bounded Context:** Intent
**Interfaces:** parse(rawIntent: string): IntentGraph, extractGoals(rawIntent: string): IntentGoal[], extractUnknowns(rawIntent: string): IntentUnknown[], extractConstraints(rawIntent: string): IntentConstraint[]
**Dependencies:** ProvenanceTracker

### AmbiguityResolver
**Responsibility:** Implements the ambiguity-resolution workflow. Evaluates blocking IntentUnknowns, generates ClarificationRequests, collects user responses via CLI, applies defaults for non-blocking unknowns, and merges resolutions back into the IntentGraph. Drives the IntentUnknown state machine (DETECTED→PENDING_CLARIFICATION→RESOLVED_BY_USER|RESOLVED_BY_DEFAULT|UNRESOLVABLE).
**Bounded Context:** Intent
**Interfaces:** evaluateAmbiguity(graph: IntentGraph): ClarificationRequest[], resolveWithAnswer(request: ClarificationRequest, answer: ClarificationAnswer): IntentGraph, applyDefaults(graph: IntentGraph): IntentGraph, mergeResolutions(graph: IntentGraph, answers: ClarificationAnswer[]): IntentGraph
**Dependencies:** IntentParser, CLIInterface

### PipelineOrchestrator
**Responsibility:** Drives the 7-stage sequential pipeline, manages the CompilationRun state machine (PENDING→PARSING→AWAITING_CLARIFICATION→RUNNING→AUDITING→GOVERNING→ITERATING→ACCEPTED|REJECTED|FAILED), and coordinates stage execution order. Owns the Pipeline state machine (IDLE→EXECUTING→CHECKPOINTED→COMPLETED|FAILED). Delegates to StageExecutor for individual stage runs. Implements the governor-iteration-loop workflow for ITERATE decisions.
**Bounded Context:** Pipeline
**Interfaces:** compile(intent: string, options: CompileOptions): CompileResult, replayFromCheckpoint(run: CompilationRun, targetStage: CompilerStageCode): CompilationRun, getRunState(runId: string): PipelineState, sealRun(run: CompilationRun): CompileResult
**Dependencies:** IntentParser, AmbiguityResolver, DomainModeler, BlueprintSynthesizer, Auditor, Governor, ProvenanceTracker, StageExecutor

### StageExecutor
**Responsibility:** Executes a single pipeline stage, captures DeterminismMetadata (modelId, temperature, maxTokens, callDurationMs), produces a StageExecutionRecord, and validates the ProvenanceGate between the completed stage and the next stage. Enforces that entropy does not increase across gates.
**Bounded Context:** Pipeline
**Interfaces:** execute(stageCode: CompilerStageCode, input: GateInput, callbacks?: AgentCallbacks): StageExecutionRecord, validateGate(from: StageExecutionRecord, to: CompilerStageCode): ProvenanceGate, recordMetadata(stageCode: CompilerStageCode, modelId: ModelId): DeterminismMetadata
**Dependencies:** ProvenanceTracker

### DomainModeler
**Responsibility:** Implements three pipeline stages (PER, ENT, PRO). PER: extracts DomainContext with ubiquitous language from the IntentGraph. ENT: maps entities, properties, invariants, and bounded contexts into an EntityMap. PRO: defines workflows, state machines, and HoareTriple contracts into a ProcessFlow. Each sub-stage produces its own PostcodeAddress.
**Bounded Context:** DomainModeling
**Interfaces:** modelDomain(graph: IntentGraph): DomainContext, mapEntities(domain: DomainContext): EntityMap, defineProcesses(entities: EntityMap, domain: DomainContext): ProcessFlow
**Dependencies:** ProvenanceTracker

### BlueprintSynthesizer
**Responsibility:** SYN stage. Merges EntityMap and ProcessFlow into a unified Blueprint containing architecture components, data model, and process model. Resolves conflicts between entity structure and process behavior (recording in resolvedConflicts). Ensures every Blueprint component traces to an upstream entity or workflow.
**Bounded Context:** Governance
**Interfaces:** synthesize(input: SynthesisInput): Blueprint, resolveConflicts(entities: EntityMap, processes: ProcessFlow): ResolvedConflict[], assembleArchitecture(entities: EntityMap, processes: ProcessFlow): BlueprintArchitecture
**Dependencies:** ProvenanceTracker

### Auditor
**Responsibility:** AUD stage. Evaluates the Blueprint for coverage (do all entities appear?), coherence (do components align with workflows?), and semantic drift. Produces an AuditReport with quantified scores. Critical drifts cause audit failure (auditReport.passed === false).
**Bounded Context:** Governance
**Interfaces:** audit(blueprint: Blueprint, entities: EntityMap, processes: ProcessFlow): AuditReport, measureCoverage(blueprint: Blueprint, entities: EntityMap): number, measureCoherence(blueprint: Blueprint, processes: ProcessFlow): number, detectDrifts(blueprint: Blueprint, entities: EntityMap, processes: ProcessFlow): SemanticDrift[]
**Dependencies:** ProvenanceTracker

### Governor
**Responsibility:** GOV stage — terminal authority. Evaluates the full pipeline state (AuditReport, ProvenanceGate pass rates, policy violations) and issues an ACCEPT, REJECT, or ITERATE decision. ACCEPT requires provenanceIntact === true and no critical policy violations. REJECT must include rejectionReasons. ITERATE triggers the governor-iteration-loop via PipelineOrchestrator. Drives the GovernorDecision state machine.
**Bounded Context:** Governance
**Interfaces:** evaluate(pipelineState: PipelineState, audit: AuditReport): GovernorDecision, checkPolicies(blueprint: Blueprint): PolicyViolation[], assessProvenance(gates: ProvenanceGate[]): number, emitSignal(decision: GovernorDecision): GovernorSignal
**Dependencies:** ProvenanceTracker

### ProvenanceTracker
**Responsibility:** Infrastructure service managing the provenance chain. Generates PostcodeAddresses (prefix=ML, hash, version), creates ProvenanceRecords at each stage, evaluates ProvenanceGates between stages (state machine: OPEN→EVALUATING→PASSED|FAILED), and validates end-to-end traceability from any artifact back to the original intent.
**Bounded Context:** Provenance
**Interfaces:** generatePostcode(stageCode: StageCode, content: string): PostcodeAddress, recordProvenance(postcode: PostcodeAddress, content: string): ProvenanceRecord, evaluateGate(from: PostcodeAddress, to: PostcodeAddress, entropyEstimate: number): ProvenanceGate, traceToIntent(postcode: PostcodeAddress): ProvenanceTrace, validateChain(records: ProvenanceRecord[]): boolean

### Verifier
**Responsibility:** Post-pipeline verification (G4). Compares built code against the accepted Blueprint to detect semantic drift between specification and implementation. Produces a VerificationReport with entity coverage, invariant coverage, and an overall score. Critical findings cause verification failure.
**Bounded Context:** Verification
**Interfaces:** verify(codebase: CodebaseSnapshot, blueprint: Blueprint, options?: VerifyOptions): VerificationReport, detectDrift(codebase: CodebaseSnapshot, blueprint: Blueprint): SemanticDrift[], measureEntityCoverage(codebase: CodebaseSnapshot, entities: EntityMap): number, measureInvariantCoverage(codebase: CodebaseSnapshot, entities: EntityMap): number
**Dependencies:** ProvenanceTracker

### CompileResultAssembler
**Responsibility:** Assembles the terminal CompileResult from the Governor's decision, the Blueprint (if accepted), iteration history, and fallback result (if max iterations exceeded without acceptance). Enforces C3: only ACCEPT produces a blueprint in the result; REJECT/ITERATE produce status-only results or fallback.
**Bounded Context:** Verification
**Interfaces:** assemble(decision: GovernorDecision, blueprint: Blueprint, iterations: IterationRecord[]): CompileResult, assembleFallback(iterations: IterationRecord[], lastBlueprint: Blueprint): FallbackBlueprintResult
**Dependencies:** Governor

### IterationManager
**Responsibility:** Implements the governor-iteration-loop workflow. Extracts iteration targets from GovernorDecision feedback, determines the checkpoint stage to replay from, tracks IterationRecords across loops, and enforces max iteration limits. Maps to @ada/int-rerun package (INTRerunPipeline, StatelessReRun).
**Bounded Context:** Pipeline
**Interfaces:** planIteration(decision: GovernorDecision, run: CompilationRun): INTRerunPipeline, recordIteration(run: CompilationRun, decision: GovernorDecision): IterationRecord, shouldContinue(iterations: IterationRecord[]): boolean, resolveDisambiguation(ambiguities: AmbiguitySet): DisambiguationPassResult
**Dependencies:** PipelineOrchestrator, ProvenanceTracker

### CLIInterface
**Responsibility:** CLI entry point (C2). Accepts raw intent string from stdin/args, forwards to PipelineOrchestrator, handles interactive clarification prompts (ClarificationRequest → user response), streams stage progress events (StageCompleteEvent), and emits the final CompileResult to stdout. Owns the user-facing contract.
**Bounded Context:** Pipeline
**Interfaces:** run(args: string[]): Promise<void>, promptClarification(request: ClarificationRequest): Promise<ClarificationAnswer>, emitProgress(event: StageCompleteEvent): void, emitResult(result: CompileResult): void
**Dependencies:** PipelineOrchestrator, AmbiguityResolver

### ConfigWriter
**Responsibility:** Generates agent configuration files (AgentFile, SkillFile, HookScript) from Blueprint specifications. Maps to @ada/config-writer package. Translates Blueprint architecture into Claude Code agent configuration graph.
**Bounded Context:** Governance
**Interfaces:** writeConfig(blueprint: Blueprint, options?: WriteConfigOptions): ConfigGraph, generateAgentFile(component: BlueprintComponent): AgentFile, generateSkillFile(workflow: Workflow): SkillFile
**Dependencies:** ProvenanceTracker

### MCPServer
**Responsibility:** Exposes ada's verification and workflow capabilities as MCP tools for consumption by other agents. Maps to @ada/mcp-server package. Provides verify, workflow-spec, and agent-file-spec endpoints.
**Bounded Context:** Verification
**Interfaces:** handleVerify(input: VerifyInput): VerifyResult, handleWorkflowSpec(input: WorkflowSpec): ProcessFlow, handleAgentFileSpec(input: AgentFileSpec): AgentFile
**Dependencies:** Verifier, ProvenanceTracker

## Invariants
Hooks enforce these at tool boundaries. Do not violate them.

### IntentGraph
- `intentGraph.rawIntent !== null && intentGraph.rawIntent.trim().length > 0` — raw intent must be non-empty — no empty-string compilations
- `intentGraph.goals.length > 0` — every intent must yield at least one goal
- `intentGraph.postcode.stage === 'INT'` — postcode stage must match INT stage
- `intentGraph.unknowns.filter(u => u.impact === 'blocking').length === 0 || clarificationsResolved === true` — blocking unknowns must be resolved before pipeline execution

### IntentGoal
- `intentGoal.id !== null && intentGoal.id.length > 0` — goal must have a stable identifier for provenance tracing
- `intentGoal.description !== null && intentGoal.description.trim().length > 0` — goal description must not be blank

### IntentUnknown
- `intentUnknown.id !== null && intentUnknown.id.length > 0` — unknown must have a stable id for clarification linkage
- `intentUnknown.impact !== null` — impact classification must be present to determine pipeline gate behaviour

### ClarificationRequest
- `clarificationRequest.unknownId !== null && clarificationRequest.unknownId.length > 0` — must reference an existing IntentUnknown by id
- `clarificationRequest.question !== null && clarificationRequest.question.trim().length > 0` — question text must be non-empty before surfacing to user
- `clarificationRequest.impact === 'blocking' ? clarificationRequest.suggestedDefault === null : true` — blocking clarifications must not carry a suggested default — they require explicit user resolution

### Pipeline
- `pipeline.stageCount === 7` — pipeline must contain exactly 7 stages — no more, no fewer
- `pipeline.stages.length === 7` — stages array must have exactly 7 elements
- `pipeline.stages[6] === 'GOV'` — final stage must always be the Governor

### StageExecutionRecord
- `stageExecutionRecord.metadata.temperature >= 0 && stageExecutionRecord.metadata.temperature <= 1` — temperature must be in [0,1] for determinism metadata to be valid
- `stageExecutionRecord.postcode.stage === stageExecutionRecord.stageCode` — postcode stage tag must match the recorded stage code
- `stageExecutionRecord.metadata.retryCount >= 0` — retry count must be non-negative

### DeterminismMetadata
- `determinismMetadata.modelId !== null && determinismMetadata.modelId.length > 0` — model id must be recorded to make a run reproducible
- `determinismMetadata.maxTokens > 0` — max tokens must be positive
- `determinismMetadata.callDurationMs >= 0` — call duration must be non-negative

### CompilationRun
- `compilationRun.runId !== null && compilationRun.runId.length > 0` — run must have a unique identifier
- `compilationRun.completedAt >= compilationRun.startedAt` — completion timestamp must not precede start timestamp
- `compilationRun.sourceIntent !== null && compilationRun.sourceIntent.trim().length > 0` — run must preserve the original raw intent for provenance
- `compilationRun.stages.length <= 7` — a run may record at most 7 stage executions

### PipelineState
- `pipelineState.cumulativeEntropy >= 0 && pipelineState.cumulativeEntropy <= 1` — cumulative entropy must remain in [0,1]
- `pipelineState.governor !== null ? pipelineState.synthesis !== null : true` — governor decision cannot exist without a synthesis (Blueprint) artifact
- `pipelineState.entity !== null ? pipelineState.persona !== null : true` — EntityMap cannot exist without prior DomainContext — stages must be sequential

### ProvenanceGate
- `provenanceGate.fromPostcode !== null && provenanceGate.fromPostcode.length > 0` — gate must identify its upstream stage postcode
- `provenanceGate.toPostcode !== null && provenanceGate.toPostcode.length > 0` — gate must identify its downstream stage postcode
- `provenanceGate.entropyEstimate >= 0 && provenanceGate.entropyEstimate <= 1` — entropy estimate must be a probability in [0,1]
- `provenanceGate.fromPostcode !== provenanceGate.toPostcode` — a gate must connect two distinct stages — self-loops are not permitted

### DomainContext
- `domainContext.domain !== null && domainContext.domain.trim().length > 0` — domain must be named — unnamed domains cannot produce valid ubiquitous language
- `Object.keys(domainContext.ubiquitousLanguage).length > 0` — domain context must define at least one ubiquitous language term
- `domainContext.postcode.stage === 'PER'` — domain context postcode must carry the PER stage tag

### EntityMap
- `entityMap.entities.length > 0` — every domain must yield at least one entity
- `entityMap.boundedContexts.length > 0` — entities must be grouped into at least one bounded context
- `entityMap.boundedContexts.every(bc => entityMap.entities.some(e => e.name === bc.rootEntity))` — every bounded context's rootEntity must exist in the entities list
- `entityMap.postcode.stage === 'ENT'` — entity map postcode must carry the ENT stage tag

### Entity
- `entity.name !== null && entity.name.trim().length > 0` — entity must have a non-empty name
- `entity.properties.length >= 1` — entity must have at least one property — structureless entities are not permitted
- `entity.invariants.length >= 1` — entity must declare at least one invariant — unconstrained entities are not permitted

### ProcessFlow
- `processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0` — process model must contain at least one workflow or state machine
- `processFlow.postcode.stage === 'PRO'` — process flow postcode must carry the PRO stage tag
- `processFlow.stateMachines.every(sm => sm.states.length >= 2)` — every state machine must have at least two states — a single-state machine has no transitions

### Blueprint
- `blueprint.summary !== null && blueprint.summary.trim().length > 0` — blueprint must carry a non-empty summary
- `blueprint.dataModel !== null` — blueprint must embed a data model — a blueprint without entities is structurally incomplete
- `blueprint.processModel !== null` — blueprint must embed a process model — a blueprint without processes is behaviourally incomplete
- `blueprint.postcode.stage === 'SYN'` — blueprint postcode must carry the SYN stage tag
- `blueprint.architecture.components.length > 0` — blueprint architecture must define at least one component

### AuditReport
- `auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1` — coverage score must be a ratio in [0,1]
- `auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1` — coherence score must be a ratio in [0,1]
- `auditReport.passed === true ? auditReport.drifts.filter(d => d.severity === 'critical').length === 0 : true` — a passed audit must have zero critical drifts
- `auditReport.postcode.stage === 'AUD'` — audit report postcode must carry the AUD stage tag

### GovernorDecision
- `governorDecision.confidence >= 0 && governorDecision.confidence <= 1` — confidence must be a probability in [0,1]
- `governorDecision.decision === 'REJECT' ? governorDecision.rejectionReasons.length > 0 : true` — a REJECT decision must carry at least one rejection reason
- `governorDecision.decision === 'ACCEPT' ? governorDecision.provenanceIntact === true : true` — Governor may only ACCEPT when provenance chain is intact
- `governorDecision.gatePassRate >= 0 && governorDecision.gatePassRate <= 1` — gate pass rate must be in [0,1]
- `governorDecision.postcode.stage === 'GOV'` — governor decision postcode must carry the GOV stage tag

### PolicyViolation
- `policyViolation.ruleViolated !== null && policyViolation.ruleViolated.trim().length > 0` — violation must name the rule that was broken
- `policyViolation.description !== null && policyViolation.description.trim().length > 0` — violation description must be non-empty

### SemanticDrift
- `semanticDrift.location !== null && semanticDrift.location.trim().length > 0` — drift must identify the file or artifact location where divergence was detected
- `semanticDrift.original !== semanticDrift.actual` — original and actual must differ — identical values do not constitute drift
- `semanticDrift.original !== null && semanticDrift.original.trim().length > 0` — original blueprint intent must be recorded for the drift to be traceable

### VerificationReport
- `verificationReport.entityCoverage >= 0 && verificationReport.entityCoverage <= 1` — entity coverage must be a ratio in [0,1]
- `verificationReport.invariantCoverage >= 0 && verificationReport.invariantCoverage <= 1` — invariant coverage must be a ratio in [0,1]
- `verificationReport.overallScore >= 0 && verificationReport.overallScore <= 1` — overall score must be a ratio in [0,1]
- `verificationReport.blueprintPostcode !== null && verificationReport.blueprintPostcode.length > 0` — verification report must reference the Blueprint postcode it was generated against
- `verificationReport.passed === true ? verificationReport.findings.filter(f => f.severity === 'critical').length === 0 : true` — a passing verification report must have no critical findings

### ProvenanceRecord
- `provenanceRecord.postcode !== null && provenanceRecord.postcode.length > 0` — provenance record must carry a postcode
- `provenanceRecord.content !== null && provenanceRecord.content.trim().length > 0` — record content must not be empty — empty records break the chain
- `provenanceRecord.timestamp > 0` — timestamp must be a positive epoch value

### IterationRecord
- `iterationRecord.iterationNumber >= 1` — iteration number must be positive — there is no zeroth iteration
- `iterationRecord.coverageScore >= 0 && iterationRecord.coverageScore <= 1` — coverage score must be in [0,1]
- `iterationRecord.governorDecision !== null` — every iteration must record the governor decision that closed it

### CompileResult
- `compileResult.blueprint !== null` — compile result must always carry a blueprint — even a rejected run holds the last blueprint for inspection
- `compileResult.governorDecision !== null` — compile result must record the terminal governor decision
- `compileResult.iterationCount >= 1` — at least one pipeline iteration must have occurred
- `compileResult.status === 'accepted' ? compileResult.governorDecision.decision === 'ACCEPT' : true` — status 'accepted' may only be set when GovernorDecision is ACCEPT
- `compileResult.fallback !== null ? compileResult.status !== 'accepted' : true` — a fallback result is only present when the compile did not reach ACCEPT

### PostcodeAddress
- `postcodeAddress.prefix === 'ML'` — all postcodes must carry the ML namespace prefix
- `postcodeAddress.hash !== null && postcodeAddress.hash.length > 0` — hash must be non-empty — it is the content fingerprint of the artifact
- `postcodeAddress.version >= 1` — version must be at least 1
- `postcodeAddress.raw !== null && postcodeAddress.raw.startsWith('ML')` — raw postcode string must start with the ML prefix

## Workflows
### semantic-compilation-pipeline
**Trigger:** user submits raw intent string via CLI

**parse-intent-graph** (enables)
- Pre: rawIntent is non-empty string and DeterminismMetadata is initialised with frozen modelId and temperature=0
- Action: LLM parses rawIntent into IntentGraph with goals, constraints, unknowns, and assigns postcode
- Post: IntentGraph.postcode is set, IntentGraph.goals is non-empty, all IntentUnknowns have impact classification
- Failure (precondition): rawIntent is blank or whitespace-only → emit ParseError and halt pipeline; prompt user for non-empty input
- Failure (action): LLM returns malformed JSON that does not conform to IntentGraph schema → retry up to DeterminismMetadata.retryCount then emit SchemaViolation and halt
- Failure (postcondition): IntentGraph.goals is empty after parsing — intent was too vague → trigger ambiguity-resolution workflow before continuing

**evaluate-ambiguity-gate** (guards)
- Pre: IntentGraph is present and postcode is set
- Action: inspect IntentGraph.unknowns; for each unknown with impact=blocking generate a ClarificationRequest with suggestedDefault
- Post: all blocking unknowns have a ClarificationRequest assigned, or zero blocking unknowns exist
- Failure (action): unknown has impact=blocking but no suggestedDefault can be derived → surface ClarificationRequest to user without default; pause pipeline in AWAITING_CLARIFICATION state
- Failure (postcondition): clarification loop exceeds 3 iterations without resolving all blocking unknowns → emit AmbiguityResolutionFailure and halt; record unresolved unknowns in CompilationRun

**model-domain** (requires)
- Pre: IntentGraph.postcode is set and zero blocking unknowns remain unresolved
- Action: derive DomainContext from IntentGraph: identify domain, stakeholders, ubiquitousLanguage, and excludedConcerns; open ProvenanceGate from IntentGraph.postcode
- Post: DomainContext.postcode is set and references IntentGraph.postcode as parent; ProvenanceGate PASSED with entropyEstimate < threshold
- Failure (precondition): IntentGraph.postcode is absent — upstream step did not complete → halt with PipelineOrderViolation; do not execute this step
- Failure (action): domain cannot be distinguished from IntentGraph — stakeholders collapse to a single generic actor → generate ClarificationRequest for domain boundary; pause and await user input
- Failure (postcondition): ProvenanceGate entropy exceeds threshold — DomainContext diverges semantically from IntentGraph → fail gate; log entropyEstimate to PipelineState.cumulativeEntropy; trigger ambiguity-resolution on the delta

**map-entities** (requires)
- Pre: DomainContext.postcode is set and ProvenanceGate from model-domain has PASSED
- Action: derive EntityMap from DomainContext: enumerate entities with properties, classify boundedContexts, open ProvenanceGate from DomainContext.postcode
- Post: EntityMap.entities is non-empty, each entity belongs to exactly one boundedContext, EntityMap.postcode set, ProvenanceGate PASSED
- Failure (precondition): prior ProvenanceGate is in FAILED state → block execution; emit GateBlockedError with gateId reference
- Failure (action): entity extracted has no properties — degenerate entity produced → flag entity as incomplete in EntityMap.challenges; continue but mark EntityMap as degraded
- Failure (postcondition): entity appears in multiple boundedContexts — context boundary is ambiguous → emit ContextConflict challenge; halt if conflict count > 2, else log and continue

**define-process** (requires)
- Pre: EntityMap.postcode is set, EntityMap is not degraded, ProvenanceGate from map-entities has PASSED
- Action: derive ProcessFlow from EntityMap: define workflows, state machines, temporal relations, and failure modes for all entities with lifecycle states; open ProvenanceGate from EntityMap.postcode
- Post: ProcessFlow covers every entity in EntityMap, all stateful entities have at least one state machine, ProvenanceGate PASSED
- Failure (precondition): EntityMap.degraded is true — incomplete entities cannot produce complete process definitions → halt with DegradedInputError; require EntityMap remediation before proceeding
- Failure (action): state machine produced has unreachable terminal states — entity can enter a state it can never exit → emit DeadlockRisk challenge; flag affected state machine in ProcessFlow.challenges
- Failure (postcondition): ProcessFlow contains no workflows — all behaviours are stateless queries with no side effects → emit EmptyProcessWarning; continue only if IntentGraph confirms this is intentional via a constraint

**synthesize-blueprint** (requires)
- Pre: DomainContext, EntityMap, and ProcessFlow all have postcodes set and all their ProvenanceGates have PASSED
- Action: merge DomainContext, EntityMap, and ProcessFlow into a unified Blueprint; assign Blueprint.postcode derived from all three parent postcodes; record DeterminismMetadata snapshot
- Post: Blueprint is internally consistent, all cross-references between entities and workflows resolve, Blueprint.postcode encodes all parent postcodes
- Failure (precondition): any of the three input postcodes is absent — a required stage was skipped → emit IncompleteInputError listing which postcodes are missing; halt
- Failure (action): a ProcessFlow workflow references an entity not present in EntityMap → emit DanglingReferenceError for the missing entity; halt synthesis
- Failure (postcondition): Blueprint.postcode does not encode all three parent postcodes — provenance chain is broken → invalidate Blueprint; re-derive postcode from parent postcodes and retry once

**audit-blueprint** (enables)
- Pre: Blueprint is present with valid postcode and all cross-references resolved
- Action: run policy checks against Blueprint: verify provenance chain is unbroken, cumulativeEntropy is below ceiling, no unchallenged DeadlockRisk or ContextConflict exists; produce AuditReport with all PolicyViolations
- Post: AuditReport is complete with PASS or FAIL verdict; every PolicyViolation has a severity (blocking | advisory) and a reference to the Blueprint element that triggered it
- Failure (precondition): Blueprint postcode is absent or malformed → emit AuditInputError; do not produce AuditReport
- Failure (action): audit policy set is empty — no rules loaded → emit EmptyPolicySetError and halt; governance without policies is undefined behaviour
- Failure (postcondition): AuditReport references a Blueprint element id that does not exist in Blueprint → emit AuditCorruptionError; invalidate AuditReport and rerun audit

**govern-blueprint** (guards)
- Pre: AuditReport is present with verdict PASS or FAIL and all blocking violations are resolved or explicitly accepted by policy
- Action: Governor evaluates AuditReport and emits GovernorDecision: ACCEPT if no blocking violations, REJECT if violations are unresolvable, ITERATE if violations are resolvable by re-running from a specific stage
- Post: GovernorDecision is one of {ACCEPT, REJECT, ITERATE}; if ITERATE, decision includes reentryStage and violationIds; if ACCEPT, Blueprint is emitted as final output with CompilationRun sealed
- Failure (precondition): AuditReport verdict is absent — audit step did not complete → emit GovernorBlockedError; do not emit any GovernorDecision
- Failure (action): Governor cannot determine reentryStage for an ITERATE decision — violation does not map to a known stage → escalate to REJECT to avoid infinite iteration loop; log unmapped violationId
- Failure (postcondition): GovernorDecision is ITERATE but reentryStage is the current (last) stage — would cause infinite loop → reclassify as REJECT; emit IterationLoopGuardTriggered event

### governor-iteration-loop
**Trigger:** GovernorDecision.verdict is ITERATE

**extract-iteration-target** (enables)
- Pre: GovernorDecision.verdict is ITERATE and GovernorDecision.reentryStage is a valid stage code
- Action: read GovernorDecision.violationIds and reentryStage; load the PipelineState snapshot captured at reentryStage; create IterationRecord with iterationNumber incremented from prior count
- Post: IterationRecord exists with iterationNumber, reentryStage, violationIds, and a reference to the originating CompilationRun.runId
- Failure (precondition): reentryStage code does not match any StageExecutionRecord in CompilationRun.stages → emit InvalidReentryStageError; escalate GovernorDecision to REJECT
- Failure (action): PipelineState snapshot at reentryStage is missing or corrupted → emit SnapshotMissingError; attempt full pipeline rerun from stage 1; if iterationNumber > 3 escalate to REJECT
- Failure (postcondition): iterationNumber exceeds ceiling (default 5) — runaway iteration detected → emit MaxIterationsExceeded; force GovernorDecision to REJECT; seal CompilationRun as FAILED

**replay-pipeline-from-checkpoint** (requires)
- Pre: IterationRecord is present with valid reentryStage and iterationNumber is within ceiling
- Action: restore PipelineState to snapshot at reentryStage; re-execute all stages from reentryStage onward using the same DeterminismMetadata (modelId, temperature); accumulate new StageExecutionRecords under the same CompilationRun.runId
- Post: all stages from reentryStage to govern-blueprint have new StageExecutionRecords; PipelineState.cumulativeEntropy is updated; a new AuditReport and GovernorDecision are produced
- Failure (precondition): DeterminismMetadata from original run is unavailable — cannot guarantee determinism → emit DeterminismBreachWarning; log divergence; continue with current DeterminismMetadata but flag CompilationRun as non-deterministic
- Failure (action): replay produces identical violations as the prior run — no progress made → detect by comparing violationIds sets; if identical emit IterationStalemate and escalate to REJECT
- Failure (postcondition): new GovernorDecision is again ITERATE targeting the same reentryStage as before → treat as IterationStalemate; escalate to REJECT; seal CompilationRun as FAILED

**seal-compilation-run** (compensates)
- Pre: GovernorDecision.verdict is ACCEPT or REJECT (not ITERATE)
- Action: set CompilationRun.completedAt to current timestamp; compute CompilationRun.totalDurationMs; attach final GovernorDecision, AuditReport, and Blueprint (if ACCEPT) or null Blueprint (if REJECT); write CompilationRun to provenance store
- Post: CompilationRun is immutable and retrievable by runId; if ACCEPT then Blueprint is the authoritative output; if REJECT then CompilationRun.stages contains the full failure trace
- Failure (precondition): GovernorDecision.verdict is still ITERATE — seal called prematurely → emit PrematureSealError; do not write CompilationRun; return control to replay loop
- Failure (action): provenance store write fails — CompilationRun is produced but not persisted → emit ProvenancePersistenceFailure; surface to user with CompilationRun payload so they can persist manually
- Failure (postcondition): CompilationRun retrieved by runId does not match the in-memory record — write corruption → emit ProvenanceCorruptionAlert; mark runId as suspect; require user confirmation before treating Blueprint as trusted output

### ambiguity-resolution
**Trigger:** evaluate-ambiguity-gate finds one or more blocking IntentUnknowns

**generate-clarification-requests** (enables)
- Pre: IntentGraph.unknowns contains at least one unknown with impact=blocking
- Action: for each blocking unknown derive a ClarificationRequest with question, impact, and suggestedDefault (if derivable from IntentGraph.constraints); assign each ClarificationRequest.unknownId
- Post: every blocking unknown has exactly one ClarificationRequest; ClarificationRequests without suggestedDefault are flagged as mandatory
- Failure (precondition): unknowns list is empty — gate should not have triggered → emit SpuriousTriggerWarning; resume pipeline without generating requests
- Failure (action): two ClarificationRequests are generated for the same unknownId — duplicate questions → deduplicate by unknownId; keep the one with a suggestedDefault if both are otherwise equal
- Failure (postcondition): a blocking unknown has no ClarificationRequest — unknown was silently dropped → emit UnknownDroppedError; halt; do not proceed until all blocking unknowns are covered

**collect-responses-or-apply-defaults** (requires)
- Pre: all blocking unknowns have a ClarificationRequest; pipeline state is AWAITING_CLARIFICATION
- Action: present mandatory ClarificationRequests to user and collect responses; for non-mandatory requests apply suggestedDefault if user provides no response within timeout; record each resolution with its source (user | default)
- Post: every ClarificationRequest has a resolution with a non-null answer and source annotation
- Failure (precondition): pipeline state is not AWAITING_CLARIFICATION — clarification was triggered in wrong state → emit StateViolationError; do not present questions to user; halt
- Failure (action): user provides a response that contradicts an existing IntentGraph.constraint → emit ConflictingResolutionWarning; surface conflict to user and ask them to choose: keep constraint or override with new response
- Failure (postcondition): a mandatory ClarificationRequest has no resolution after timeout — user did not respond and no default exists → emit ResolutionTimeoutError; halt pipeline; preserve PipelineState so user can resume

**merge-resolutions-into-intent-graph** (enables)
- Pre: all ClarificationRequests have resolutions with source annotations
- Action: apply each resolution to its corresponding IntentUnknown in IntentGraph; promote resolved unknowns to IntentGraph.constraints if source=user or to IntentGraph.goals if resolution implies a new goal; recompute IntentGraph.postcode
- Post: IntentGraph contains no blocking unknowns; IntentGraph.postcode has changed to reflect incorporated resolutions; pipeline state transitions to RUNNING
- Failure (precondition): a ClarificationRequest.unknownId does not match any IntentGraph.unknowns entry → emit OrphanedResolutionError; discard orphaned resolution; log for audit
- Failure (action): recomputed IntentGraph.postcode is identical to the pre-resolution postcode — resolutions had no semantic effect → emit NullResolutionWarning; treat as non-blocking; allow pipeline to continue but log the anomaly
- Failure (postcondition): IntentGraph still contains blocking unknowns after merge — merge was incomplete → emit MergeIncompleteError; re-enter clarification loop; increment clarification iteration counter; halt if counter > 3

## State Machines
### CompilationRun
**States:** PENDING → PARSING → AWAITING_CLARIFICATION → RUNNING → AUDITING → GOVERNING → ITERATING → ACCEPTED → REJECTED → FAILED
- PENDING → PARSING (trigger: pipeline execution begins, guard: rawIntent is non-empty and DeterminismMetadata is initialised)
- PARSING → AWAITING_CLARIFICATION (trigger: evaluate-ambiguity-gate finds blocking unknowns, guard: at least one ClarificationRequest is mandatory)
- PARSING → RUNNING (trigger: evaluate-ambiguity-gate finds no blocking unknowns, guard: IntentGraph.goals is non-empty)
- AWAITING_CLARIFICATION → RUNNING (trigger: all blocking unknowns resolved, guard: IntentGraph contains no blocking unknowns after merge)
- AWAITING_CLARIFICATION → FAILED (trigger: resolution timeout or clarification iteration > 3, guard: mandatory ClarificationRequest has no resolution)
- RUNNING → AUDITING (trigger: synthesize-blueprint completes, guard: Blueprint.postcode is set and all cross-references resolve)
- RUNNING → FAILED (trigger: any stage emits a halting error, guard: error class is precondition or unrecoverable action failure)
- AUDITING → GOVERNING (trigger: AuditReport produced, guard: AuditReport.verdict is PASS or FAIL)
- GOVERNING → ACCEPTED (trigger: GovernorDecision is ACCEPT, guard: AuditReport has no unresolved blocking violations)
- GOVERNING → REJECTED (trigger: GovernorDecision is REJECT, guard: violations are unresolvable or max iterations reached)
- GOVERNING → ITERATING (trigger: GovernorDecision is ITERATE, guard: reentryStage is valid and iterationNumber < ceiling)
- ITERATING → RUNNING (trigger: replay-pipeline-from-checkpoint begins, guard: PipelineState snapshot at reentryStage is available)
- ITERATING → REJECTED (trigger: IterationStalemate or MaxIterationsExceeded detected, guard: violationIds in new run are identical to prior run or iterationNumber >= ceiling)

### ProvenanceGate
**States:** OPEN → EVALUATING → PASSED → FAILED
- OPEN → EVALUATING (trigger: stage produces output postcode and requests gate evaluation, guard: fromPostcode and toPostcode are both set)
- EVALUATING → PASSED (trigger: entropy check completes, guard: entropyEstimate < configured threshold and no unresolved challenges)
- EVALUATING → FAILED (trigger: entropy check completes, guard: entropyEstimate >= threshold or at least one unresolved blocking challenge exists)
- FAILED → OPEN (trigger: pipeline resets gate for iteration, guard: CompilationRun is in ITERATING state and reentryStage precedes this gate's stage)

### GovernorDecision
**States:** PENDING → REVIEWING → ACCEPTED → REJECTED → ITERATING
- PENDING → REVIEWING (trigger: AuditReport is submitted to Governor, guard: AuditReport is present and non-null)
- REVIEWING → ACCEPTED (trigger: Governor evaluation completes, guard: no blocking PolicyViolations in AuditReport)
- REVIEWING → REJECTED (trigger: Governor evaluation completes, guard: blocking PolicyViolations exist and none map to a resolvable reentryStage)
- REVIEWING → ITERATING (trigger: Governor evaluation completes, guard: blocking PolicyViolations exist and all map to a valid reentryStage and iterationNumber < ceiling)
- ITERATING → PENDING (trigger: replay produces new AuditReport, guard: CompilationRun.iterationNumber has incremented)
- ITERATING → REJECTED (trigger: IterationLoopGuard fires, guard: reentryStage resolves to current stage or iterationNumber >= ceiling)

### Pipeline
**States:** IDLE → EXECUTING → AWAITING_CLARIFICATION → CHECKPOINTED → COMPLETED → FAILED
- IDLE → EXECUTING (trigger: CompilationRun created and first stage begins, guard: DeterminismMetadata is frozen and rawIntent is non-empty)
- EXECUTING → AWAITING_CLARIFICATION (trigger: evaluate-ambiguity-gate emits mandatory ClarificationRequests, guard: at least one ClarificationRequest has no suggestedDefault)
- AWAITING_CLARIFICATION → EXECUTING (trigger: all resolutions merged into IntentGraph, guard: no blocking unknowns remain)
- EXECUTING → CHECKPOINTED (trigger: GovernorDecision is ITERATE, guard: reentryStage is valid and iterationNumber < ceiling)
- CHECKPOINTED → EXECUTING (trigger: replay-pipeline-from-checkpoint begins, guard: PipelineState snapshot is available at reentryStage)
- EXECUTING → COMPLETED (trigger: govern-blueprint emits ACCEPT, guard: CompilationRun is sealed with Blueprint attached)
- EXECUTING → FAILED (trigger: any stage emits halting error or GovernorDecision is REJECT, guard: CompilationRun is sealed without Blueprint)
- AWAITING_CLARIFICATION → FAILED (trigger: ResolutionTimeoutError emitted, guard: mandatory ClarificationRequest unresolved after timeout)

### IntentUnknown
**States:** DETECTED → PENDING_CLARIFICATION → RESOLVED_BY_USER → RESOLVED_BY_DEFAULT → UNRESOLVABLE
- DETECTED → PENDING_CLARIFICATION (trigger: ClarificationRequest generated for this unknown, guard: unknown.impact is blocking)
- DETECTED → RESOLVED_BY_DEFAULT (trigger: suggestedDefault applied without user prompt, guard: unknown.impact is not blocking and suggestedDefault is non-null)
- PENDING_CLARIFICATION → RESOLVED_BY_USER (trigger: user submits response to ClarificationRequest, guard: response is non-empty and does not conflict with IntentGraph.constraints)
- PENDING_CLARIFICATION → RESOLVED_BY_DEFAULT (trigger: timeout expires and suggestedDefault exists, guard: unknown.impact is not mandatory or user has approved default use)
- PENDING_CLARIFICATION → UNRESOLVABLE (trigger: timeout expires with no response and no suggestedDefault, guard: unknown.impact is blocking)
- UNRESOLVABLE → PENDING_CLARIFICATION (trigger: user resumes pipeline session and provides response, guard: CompilationRun is still in AWAITING_CLARIFICATION and iteration count < 3)

## Build Order
1. ProvenanceTracker (Provenance)
2. IntentParser (Intent)
3. DomainModeler (DomainModeling)
4. BlueprintSynthesizer (Governance)
5. Auditor (Governance)
6. Governor (Governance)
7. StageExecutor (Pipeline)
8. PipelineOrchestrator (Pipeline)
9. CLIInterface (Pipeline)
10. AmbiguityResolver (Intent)
11. Verifier (Verification)
12. CompileResultAssembler (Verification)
13. IterationManager (Pipeline)
14. ConfigWriter (Governance)
15. MCPServer (Verification)

## Done
- [ ] TypeScript strict mode with noImplicitAny — all packages compiled to dist/ with declaration files
- [ ] Node.js >= 18 runtime requirement
- [ ] pnpm monorepo with workspace protocol for inter-package dependencies
- [ ] Anthropic API models only — DeterminismMetadata.modelId must reference a valid Claude model
- [ ] Temperature pinned at 0 for all compilation stages to maximize determinism (G8)
- [ ] ProvenanceGate entropy must monotonically decrease through pipeline stages — cumulative entropy in [0,1]
- [ ] Governor ACCEPT is the sole gate for Blueprint emission — REJECT/ITERATE must never produce a final artifact (C3)
- [ ] All PostcodeAddresses must carry prefix 'ML' and a content-derived hash for traceability (C4)
- [ ] CLI must support both interactive mode (clarification prompts) and non-interactive mode (apply defaults for non-blocking unknowns)
- [ ] Maximum iteration count must be bounded to prevent infinite governor-iteration loops
- [ ] Stage execution must capture full DeterminismMetadata including callDurationMs for reproducibility auditing
- [ ] Excavation principle enforced: Blueprint components must trace to upstream entities/workflows — synthesizer must reject untraceable components (C6)
- [ ] IntentGraph.postcode is set, IntentGraph.goals is non-empty, all IntentUnknowns have impact classification
- [ ] all blocking unknowns have a ClarificationRequest assigned, or zero blocking unknowns exist
- [ ] DomainContext.postcode is set and references IntentGraph.postcode as parent; ProvenanceGate PASSED with entropyEstimate < threshold
- [ ] EntityMap.entities is non-empty, each entity belongs to exactly one boundedContext, EntityMap.postcode set, ProvenanceGate PASSED
- [ ] ProcessFlow covers every entity in EntityMap, all stateful entities have at least one state machine, ProvenanceGate PASSED
- [ ] Blueprint is internally consistent, all cross-references between entities and workflows resolve, Blueprint.postcode encodes all parent postcodes
- [ ] AuditReport is complete with PASS or FAIL verdict; every PolicyViolation has a severity (blocking | advisory) and a reference to the Blueprint element that triggered it
- [ ] GovernorDecision is one of {ACCEPT, REJECT, ITERATE}; if ITERATE, decision includes reentryStage and violationIds; if ACCEPT, Blueprint is emitted as final output with CompilationRun sealed
- [ ] IterationRecord exists with iterationNumber, reentryStage, violationIds, and a reference to the originating CompilationRun.runId
- [ ] all stages from reentryStage to govern-blueprint have new StageExecutionRecords; PipelineState.cumulativeEntropy is updated; a new AuditReport and GovernorDecision are produced
- [ ] CompilationRun is immutable and retrievable by runId; if ACCEPT then Blueprint is the authoritative output; if REJECT then CompilationRun.stages contains the full failure trace
- [ ] every blocking unknown has exactly one ClarificationRequest; ClarificationRequests without suggestedDefault are flagged as mandatory
- [ ] every ClarificationRequest has a resolution with a non-null answer and source annotation
- [ ] IntentGraph contains no blocking unknowns; IntentGraph.postcode has changed to reflect incorporated resolutions; pipeline state transitions to RUNNING

## This Session
You are the lead agent. Follow this protocol:
1. Read this file fully
2. Read all agent files in `.claude/agents/`
3. Delegate to specialist agents by bounded context, in build order
4. After each agent completes, verify its postconditions
5. Do not proceed to the next step until postconditions are met
