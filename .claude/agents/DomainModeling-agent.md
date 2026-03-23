---
name: DomainModeling-agent
description: Use when implements three pipeline stages (per, ent, pro). per: extracts domaincontext with ubiquitous language from the intentgraph. ent: maps entities, properties, invariants, and bounded contexts into an entitymap. pro: defines workflows, state machines, and hoaretriple contracts into a processflow. each sub-stage produces its own postcodeaddress. tasks arise in the DomainModeling domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# DomainModeler Agent

Implements three pipeline stages (PER, ENT, PRO). PER: extracts DomainContext with ubiquitous language from the IntentGraph. ENT: maps entities, properties, invariants, and bounded contexts into an EntityMap. PRO: defines workflows, state machines, and HoareTriple contracts into a ProcessFlow. Each sub-stage produces its own PostcodeAddress.

## Bounded Context
**Context:** DomainModeling
**Entities:** DomainContext, EntityMap, Entity, ProcessFlow
**Interfaces:** modelDomain(graph: IntentGraph): DomainContext, mapEntities(domain: DomainContext): EntityMap, defineProcesses(entities: EntityMap, domain: DomainContext): ProcessFlow
**Dependencies:** ProvenanceTracker

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `domainModelingContext.entityMap.entities.every(e => e.invariants.length >= 1)` — every entity in the map must have at least one invariant — invariant-free entities violate Excavation
- `domainModelingContext.entityMap.boundedContexts.every(bc => bc.entities.every(eName => domainModelingContext.entityMap.entities.some(e => e.name === eName)))` — all entity names referenced by bounded contexts must exist in the entity map
- `domainContext.domain !== null && domainContext.domain.trim().length > 0` (DomainContext) — domain must be named — unnamed domains cannot produce valid ubiquitous language
- `Object.keys(domainContext.ubiquitousLanguage).length > 0` (DomainContext) — domain context must define at least one ubiquitous language term
- `domainContext.postcode.stage === 'PER'` (DomainContext) — domain context postcode must carry the PER stage tag
- `entityMap.entities.length > 0` (EntityMap) — every domain must yield at least one entity
- `entityMap.boundedContexts.length > 0` (EntityMap) — entities must be grouped into at least one bounded context
- `entityMap.boundedContexts.every(bc => entityMap.entities.some(e => e.name === bc.rootEntity))` (EntityMap) — every bounded context's rootEntity must exist in the entities list
- `entityMap.postcode.stage === 'ENT'` (EntityMap) — entity map postcode must carry the ENT stage tag
- `entity.name !== null && entity.name.trim().length > 0` (Entity) — entity must have a non-empty name
- `entity.properties.length >= 1` (Entity) — entity must have at least one property — structureless entities are not permitted
- `entity.invariants.length >= 1` (Entity) — entity must declare at least one invariant — unconstrained entities are not permitted
- `processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0` (ProcessFlow) — process model must contain at least one workflow or state machine
- `processFlow.postcode.stage === 'PRO'` (ProcessFlow) — process flow postcode must carry the PRO stage tag
- `processFlow.stateMachines.every(sm => sm.states.length >= 2)` (ProcessFlow) — every state machine must have at least two states — a single-state machine has no transitions

## Workflow Steps
### parse-intent-graph (semantic-compilation-pipeline)
- **Pre:** rawIntent is non-empty string and DeterminismMetadata is initialised with frozen modelId and temperature=0
- **Action:** LLM parses rawIntent into IntentGraph with goals, constraints, unknowns, and assigns postcode
- **Post:** IntentGraph.postcode is set, IntentGraph.goals is non-empty, all IntentUnknowns have impact classification
- **Failure modes:**
  - precondition: rawIntent is blank or whitespace-only → emit ParseError and halt pipeline; prompt user for non-empty input
  - action: LLM returns malformed JSON that does not conform to IntentGraph schema → retry up to DeterminismMetadata.retryCount then emit SchemaViolation and halt
  - postcondition: IntentGraph.goals is empty after parsing — intent was too vague → trigger ambiguity-resolution workflow before continuing

### evaluate-ambiguity-gate (semantic-compilation-pipeline)
- **Pre:** IntentGraph is present and postcode is set
- **Action:** inspect IntentGraph.unknowns; for each unknown with impact=blocking generate a ClarificationRequest with suggestedDefault
- **Post:** all blocking unknowns have a ClarificationRequest assigned, or zero blocking unknowns exist
- **Failure modes:**
  - action: unknown has impact=blocking but no suggestedDefault can be derived → surface ClarificationRequest to user without default; pause pipeline in AWAITING_CLARIFICATION state
  - postcondition: clarification loop exceeds 3 iterations without resolving all blocking unknowns → emit AmbiguityResolutionFailure and halt; record unresolved unknowns in CompilationRun

### model-domain (semantic-compilation-pipeline)
- **Pre:** IntentGraph.postcode is set and zero blocking unknowns remain unresolved
- **Action:** derive DomainContext from IntentGraph: identify domain, stakeholders, ubiquitousLanguage, and excludedConcerns; open ProvenanceGate from IntentGraph.postcode
- **Post:** DomainContext.postcode is set and references IntentGraph.postcode as parent; ProvenanceGate PASSED with entropyEstimate < threshold
- **Failure modes:**
  - precondition: IntentGraph.postcode is absent — upstream step did not complete → halt with PipelineOrderViolation; do not execute this step
  - action: domain cannot be distinguished from IntentGraph — stakeholders collapse to a single generic actor → generate ClarificationRequest for domain boundary; pause and await user input
  - postcondition: ProvenanceGate entropy exceeds threshold — DomainContext diverges semantically from IntentGraph → fail gate; log entropyEstimate to PipelineState.cumulativeEntropy; trigger ambiguity-resolution on the delta

### map-entities (semantic-compilation-pipeline)
- **Pre:** DomainContext.postcode is set and ProvenanceGate from model-domain has PASSED
- **Action:** derive EntityMap from DomainContext: enumerate entities with properties, classify boundedContexts, open ProvenanceGate from DomainContext.postcode
- **Post:** EntityMap.entities is non-empty, each entity belongs to exactly one boundedContext, EntityMap.postcode set, ProvenanceGate PASSED
- **Failure modes:**
  - precondition: prior ProvenanceGate is in FAILED state → block execution; emit GateBlockedError with gateId reference
  - action: entity extracted has no properties — degenerate entity produced → flag entity as incomplete in EntityMap.challenges; continue but mark EntityMap as degraded
  - postcondition: entity appears in multiple boundedContexts — context boundary is ambiguous → emit ContextConflict challenge; halt if conflict count > 2, else log and continue

### define-process (semantic-compilation-pipeline)
- **Pre:** EntityMap.postcode is set, EntityMap is not degraded, ProvenanceGate from map-entities has PASSED
- **Action:** derive ProcessFlow from EntityMap: define workflows, state machines, temporal relations, and failure modes for all entities with lifecycle states; open ProvenanceGate from EntityMap.postcode
- **Post:** ProcessFlow covers every entity in EntityMap, all stateful entities have at least one state machine, ProvenanceGate PASSED
- **Failure modes:**
  - precondition: EntityMap.degraded is true — incomplete entities cannot produce complete process definitions → halt with DegradedInputError; require EntityMap remediation before proceeding
  - action: state machine produced has unreachable terminal states — entity can enter a state it can never exit → emit DeadlockRisk challenge; flag affected state machine in ProcessFlow.challenges
  - postcondition: ProcessFlow contains no workflows — all behaviours are stateless queries with no side effects → emit EmptyProcessWarning; continue only if IntentGraph confirms this is intentional via a constraint

### synthesize-blueprint (semantic-compilation-pipeline)
- **Pre:** DomainContext, EntityMap, and ProcessFlow all have postcodes set and all their ProvenanceGates have PASSED
- **Action:** merge DomainContext, EntityMap, and ProcessFlow into a unified Blueprint; assign Blueprint.postcode derived from all three parent postcodes; record DeterminismMetadata snapshot
- **Post:** Blueprint is internally consistent, all cross-references between entities and workflows resolve, Blueprint.postcode encodes all parent postcodes
- **Failure modes:**
  - precondition: any of the three input postcodes is absent — a required stage was skipped → emit IncompleteInputError listing which postcodes are missing; halt
  - action: a ProcessFlow workflow references an entity not present in EntityMap → emit DanglingReferenceError for the missing entity; halt synthesis
  - postcondition: Blueprint.postcode does not encode all three parent postcodes — provenance chain is broken → invalidate Blueprint; re-derive postcode from parent postcodes and retry once

### audit-blueprint (semantic-compilation-pipeline)
- **Pre:** Blueprint is present with valid postcode and all cross-references resolved
- **Action:** run policy checks against Blueprint: verify provenance chain is unbroken, cumulativeEntropy is below ceiling, no unchallenged DeadlockRisk or ContextConflict exists; produce AuditReport with all PolicyViolations
- **Post:** AuditReport is complete with PASS or FAIL verdict; every PolicyViolation has a severity (blocking | advisory) and a reference to the Blueprint element that triggered it
- **Failure modes:**
  - precondition: Blueprint postcode is absent or malformed → emit AuditInputError; do not produce AuditReport
  - action: audit policy set is empty — no rules loaded → emit EmptyPolicySetError and halt; governance without policies is undefined behaviour
  - postcondition: AuditReport references a Blueprint element id that does not exist in Blueprint → emit AuditCorruptionError; invalidate AuditReport and rerun audit

### govern-blueprint (semantic-compilation-pipeline)
- **Pre:** AuditReport is present with verdict PASS or FAIL and all blocking violations are resolved or explicitly accepted by policy
- **Action:** Governor evaluates AuditReport and emits GovernorDecision: ACCEPT if no blocking violations, REJECT if violations are unresolvable, ITERATE if violations are resolvable by re-running from a specific stage
- **Post:** GovernorDecision is one of {ACCEPT, REJECT, ITERATE}; if ITERATE, decision includes reentryStage and violationIds; if ACCEPT, Blueprint is emitted as final output with CompilationRun sealed
- **Failure modes:**
  - precondition: AuditReport verdict is absent — audit step did not complete → emit GovernorBlockedError; do not emit any GovernorDecision
  - action: Governor cannot determine reentryStage for an ITERATE decision — violation does not map to a known stage → escalate to REJECT to avoid infinite iteration loop; log unmapped violationId
  - postcondition: GovernorDecision is ITERATE but reentryStage is the current (last) stage — would cause infinite loop → reclassify as REJECT; emit IterationLoopGuardTriggered event

### extract-iteration-target (governor-iteration-loop)
- **Pre:** GovernorDecision.verdict is ITERATE and GovernorDecision.reentryStage is a valid stage code
- **Action:** read GovernorDecision.violationIds and reentryStage; load the PipelineState snapshot captured at reentryStage; create IterationRecord with iterationNumber incremented from prior count
- **Post:** IterationRecord exists with iterationNumber, reentryStage, violationIds, and a reference to the originating CompilationRun.runId
- **Failure modes:**
  - precondition: reentryStage code does not match any StageExecutionRecord in CompilationRun.stages → emit InvalidReentryStageError; escalate GovernorDecision to REJECT
  - action: PipelineState snapshot at reentryStage is missing or corrupted → emit SnapshotMissingError; attempt full pipeline rerun from stage 1; if iterationNumber > 3 escalate to REJECT
  - postcondition: iterationNumber exceeds ceiling (default 5) — runaway iteration detected → emit MaxIterationsExceeded; force GovernorDecision to REJECT; seal CompilationRun as FAILED

### replay-pipeline-from-checkpoint (governor-iteration-loop)
- **Pre:** IterationRecord is present with valid reentryStage and iterationNumber is within ceiling
- **Action:** restore PipelineState to snapshot at reentryStage; re-execute all stages from reentryStage onward using the same DeterminismMetadata (modelId, temperature); accumulate new StageExecutionRecords under the same CompilationRun.runId
- **Post:** all stages from reentryStage to govern-blueprint have new StageExecutionRecords; PipelineState.cumulativeEntropy is updated; a new AuditReport and GovernorDecision are produced
- **Failure modes:**
  - precondition: DeterminismMetadata from original run is unavailable — cannot guarantee determinism → emit DeterminismBreachWarning; log divergence; continue with current DeterminismMetadata but flag CompilationRun as non-deterministic
  - action: replay produces identical violations as the prior run — no progress made → detect by comparing violationIds sets; if identical emit IterationStalemate and escalate to REJECT
  - postcondition: new GovernorDecision is again ITERATE targeting the same reentryStage as before → treat as IterationStalemate; escalate to REJECT; seal CompilationRun as FAILED

### seal-compilation-run (governor-iteration-loop)
- **Pre:** GovernorDecision.verdict is ACCEPT or REJECT (not ITERATE)
- **Action:** set CompilationRun.completedAt to current timestamp; compute CompilationRun.totalDurationMs; attach final GovernorDecision, AuditReport, and Blueprint (if ACCEPT) or null Blueprint (if REJECT); write CompilationRun to provenance store
- **Post:** CompilationRun is immutable and retrievable by runId; if ACCEPT then Blueprint is the authoritative output; if REJECT then CompilationRun.stages contains the full failure trace
- **Failure modes:**
  - precondition: GovernorDecision.verdict is still ITERATE — seal called prematurely → emit PrematureSealError; do not write CompilationRun; return control to replay loop
  - action: provenance store write fails — CompilationRun is produced but not persisted → emit ProvenancePersistenceFailure; surface to user with CompilationRun payload so they can persist manually
  - postcondition: CompilationRun retrieved by runId does not match the in-memory record — write corruption → emit ProvenanceCorruptionAlert; mark runId as suspect; require user confirmation before treating Blueprint as trusted output

### generate-clarification-requests (ambiguity-resolution)
- **Pre:** IntentGraph.unknowns contains at least one unknown with impact=blocking
- **Action:** for each blocking unknown derive a ClarificationRequest with question, impact, and suggestedDefault (if derivable from IntentGraph.constraints); assign each ClarificationRequest.unknownId
- **Post:** every blocking unknown has exactly one ClarificationRequest; ClarificationRequests without suggestedDefault are flagged as mandatory
- **Failure modes:**
  - precondition: unknowns list is empty — gate should not have triggered → emit SpuriousTriggerWarning; resume pipeline without generating requests
  - action: two ClarificationRequests are generated for the same unknownId — duplicate questions → deduplicate by unknownId; keep the one with a suggestedDefault if both are otherwise equal
  - postcondition: a blocking unknown has no ClarificationRequest — unknown was silently dropped → emit UnknownDroppedError; halt; do not proceed until all blocking unknowns are covered

### collect-responses-or-apply-defaults (ambiguity-resolution)
- **Pre:** all blocking unknowns have a ClarificationRequest; pipeline state is AWAITING_CLARIFICATION
- **Action:** present mandatory ClarificationRequests to user and collect responses; for non-mandatory requests apply suggestedDefault if user provides no response within timeout; record each resolution with its source (user | default)
- **Post:** every ClarificationRequest has a resolution with a non-null answer and source annotation
- **Failure modes:**
  - precondition: pipeline state is not AWAITING_CLARIFICATION — clarification was triggered in wrong state → emit StateViolationError; do not present questions to user; halt
  - action: user provides a response that contradicts an existing IntentGraph.constraint → emit ConflictingResolutionWarning; surface conflict to user and ask them to choose: keep constraint or override with new response
  - postcondition: a mandatory ClarificationRequest has no resolution after timeout — user did not respond and no default exists → emit ResolutionTimeoutError; halt pipeline; preserve PipelineState so user can resume

### merge-resolutions-into-intent-graph (ambiguity-resolution)
- **Pre:** all ClarificationRequests have resolutions with source annotations
- **Action:** apply each resolution to its corresponding IntentUnknown in IntentGraph; promote resolved unknowns to IntentGraph.constraints if source=user or to IntentGraph.goals if resolution implies a new goal; recompute IntentGraph.postcode
- **Post:** IntentGraph contains no blocking unknowns; IntentGraph.postcode has changed to reflect incorporated resolutions; pipeline state transitions to RUNNING
- **Failure modes:**
  - precondition: a ClarificationRequest.unknownId does not match any IntentGraph.unknowns entry → emit OrphanedResolutionError; discard orphaned resolution; log for audit
  - action: recomputed IntentGraph.postcode is identical to the pre-resolution postcode — resolutions had no semantic effect → emit NullResolutionWarning; treat as non-blocking; allow pipeline to continue but log the anomaly
  - postcondition: IntentGraph still contains blocking unknowns after merge — merge was incomplete → emit MergeIncompleteError; re-enter clarification loop; increment clarification iteration counter; halt if counter > 3

## Acceptance Criteria
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

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
