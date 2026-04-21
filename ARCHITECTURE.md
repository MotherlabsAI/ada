# Ada is a governed semantic compilation system that transforms natural language intent through a deterministic 9-stage pipeline into formal governance artifacts (CLAUDE

## Overview
Ada is a governed semantic compilation system that transforms natural language intent through a deterministic 9-stage pipeline into formal governance artifacts (CLAUDE.md, agent definitions, pre-tool hooks, MCP server, world model), then enforces compiled semantic invariants at runtime via a real-time semantic gate on tool calls, a continuous governor that monitors world-model drift, and a projection engine that regenerates artifacts when drift exceeds thresholds — all under an immutable governance core that cannot be modified by the system's own self-improvement processes.

## In Scope
- Composite drift quantification using weighted embedding-distance, structural-diff, and predicate-satisfaction-ratio components with [0,1] normalization and configurable thresholds (G1)
- Severity-gated post-block behavior: HARD violations trigger HALT or ESCALATE; SOFT violations permit RETRY or REPLAN (G2)
- Cold-start bootstrap protocol that loads a designer-signed SeedInvariantSet, produces a minimal CompiledInvariantSet, arms a bootstrap-mode gate, and transitions to full compilation on first intent receipt (G3)
- Uniform InterStageIR envelope with stage-specific payloads, envelope versioning, payload schema versioning, validation hashes, and provenance tracking at every stage boundary (G4)
- Operator override mechanism constrained to recompilation-path actions (suppress constraint, force recompilation, adjust threshold) with cryptographic authorization and append-only hash-chained audit logging (G5)
- Session-based tenancy with sessionId-partitioned world model isolation and single-compilation-at-a-time per session (G6)
- Event-sourced RuntimeWorldModel with WorldModelEvent append log, distinct from CompiledWorldModel artifact, with snapshot capability for governor comparison (G7)
- Adaptive governor polling with operator-configurable base interval ceiling and drift-velocity-driven downward adjustment forming a feedback control loop (G8)
- Projection engine trigger taxonomy distinguishing drift-threshold-breach triggers (partial projection) from user-restatement triggers (full recompilation) with defined decision boundaries (G9)
- ArtifactCoherenceVerifier rejection handling with RECOVERABLE class triggering retry-with-localization and UNRECOVERABLE class triggering rollback or suspend-pending-review (G10)
- Canonical compiled invariant representation as hardPredicate plus semanticAnchor plus proximityThreshold plus severity plus provenance — the evaluable format for the semantic gate (G11)
- Architecturally distinct RuntimeWorldModel (event-sourced runtime state) and CompiledWorldModel (expected-state artifact) with drift computed as divergence between them (G12)
- Per-stage failure modes with retry capability, failure classification, and upstream notification without violating pipeline ordering constraint (G13)
- Immutable governance core enforcement: gate logic, governor logic, and enforcement mechanisms are not modifiable by self-improvement processes (G14)
- Operational observability via ObservabilitySnapshot exposing drift scores, artifact versions, gate decisions, governor state, and audit trail without bypassing governance (G15)

## Out of Scope
- General-purpose LLM orchestration, agent conversation management, or multi-turn dialogue routing
- Prompt template authoring or management — CLAUDE.md is a compiled output artifact, not a hand-authored prompt template
- Model selection, routing, or multi-model orchestration — Ada targets Claude Code specifically
- OS-level sandboxing, containerization, or network isolation — tool-call blocking is semantic, not OS-level
- Weight training, fine-tuning, or model adaptation — self-improvement means workflow and skill refinement, not gradient updates
- Human-in-the-loop approval workflows as a normal execution step — operator override is an emergency/governance mechanism
- Application-level business logic implementation — Ada governs Claude Code's execution environment, not the business logic it executes
- Data pipeline ETL, stream processing, or analytics — Ada's pipeline is a semantic compilation pipeline, not a data transformation pipeline
- Security authentication and authorization for end users of downstream applications
- Natural language generation quality evaluation (fluency, coherence in the NLG sense, BLEU/ROUGE scoring)

## Assumptions
- Sessions are single-compilation-at-a-time; concurrent compilations for different intents within the same session are not supported (resolved from U6)
- The world model is event-sourced as mandated by RuntimeWorldModel.updateMechanism === 'EVENT_SOURCED' (resolved from U7)
- The governor can only poll faster than its base interval, never slower — currentPollingIntervalMs <= basePollingIntervalMs is a safety invariant (resolved from U8)
- Stage retry at the same pipeline position does not violate the no-skip-no-reorder constraint C4 (resolved from U13/G13 interaction)
- The SeedInvariantSet is authored by system designers at design time, not generated by Ada, as indicated by designerSignature requirement (resolved from U3)
- DriftScoreComputer uses exactly three metric types — embedding distance (from OntologyNode vectors), structural diff (from IR validation hashes), and predicate satisfaction ratio (from CompiledInvariant hardPredicates) — as the minimum composite components (resolved from U1)
- The three DriftScoreComponent metricTypes map to: EMBEDDING_DISTANCE (semantic drift in ontology space), STRUCTURAL_DIFF (hash-based structural divergence), PREDICATE_SATISFACTION_RATIO (fraction of invariant predicates still satisfied) (derived from entity cross-reference)
- Pipeline stage abbreviations map to workflow steps: CTX=intent-ingestion-and-tokenization, INT=ontology-resolution, PER=invariant-extraction, ENT=world-model-compilation, PRO=governance-artifact-generation, SYN=artifact-coherence-verification, VER=compiled-invariant-set-finalization, GOV=runtime-activation, BLD=projection-engine-initialization (assumed from workflow alignment)

## Bounded Contexts
### CompilationPipeline
**Root entity:** InterStageIR
**Entities:** InterStageIR, ProvenanceRecord, PipelineStageFailure
**Context invariants:**
- `every InterStageIR.validationHash is verified by the receiving stage before payload processing`
- `PipelineStageFailure.compilationRunId links to exactly one pipeline execution`

### GovernanceCompilation
**Root entity:** CompiledInvariantSet
**Entities:** CompiledInvariantSet, CompiledInvariant, SeedInvariantSet, BootstrapState
**Context invariants:**
- `every CompiledInvariantSet deployed to a Session has coherenceVerified === true on its ArtifactSet`
- `SeedInvariantSet is immutable post-authoring — no runtime process may modify it`

### RuntimeEnforcement
**Root entity:** Session
**Entities:** Session, GateDecision, ToolCall, GovernorState, DriftScore, DriftScoreComponent, DriftVelocity, DriftThreshold, ProjectionTrigger, OperatorOverride
**Context invariants:**
- `every ToolCall in a Session is preceded by exactly one GateDecision`
- `GovernorState.currentPollingIntervalMs <= GovernorState.basePollingIntervalMs`
- `OperatorOverride routes through recompilation path — no override may directly mutate CompiledInvariantSet in place`

### WorldModelManagement
**Root entity:** RuntimeWorldModel
**Entities:** RuntimeWorldModel, CompiledWorldModel, WorldModelEvent
**Context invariants:**
- `RuntimeWorldModel.sessionId === CompiledWorldModel.sessionId for the paired models used in drift computation`
- `RuntimeWorldModel.eventLog ordering is strictly monotonic by sequenceNumber`

### ArtifactLifecycle
**Root entity:** ArtifactSet
**Entities:** ArtifactSet, ArtifactReference, CoherenceVerificationResult
**Context invariants:**
- `ArtifactSet.status transitions: CANDIDATE → DEPLOYED | ROLLED_BACK | SUSPENDED — no other transitions permitted`
- `exactly one ArtifactSet per Session has status === 'DEPLOYED' at any time`

### Observability
**Root entity:** ObservabilitySnapshot
**Entities:** ObservabilitySnapshot, AuditLogEntry
**Context invariants:**
- `AuditLogEntry.previousEntryHash forms an unbroken chain from genesis entry`
- `ObservabilitySnapshot is read-only — no operator action may modify a snapshot`

### OntologyKnowledge
**Root entity:** OntologyBaseLayer
**Entities:** OntologyBaseLayer, OntologyNode
**Context invariants:**
- `OntologyBaseLayer is shared read-only across concurrent Sessions`
- `OntologyNode.embeddingVector.length is uniform across all nodes in an OntologyBaseLayer version`

## Entity Catalog
### CompiledInvariant
*Category: substance*

**Properties:**
- `id: string` (required)
- `hardPredicate: string` (required)
- `semanticAnchor: EmbeddingVector` (required)
- `proximityThreshold: number` (required)
- `severity: enum:HARD|SOFT|ADVISORY` (required)
- `sourceStage: enum:GOV` (required)
- `compiledAt: timestamp` (required)
- `sessionId: string` (required)
- `provenance: enum:USER_INTENT|SEED|OPERATOR_OVERRIDE` (required)

**Invariants:**
- `compiledInvariant.hardPredicate !== null && compiledInvariant.hardPredicate.length > 0`
- `compiledInvariant.semanticAnchor !== null`
- `compiledInvariant.proximityThreshold >= 0 && compiledInvariant.proximityThreshold <= 1`
- `compiledInvariant.severity !== null`
- `compiledInvariant.provenance !== null`

### CompiledInvariantSet
*Category: substance*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `invariants: CompiledInvariant[]` (required)
- `version: string` (required)
- `contentHash: string` (required)
- `compiledAt: timestamp` (required)
- `bootstrapFlag: boolean` (required)
- `authoredBy: enum:PIPELINE|SEED_DEFAULTS|OPERATOR` (required)

**Invariants:**
- `compiledInvariantSet.invariants.length > 0`
- `compiledInvariantSet.contentHash !== null`
- `compiledInvariantSet.sessionId !== null`
- `compiledInvariantSet.bootstrapFlag === true ? compiledInvariantSet.authoredBy === 'SEED_DEFAULTS' : true`

### SeedInvariantSet
*Category: substance*

**Properties:**
- `id: string` (required)
- `invariants: CompiledInvariant[]` (required)
- `authorVersion: string` (required)
- `permissivenessLevel: enum:MAXIMALLY_PERMISSIVE_WITHIN_SAFETY` (required)
- `designerSignature: string` (required)

**Invariants:**
- `seedInvariantSet.invariants.length > 0`
- `seedInvariantSet.designerSignature !== null`
- `seedInvariantSet.invariants.every(i => i.provenance === 'SEED')`

### DriftScore
*Category: quality*

**Properties:**
- `value: number` (required)
- `computedAt: timestamp` (required)
- `sessionId: string` (required)
- `compositeComponents: DriftScoreComponent[]` (required)
- `normalizationScheme: enum:LINEAR_WEIGHTED_COMPOSITE` (required)

**Invariants:**
- `driftScore.value >= 0 && driftScore.value <= 1`
- `driftScore.compositeComponents.length >= 3`
- `driftScore.computedAt !== null`

### DriftScoreComponent
*Category: quality*

**Properties:**
- `metricType: enum:EMBEDDING_DISTANCE|PREDICATE_SATISFACTION_RATIO|STRUCTURAL_DIFF` (required)
- `rawValue: number` (required)
- `weight: number` (required)
- `normalizedValue: number` (required)

**Invariants:**
- `driftScoreComponent.weight > 0 && driftScoreComponent.weight <= 1`
- `driftScoreComponent.normalizedValue >= 0 && driftScoreComponent.normalizedValue <= 1`
- `driftScoreComponent.metricType !== null`

### DriftVelocity
*Category: quality*

**Properties:**
- `value: number` (required)
- `computedAt: timestamp` (required)
- `sessionId: string` (required)
- `windowSizeMs: number` (required)
- `priorScore: DriftScore` (required)
- `currentScore: DriftScore` (required)

**Invariants:**
- `driftVelocity.windowSizeMs > 0`
- `driftVelocity.priorScore.computedAt < driftVelocity.currentScore.computedAt`
- `driftVelocity.sessionId !== null`

### DriftThreshold
*Category: substance*

**Properties:**
- `projectionTriggerValue: number` (required)
- `recompilationTriggerValue: number` (required)
- `velocityAdaptationTriggerValue: number` (required)
- `sessionId: string` (required)
- `configuredAt: timestamp` (required)

**Invariants:**
- `driftThreshold.projectionTriggerValue > 0 && driftThreshold.projectionTriggerValue < driftThreshold.recompilationTriggerValue`
- `driftThreshold.recompilationTriggerValue <= 1`
- `driftThreshold.velocityAdaptationTriggerValue > 0`

### GateDecision
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `toolCallId: string` (required)
- `verdict: enum:ALLOW|BLOCK` (required)
- `violatedInvariantIds: string[]`
- `decidedAt: timestamp` (required)
- `postBlockAction: enum:HALT|RETRY|REPLAN|ESCALATE`
- `severity: enum:HARD|SOFT|ADVISORY` (required)

**Invariants:**
- `gateDecision.verdict === 'BLOCK' ? gateDecision.violatedInvariantIds.length > 0 : true`
- `gateDecision.verdict === 'BLOCK' ? gateDecision.postBlockAction !== null : true`
- `gateDecision.verdict === 'BLOCK' && gateDecision.severity === 'HARD' ? gateDecision.postBlockAction === 'HALT' || gateDecision.postBlockAction === 'ESCALATE' : true`
- `gateDecision.decidedAt !== null`

### ToolCall
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `toolName: string` (required)
- `parameters: object` (required)
- `requestedAt: timestamp` (required)
- `agentId: string` (required)

**Invariants:**
- `toolCall.toolName !== null && toolCall.toolName.length > 0`
- `toolCall.sessionId !== null`
- `toolCall.agentId !== null`

### GovernorState
*Category: state*

**Properties:**
- `sessionId: string` (required)
- `basePollingIntervalMs: number` (required)
- `currentPollingIntervalMs: number` (required)
- `isAdaptive: boolean` (required)
- `lastPollAt: timestamp` (required)
- `currentDriftScore: DriftScore` (required)
- `currentDriftVelocity: DriftVelocity`

**Invariants:**
- `governorState.basePollingIntervalMs > 0`
- `governorState.currentPollingIntervalMs > 0 && governorState.currentPollingIntervalMs <= governorState.basePollingIntervalMs`
- `governorState.sessionId !== null`
- `governorState.currentDriftScore !== null`

### RuntimeWorldModel
*Category: state*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `version: string` (required)
- `contentHash: string` (required)
- `observedState: object` (required)
- `lastUpdatedAt: timestamp` (required)
- `updateMechanism: enum:EVENT_SOURCED` (required)
- `eventLog: WorldModelEvent[]` (required)

**Invariants:**
- `runtimeWorldModel.sessionId !== null`
- `runtimeWorldModel.eventLog !== null`
- `runtimeWorldModel.version !== null`
- `runtimeWorldModel.updateMechanism === 'EVENT_SOURCED'`

### CompiledWorldModel
*Category: substance*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `version: string` (required)
- `contentHash: string` (required)
- `expectedState: object` (required)
- `producedAt: timestamp` (required)
- `artifactSetId: string` (required)

**Invariants:**
- `compiledWorldModel.expectedState !== null`
- `compiledWorldModel.artifactSetId !== null`
- `compiledWorldModel.sessionId !== null`

### WorldModelEvent
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `eventType: string` (required)
- `payload: object` (required)
- `occurredAt: timestamp` (required)
- `sequenceNumber: number` (required)

**Invariants:**
- `worldModelEvent.sequenceNumber >= 0`
- `worldModelEvent.sessionId !== null`
- `worldModelEvent.occurredAt !== null`

### ArtifactSet
*Category: substance*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `version: string` (required)
- `contentHash: string` (required)
- `claudeMd: ArtifactReference` (required)
- `agentDefinitions: ArtifactReference` (required)
- `preToolHooks: ArtifactReference` (required)
- `mcpServer: ArtifactReference` (required)
- `worldModel: ArtifactReference` (required)
- `producedAt: timestamp` (required)
- `status: enum:CANDIDATE|DEPLOYED|ROLLED_BACK|SUSPENDED` (required)
- `coherenceVerified: boolean` (required)

**Invariants:**
- `artifactSet.coherenceVerified === true || artifactSet.status === 'CANDIDATE'`
- `artifactSet.claudeMd !== null && artifactSet.agentDefinitions !== null && artifactSet.preToolHooks !== null && artifactSet.mcpServer !== null && artifactSet.worldModel !== null`
- `artifactSet.contentHash !== null`
- `artifactSet.sessionId !== null`

### ArtifactReference
*Category: relation*

**Properties:**
- `artifactType: enum:CLAUDE_MD|AGENT_DEFINITIONS|PRE_TOOL_HOOKS|MCP_SERVER|WORLD_MODEL` (required)
- `contentHash: string` (required)
- `storagePath: string` (required)
- `version: string` (required)

**Invariants:**
- `artifactReference.contentHash !== null`
- `artifactReference.artifactType !== null`
- `artifactReference.storagePath !== null`

### CoherenceVerificationResult
*Category: event*

**Properties:**
- `id: string` (required)
- `candidateArtifactSetId: string` (required)
- `verdict: enum:PASS|REJECT` (required)
- `rejectionClass: enum:RECOVERABLE|UNRECOVERABLE`
- `errorLocalization: string[]`
- `verifiedAt: timestamp` (required)
- `postRejectionAction: enum:ROLLBACK|RETRY_WITH_LOCALIZATION|SUSPEND_PENDING_REVIEW`

**Invariants:**
- `coherenceVerificationResult.verdict === 'REJECT' ? coherenceVerificationResult.rejectionClass !== null : true`
- `coherenceVerificationResult.verdict === 'REJECT' ? coherenceVerificationResult.postRejectionAction !== null : true`
- `coherenceVerificationResult.verdict === 'REJECT' && coherenceVerificationResult.rejectionClass === 'RECOVERABLE' ? coherenceVerificationResult.postRejectionAction === 'RETRY_WITH_LOCALIZATION' : true`
- `coherenceVerificationResult.verdict === 'REJECT' && coherenceVerificationResult.rejectionClass === 'UNRECOVERABLE' ? coherenceVerificationResult.postRejectionAction === 'ROLLBACK' || coherenceVerificationResult.postRejectionAction === 'SUSPEND_PENDING_REVIEW' : true`

### InterStageIR
*Category: substance*

**Properties:**
- `envelopeVersion: string` (required)
- `sourceStage: enum:CTX|INT|PER|ENT|PRO|SYN|VER|GOV|BLD` (required)
- `targetStage: enum:INT|PER|ENT|PRO|SYN|VER|GOV|BLD` (required)
- `validationHash: string` (required)
- `provenance: ProvenanceRecord` (required)
- `payload: object` (required)
- `payloadSchemaVersion: string` (required)
- `producedAt: timestamp` (required)

**Invariants:**
- `interStageIR.validationHash !== null`
- `interStageIR.sourceStage !== null && interStageIR.targetStage !== null`
- `interStageIR.envelopeVersion !== null`
- `interStageIR.payloadSchemaVersion !== null`
- `interStageIR.provenance !== null`

### ProvenanceRecord
*Category: substance*

**Properties:**
- `sessionId: string` (required)
- `compilationRunId: string` (required)
- `stageSequence: string[]` (required)
- `originatedAt: timestamp` (required)

**Invariants:**
- `provenanceRecord.compilationRunId !== null`
- `provenanceRecord.stageSequence.length > 0`
- `provenanceRecord.sessionId !== null`

### PipelineStageFailure
*Category: event*

**Properties:**
- `id: string` (required)
- `stage: enum:CTX|INT|PER|ENT|PRO|SYN|VER|GOV|BLD` (required)
- `failureMode: enum:PARTIAL_OUTPUT|EXCEPTION|UPSTREAM_RETRY_REQUESTED|DOWNSTREAM_DEGRADATION` (required)
- `errorDetail: string` (required)
- `inputIRHash: string` (required)
- `occurredAt: timestamp` (required)
- `compilationRunId: string` (required)
- `retryCount: number` (required)

**Invariants:**
- `pipelineStageFailure.failureMode !== null`
- `pipelineStageFailure.retryCount >= 0`
- `pipelineStageFailure.inputIRHash !== null`
- `pipelineStageFailure.compilationRunId !== null`

### OperatorOverride
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `operatorId: string` (required)
- `authorizationToken: string` (required)
- `overrideType: enum:FORCE_RECOMPILATION|SUPPRESS_CONSTRAINT|GOVERNOR_OVERRIDE` (required)
- `targetEntityId: string`
- `modifiedIntentParameters: object`
- `issuedAt: timestamp` (required)
- `auditLogEntryHash: string` (required)

**Invariants:**
- `operatorOverride.authorizationToken !== null`
- `operatorOverride.auditLogEntryHash !== null`
- `operatorOverride.overrideType !== null`
- `operatorOverride.overrideType === 'SUPPRESS_CONSTRAINT' ? operatorOverride.targetEntityId !== null : true`

### AuditLogEntry
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `eventType: string` (required)
- `actorId: string` (required)
- `payload: object` (required)
- `contentHash: string` (required)
- `previousEntryHash: string` (required)
- `recordedAt: timestamp` (required)

**Invariants:**
- `auditLogEntry.previousEntryHash !== null`
- `auditLogEntry.contentHash !== null`
- `auditLogEntry.actorId !== null`
- `auditLogEntry.sessionId !== null`

### Session
*Category: substance*

**Properties:**
- `id: string` (required)
- `status: enum:BOOTSTRAP|COMPILING|COMPILED|RUNTIME|SUSPENDED|TERMINATED` (required)
- `compiledInvariantSetId: string` (required)
- `deployedArtifactSetId: string` (required)
- `runtimeWorldModelId: string` (required)
- `compiledWorldModelId: string` (required)
- `governorStateId: string` (required)
- `ontologyBaseLayerId: string` (required)
- `createdAt: timestamp` (required)
- `bootstrapTransitionedAt: timestamp`

**Invariants:**
- `session.status !== 'RUNTIME' || session.compiledInvariantSetId !== null`
- `session.status !== 'RUNTIME' || session.deployedArtifactSetId !== null`
- `session.status === 'BOOTSTRAP' ? session.bootstrapTransitionedAt === null : true`
- `session.ontologyBaseLayerId !== null`

### BootstrapState
*Category: state*

**Properties:**
- `sessionId: string` (required)
- `seedInvariantSetId: string` (required)
- `minimalArtifactSetId: string` (required)
- `compilationTriggered: boolean` (required)
- `transitionedAt: timestamp`

**Invariants:**
- `bootstrapState.seedInvariantSetId !== null`
- `bootstrapState.compilationTriggered === true ? bootstrapState.transitionedAt !== null : bootstrapState.transitionedAt === null`

### OntologyBaseLayer
*Category: substance*

**Properties:**
- `id: string` (required)
- `version: string` (required)
- `ontologyNodes: OntologyNode[]` (required)
- `contentHash: string` (required)

**Invariants:**
- `ontologyBaseLayer.ontologyNodes.length > 0`
- `ontologyBaseLayer.contentHash !== null`

### OntologyNode
*Category: substance*

**Properties:**
- `id: string` (required)
- `label: string` (required)
- `embeddingVector: number[]` (required)
- `parentNodeId: string`

**Invariants:**
- `ontologyNode.embeddingVector.length > 0`
- `ontologyNode.label !== null && ontologyNode.label.length > 0`

### ProjectionTrigger
*Category: event*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `triggerSource: enum:DRIFT_THRESHOLD_BREACH|USER_RESTATEMENT` (required)
- `currentDriftScore: number`
- `triggeredAt: timestamp` (required)
- `actionRequired: enum:PROJECTION|FULL_RECOMPILATION` (required)

**Invariants:**
- `projectionTrigger.triggerSource === 'DRIFT_THRESHOLD_BREACH' ? projectionTrigger.currentDriftScore !== null : true`
- `projectionTrigger.triggerSource === 'USER_RESTATEMENT' ? projectionTrigger.actionRequired === 'FULL_RECOMPILATION' : true`
- `projectionTrigger.triggerSource === 'DRIFT_THRESHOLD_BREACH' ? projectionTrigger.actionRequired === 'PROJECTION' || projectionTrigger.actionRequired === 'FULL_RECOMPILATION' : true`
- `projectionTrigger.triggeredAt !== null`

### ObservabilitySnapshot
*Category: state*

**Properties:**
- `id: string` (required)
- `sessionId: string` (required)
- `compilationStatus: string` (required)
- `currentDriftScore: number` (required)
- `lastGateDecisionId: string`
- `deployedArtifactSetVersion: string` (required)
- `governorPollingIntervalMs: number` (required)
- `snapshotAt: timestamp` (required)

**Invariants:**
- `observabilitySnapshot.currentDriftScore >= 0 && observabilitySnapshot.currentDriftScore <= 1`
- `observabilitySnapshot.deployedArtifactSetVersion !== null`
- `observabilitySnapshot.snapshotAt !== null`

## Workflows
### semantic-compilation-pipeline
**Trigger:** operator submits natural language intent string to Ada compilation endpoint, or system detects absent CompiledInvariantSet for session

**Steps:**
1. **intent-ingestion-and-tokenization** *(enables)*
   - Pre: `raw intent string is non-empty, session exists in opening or active state, no concurrent compilation is running for this sessionId`
   - Action: tokenize and segment natural language intent into semantic units; assign compilationRunId; emit InterStageIR_v1 with rawTokens, sessionId, compilationRunId, timestamp
   - Post: `InterStageIR_v1 record exists with contentHash, sessionId bound, rawTokens non-empty, compilationRunId unique`
2. **ontology-resolution** *(requires)*
   - Pre: `InterStageIR_v1 exists and contentHash validates; OntologyBaseLayer is loaded and version-pinned for this compilationRunId`
   - Action: map each semantic unit to OntologyNode references; resolve synonyms, ambiguities via OntologyKnowledge context; emit InterStageIR_v2 with resolvedNodes, unresolvedTerms, ontologyVersion
   - Post: `InterStageIR_v2 exists; unresolvedTerms count is below permissible threshold (<=10% of tokens); ontologyVersion recorded in provenance`
3. **invariant-extraction** *(requires)*
   - Pre: `InterStageIR_v2 exists and validates; unresolved term ratio below threshold; compilationRunId active`
   - Action: extract candidate CompiledInvariants from resolved ontology nodes; assign hardPredicate, semanticAnchor, proximityThreshold, severity, sourceStage=3 to each; emit InterStageIR_v3 with candidateInvariants list
   - Post: `InterStageIR_v3 exists with at least 1 candidate invariant; each invariant has non-null hardPredicate and severity; contentHash recorded`
4. **world-model-compilation** *(requires)*
   - Pre: `InterStageIR_v3 exists with non-empty candidateInvariants; RuntimeWorldModel for sessionId exists in seeding or live state`
   - Action: derive expectedState from candidateInvariants and resolved ontology; compute CompiledWorldModel with expectedState snapshot; assign version, contentHash, producedAt, artifactSetId; emit InterStageIR_v4 with compiledWorldModelId
   - Post: `CompiledWorldModel record persisted with valid contentHash; expectedState is structurally complete; CompiledWorldModel.version increments monotonically from prior version`
5. **governance-artifact-generation** *(requires)*
   - Pre: `InterStageIR_v4 exists; CompiledWorldModel persisted; artifactSetId assigned`
   - Action: generate CLAUDE.md, agent definitions, pre-tool hooks, MCP server configuration from compiledWorldModelId and candidateInvariants; bundle into ArtifactSet keyed by artifactSetId; emit InterStageIR_v5 with artifactSetId and artifact content hashes
   - Post: `ArtifactSet contains all 4 artifact types; each artifact has a stable ArtifactReference with contentHash; InterStageIR_v5 contentHash covers all artifact hashes`
6. **artifact-coherence-verification** *(requires)*
   - Pre: `ArtifactSet is complete with all 4 artifact types; all contentHashes recorded in InterStageIR_v5; compilationRunId still active`
   - Action: run ArtifactCoherenceVerifier across all artifacts in ArtifactSet; check cross-artifact semantic consistency, referential integrity of ArtifactReferences, and invariant coverage completeness; emit CoherenceVerificationResult with pass/fail and error localizations
   - Post: `CoherenceVerificationResult.status = PASS; all inter-artifact references resolve; invariant coverage is complete (every CompiledInvariant referenced by at least one artifact)`
7. **compiled-invariant-set-finalization** *(requires)*
   - Pre: `CoherenceVerificationResult.status = PASS; all artifact contentHashes validated; compilationRunId active`
   - Action: promote candidateInvariants to CompiledInvariantSet with final id, sessionId, version, contentHash, compiledAt, bootstrapFlag=false, authoredBy=compilationRunId; persist CompiledInvariantSet; emit InterStageIR_v6 with compiledInvariantSetId; prior CompiledInvariantSet transitions to superseded
   - Post: `CompiledInvariantSet persisted and version-incremented; prior version marked superseded; SessionId bound to new compiledInvariantSetId; AuditLogEntry written for finalization event`
8. **runtime-activation** *(enables)*
   - Pre: `CompiledInvariantSet is finalized and persisted; ArtifactSet is coherent and active; GovernorState for sessionId exists`
   - Action: activate CompiledInvariantSet in SemanticGateEnforcer for sessionId; load ArtifactSet into runtime enforcement context; set GovernorState.currentPollingIntervalMs to basePollingIntervalMs; emit compilation-complete event to observability
   - Post: `SemanticGateEnforcer is armed with current compiledInvariantSetId; GovernorState is active; session transitions from bootstrapping or compiling to active; ObservabilitySnapshot records activation`
9. **projection-engine-initialization** *(concurrent)*
   - Pre: `session is in active state; CompiledWorldModel is loaded; CompiledInvariantSet is armed in gate`
   - Action: initialize projection engine with CompiledWorldModel.expectedState as baseline; compute initial ProjectionTrigger thresholds from DriftThreshold for sessionId; register projection engine with governor polling loop
   - Post: `projection engine is registered and baseline is set; DriftThreshold persisted for sessionId; governor polling loop includes projection engine callback`

### runtime-enforcement-and-drift-control-loop
**Trigger:** GovernorState polling timer fires (interval elapsed) OR ToolCall event arrives at SemanticGateEnforcer

**Steps:**
1. **governor-poll-world-model** *(enables)*
   - Pre: `GovernorState.sessionId is active; currentPollingIntervalMs has elapsed since lastPollAt; RuntimeWorldModel for sessionId is in live or drifting state`
   - Action: read RuntimeWorldModel.observedState snapshot; compute DriftScore as weighted composite: (embeddingDistance * 0.4) + ((1 - predicateSatisfactionRatio) * 0.4) + (structuralDiffRatio * 0.2); normalize each component to [0,1]; store DriftScoreComponents; update GovernorState.currentDriftScore; compute DriftVelocity from priorScore delta over windowSizeMs; update GovernorState.lastPollAt
   - Post: `DriftScore persisted with computedAt, sessionId, compositeComponents, normalizationScheme=WEIGHTED_LINEAR; DriftVelocity computed with windowSizeMs=GovernorState.currentPollingIntervalMs * 3; GovernorState.lastPollAt updated to now`
2. **adaptive-interval-adjustment** *(concurrent)*
   - Pre: `GovernorState.isAdaptive = true; DriftVelocity computed; DriftVelocity.value is not NaN`
   - Action: if DriftVelocity.value > velocityAdaptationTriggerValue: halve currentPollingIntervalMs (floor at 500ms); if DriftVelocity.value < (velocityAdaptationTriggerValue * 0.3) and currentPollingIntervalMs < basePollingIntervalMs: double currentPollingIntervalMs (ceiling at basePollingIntervalMs); update GovernorState.currentPollingIntervalMs
   - Post: `GovernorState.currentPollingIntervalMs is within [500ms, basePollingIntervalMs]; interval change is proportional to drift velocity; change is logged to ObservabilitySnapshot`
3. **drift-threshold-evaluation** *(enables)*
   - Pre: `DriftScore computed and valid; DriftThreshold loaded for sessionId; session is active`
   - Action: compare DriftScore.value against DriftThreshold.projectionTriggerValue (0.25) and DriftThreshold.recompilationTriggerValue (0.65); if score >= recompilationTriggerValue emit RECOMPILATION_TRIGGER event; else if score >= projectionTriggerValue emit PROJECTION_TRIGGER event; else emit NO_ACTION
   - Post: `exactly one of RECOMPILATION_TRIGGER, PROJECTION_TRIGGER, NO_ACTION emitted; event carries sessionId, driftScore, computedAt, triggeredThreshold`
4. **projection-engine-regeneration** *(requires)*
   - Pre: `PROJECTION_TRIGGER event received (score >= 0.25 and < 0.65); session is active; projection engine is registered; NOT concurrent with active recompilation`
   - Action: regenerate projected state from current RuntimeWorldModel.observedState and CompiledWorldModel.expectedState delta; update projection artifacts (not full recompilation — no pipeline traversal); emit updated ProjectionTrigger with new projectedState; write to RuntimeWorldModel as projection update
   - Post: `RuntimeWorldModel.version incremented; projectedState reflects corrected trajectory; projection artifact contentHash updated; AuditLogEntry written for projection regeneration event`
5. **tool-call-gate-evaluation** *(guards)*
   - Pre: `ToolCall event received with toolName, parameters, agentId; SemanticGateEnforcer is armed with current CompiledInvariantSet; session is active`
   - Action: for each CompiledInvariant in CompiledInvariantSet: evaluate hardPredicate against ToolCall.parameters; check semanticAnchor proximity within proximityThreshold; collect violatedInvariantIds; determine worst-case severity across violations; emit GateDecision with verdict=ALLOW if no violations, BLOCK if any violation
   - Post: `GateDecision persisted with id, sessionId, toolCallId, verdict, violatedInvariantIds, decidedAt, severity; GateDecision.postBlockAction assigned based on severity if blocked; AuditLogEntry written`
6. **post-block-action-dispatch** *(compensates)*
   - Pre: `GateDecision.verdict = BLOCK; GateDecision.postBlockAction assigned; severity is one of LOW, MEDIUM, HIGH`
   - Action: dispatch post-block action based on severity: if severity=LOW retry ToolCall with parameters modified to satisfy violated invariants (parameter relaxation within proximitThreshold); if severity=MEDIUM invoke projection engine to replan agent action sequence and resubmit revised ToolCall; if severity=HIGH halt tool call execution and escalate to operator via OperatorOverride interface
   - Post: `for LOW: modified ToolCall re-evaluated by gate within same session; for MEDIUM: replanned ToolCall queued for gate evaluation; for HIGH: GateDecision.postBlockAction=ESCALATE recorded; operator notified via override interface; session enters degraded state pending operator response`
7. **operator-override-processing** *(compensates)*
   - Pre: `OperatorOverride received via authorized interface; operator identity verified with required authorization level; session exists; override targets one of: gate verdict, governor interval, projection thresholds, or recompilation trigger`
   - Action: validate override scope against immutable governance core constraint: reject any override targeting CompiledInvariant.hardPredicate or CompiledInvariantSet structure; apply override to mutable runtime parameter (gate bypass for specific toolCallId, or interval adjustment, or threshold modification); write OperatorOverride record to append-only AuditLogEntry with operatorId, overrideScope, justification, timestamp
   - Post: `mutable runtime parameter updated; AuditLogEntry written and immutable; override is time-bounded (TTL must be set); session transitions from degraded to active if override resolves the block condition`

### cold-start-bootstrap
**Trigger:** session opens and no CompiledInvariantSet exists for sessionId, or system initializes for first time

**Steps:**
1. **seed-invariant-set-validation** *(enables)*
   - Pre: `SeedInvariantSet exists in governance store; system has not yet produced any CompiledInvariantSet for this sessionId`
   - Action: load SeedInvariantSet; verify designerSignature cryptographic validity; verify authorVersion matches expected system version; read permissivenessLevel to configure bootstrap governance strictness
   - Post: `SeedInvariantSet.designerSignature is valid; authorVersion matches; permissivenessLevel recorded in BootstrapState; seed is authorized for use`
2. **minimal-compiled-invariant-set-creation** *(requires)*
   - Pre: `SeedInvariantSet is validated; BootstrapState initialized; sessionId assigned`
   - Action: promote SeedInvariantSet.invariants to CompiledInvariantSet with bootstrapFlag=true, authoredBy=SEED_DESIGNER, version=0, sessionId bound; persist CompiledInvariantSet; emit BootstrapState record with sessionId, seedId, permissivenessLevel, bootstrapStartedAt
   - Post: `CompiledInvariantSet persisted with bootstrapFlag=true; version=0 recorded; AuditLogEntry written for bootstrap creation; session transitions to bootstrapping state`
3. **bootstrap-gate-arming** *(enables)*
   - Pre: `bootstrap CompiledInvariantSet is persisted with bootstrapFlag=true; session is in bootstrapping state`
   - Action: arm SemanticGateEnforcer with bootstrap CompiledInvariantSet; configure gate with permissivenessLevel from SeedInvariantSet (PERMISSIVE allows more tool calls through during bootstrap; STRICT applies full seed invariants); activate deny-all for any tool call not covered by seed invariants
   - Post: `SemanticGateEnforcer armed with bootstrap set; gate behavior reflects permissivenessLevel; system is operational in bootstrap mode; full compilation pipeline queued`
4. **bootstrap-to-compiled-transition** *(requires)*
   - Pre: `full semantic compilation pipeline has completed successfully; new CompiledInvariantSet with bootstrapFlag=false is persisted; ArtifactSet is coherent; session is in bootstrapping state`
   - Action: atomically swap SemanticGateEnforcer from bootstrap CompiledInvariantSet to fully compiled CompiledInvariantSet; mark bootstrap CompiledInvariantSet as superseded; transition session from bootstrapping to active; emit BOOTSTRAP_COMPLETE event to observability
   - Post: `SemanticGateEnforcer armed with bootstrapFlag=false CompiledInvariantSet; session is in active state; bootstrap CompiledInvariantSet is superseded but retained in history; AuditLogEntry records transition with timestamp and both invariant set ids`

## State Machines
### Session
States: opening → bootstrapping → active → degraded → recompiling → closing → closed
Transitions:
- `opening` → `bootstrapping` on `session-init-complete` [guard: SeedInvariantSet is validated and bootstrap CompiledInvariantSet is persisted]
- `bootstrapping` → `active` on `bootstrap-to-compiled-transition-complete` [guard: bootstrapFlag=false CompiledInvariantSet is armed in gate and ArtifactSet is coherent]
- `bootstrapping` → `degraded` on `bootstrap-compilation-failed` [guard: pipeline emitted PipelineStageFailure and no recovery path available]
- `active` → `degraded` on `gate-severity-high-block` [guard: GateDecision.severity=HIGH and operator escalation pending]
- `active` → `recompiling` on `recompilation-trigger-emitted` [guard: DriftScore >= recompilationTriggerValue=0.65]
- `active` → `recompiling` on `operator-recompile-request` [guard: operator authorized and OperatorOverride logged]
- `recompiling` → `active` on `recompilation-pipeline-complete` [guard: new CompiledInvariantSet armed and ArtifactCoherenceVerifier passed]
- `recompiling` → `degraded` on `recompilation-pipeline-failed` [guard: PipelineStageFailure emitted and no rollback available]
- `degraded` → `active` on `operator-override-resolves-block` [guard: OperatorOverride applied and AuditLogEntry written and TTL set]
- `degraded` → `recompiling` on `operator-triggers-emergency-recompile` [guard: operator authorized]
- `active` → `closing` on `session-terminate-requested` [guard: no active tool calls pending]
- `degraded` → `closing` on `session-terminate-requested` [guard: operator has acknowledged degraded state]
- `recompiling` → `closing` on `session-terminate-requested` [guard: operator confirms cancellation of in-flight compilation]
- `closing` → `closed` on `session-teardown-complete` [guard: all AuditLogEntries flushed and RuntimeWorldModel snapshot persisted]

### CompiledInvariantSet
States: pending → bootstrapped → compiling → compiled → armed → superseded → archived
Transitions:
- `pending` → `bootstrapped` on `seed-promotion` [guard: SeedInvariantSet signature valid and bootstrapFlag=true assigned]
- `pending` → `compiling` on `pipeline-stage-3-begins` [guard: InterStageIR_v2 exists and unresolved term ratio is below threshold]
- `bootstrapped` → `armed` on `bootstrap-gate-arming` [guard: SemanticGateEnforcer accepts bootstrap set]
- `compiling` → `compiled` on `pipeline-finalization-complete` [guard: CoherenceVerificationResult.status=PASS and AuditLogEntry written]
- `compiled` → `armed` on `runtime-activation` [guard: session is in bootstrapping or recompiling state and gate arming succeeds]
- `armed` → `superseded` on `new-compiled-invariant-set-armed` [guard: successor CompiledInvariantSet transitions to armed]
- `bootstrapped` → `superseded` on `bootstrap-to-compiled-transition-complete` [guard: bootstrapFlag=false CompiledInvariantSet is armed]
- `superseded` → `archived` on `retention-policy-applied` [guard: superseded for more than configured retention period and no active references]
- `compiling` → `pending` on `pipeline-stage-failure-rollback` [guard: PipelineStageFailure emitted and rollback triggered]

### RuntimeWorldModel
States: uninitialized → seeding → live → drifting → diverged → reconciling → reconciled → snapshotting
Transitions:
- `uninitialized` → `seeding` on `world-model-compilation-begins` [guard: CompiledInvariantSet is in compiling or bootstrapped state and sessionId bound]
- `seeding` → `live` on `initial-observed-state-written` [guard: observedState is structurally complete and contentHash valid]
- `live` → `drifting` on `drift-score-exceeds-projection-threshold` [guard: DriftScore.value >= projectionTriggerValue=0.25 and < recompilationTriggerValue=0.65]
- `drifting` → `live` on `projection-regeneration-succeeds` [guard: projectedState written and DriftScore decreases below projectionTriggerValue after projection]
- `drifting` → `diverged` on `drift-score-exceeds-recompilation-threshold` [guard: DriftScore.value >= recompilationTriggerValue=0.65]
- `live` → `diverged` on `sudden-large-drift-spike` [guard: DriftScore.value jumps to >= 0.65 in a single poll cycle]
- `diverged` → `reconciling` on `reconciliation-triggered` [guard: operator override or recompilation pipeline begins]
- `reconciling` → `reconciled` on `reconciliation-complete` [guard: new CompiledWorldModel applied and DriftScore < projectionTriggerValue]
- `reconciled` → `live` on `reconciliation-accepted` [guard: governor confirms stable DriftScore across 3 consecutive poll cycles]
- `live` → `snapshotting` on `snapshot-interval-elapsed` [guard: updateMechanism includes snapshot-based persistence and snapshot interval has elapsed]
- `snapshotting` → `live` on `snapshot-written` [guard: snapshot contentHash written to eventLog and version incremented]

### GovernorState
States: idle → polling → analyzing → adapting → alerting → suspended
Transitions:
- `idle` → `polling` on `polling-interval-elapsed` [guard: currentPollingIntervalMs elapsed since lastPollAt and session is active]
- `polling` → `analyzing` on `world-model-snapshot-read` [guard: RuntimeWorldModel.observedState successfully read and DriftScore computed]
- `analyzing` → `adapting` on `drift-velocity-exceeds-adaptation-trigger` [guard: isAdaptive=true and DriftVelocity.value > velocityAdaptationTriggerValue]
- `analyzing` → `idle` on `no-action-required` [guard: DriftScore < projectionTriggerValue and DriftVelocity within normal range]
- `adapting` → `idle` on `interval-adjusted` [guard: GovernorState.currentPollingIntervalMs updated and within [500ms, basePollingIntervalMs]]
- `analyzing` → `alerting` on `high-frequency-polling-storm-detected` [guard: currentPollingIntervalMs at floor for more than 10 consecutive cycles]
- `alerting` → `idle` on `operator-acknowledged-alert` [guard: OperatorOverride received or alert acknowledged]
- `idle` → `suspended` on `session-enters-closing-or-closed` [guard: session state is closing or closed]
- `suspended` → `idle` on `session-reactivated` [guard: session returns to active state]

### GateDecision
States: evaluating → allowed → blocked → actioning → resolved → escalated
Transitions:
- `evaluating` → `allowed` on `no-invariant-violations` [guard: all CompiledInvariants satisfied by ToolCall parameters]
- `evaluating` → `blocked` on `invariant-violated` [guard: at least one hardPredicate unsatisfied or semanticAnchor outside proximityThreshold]
- `blocked` → `actioning` on `post-block-action-dispatch` [guard: severity assigned and postBlockAction determined]
- `actioning` → `resolved` on `low-severity-retry-succeeds` [guard: severity=LOW and modified ToolCall passes gate re-evaluation]
- `actioning` → `resolved` on `medium-severity-replan-succeeds` [guard: severity=MEDIUM and replanned ToolCall passes gate re-evaluation]
- `actioning` → `escalated` on `high-severity-halt` [guard: severity=HIGH or retry/replan failed]
- `escalated` → `resolved` on `operator-override-applied` [guard: OperatorOverride authorized, logged, and TTL set]
- `allowed` → `resolved` on `tool-call-executed` [guard: ToolCall executed and result observed]

### DriftScore
States: uncomputed → computing → valid → stale → error
Transitions:
- `uncomputed` → `computing` on `governor-poll-initiated` [guard: RuntimeWorldModel is in live or drifting state]
- `computing` → `valid` on `composite-score-finalized` [guard: all DriftScoreComponents computed and weighted sum in [0,1]]
- `computing` → `error` on `component-computation-failed` [guard: embedding model unavailable or normalization produced NaN]
- `valid` → `stale` on `next-poll-cycle-begins` [guard: new governor poll initiated and prior DriftScore not yet superseded]
- `stale` → `computing` on `governor-poll-initiated` [guard: RuntimeWorldModel is in live or drifting state]
- `error` → `computing` on `degraded-recompute-attempted` [guard: at least one DriftScoreComponent available for degraded composite]

## Open Questions
- What are the default numeric values for DriftThreshold.projectionTriggerValue and DriftThreshold.recompilationTriggerValue? Entity defines ordering (projection < recompilation ≤ 1) but not initial calibration values.
- What are the default weights for the three DriftScoreComponent types (EMBEDDING_DISTANCE, STRUCTURAL_DIFF, PREDICATE_SATISFACTION_RATIO)? The composite metric is defined but weight allocation is unspecified.
- What is the governor's default basePollingIntervalMs? Entity requires it to be > 0 and co-designed with world model update frequency (C8), but no default is specified.
- What is the minimum floor for governor polling interval adaptation? currentPollingIntervalMs <= basePollingIntervalMs defines the ceiling, but no lower bound prevents the governor from polling at impractically high frequencies.
- How does the system handle session resumption after a crash or unexpected termination? Session state machine has no 'resuming' state, and RuntimeWorldModel event log recoverability is unspecified.
- Can the pipeline re-enter prior stages (e.g., GOV stage detecting invariant conflict and feeding back to INT stage), or is it strictly feedforward? U14 is unresolved and affects PipelineOrchestrator's orchestration logic.
- What specific transformations does each of the 9 pipeline stages perform on the InterStageIR payload? Stage names map to workflow steps but the semantic content of each transformation is undefined.
- What is the maximum retry count for a PipelineStageFailure before the compilation run is abandoned? Entity tracks retryCount but no ceiling is defined.
- What specific predicates or checks constitute the SeedInvariantSet's designer signature validation? Entity requires designerSignature !== null but the cryptographic scheme is unspecified.
- What is the exact payload schema for each stage-specific InterStageIR payload? The envelope is uniform but payload schemas per stage are not defined.
- How does DriftScoreComputer handle the case where OntologyBaseLayer embeddings have changed between compilation and runtime — does it recompute baselines or flag an ontology drift event?
- What constitutes a 'session' boundary for multi-project scenarios — is it one session per project, per intent, or per operator interaction?
- What is the DriftThreshold.velocityAdaptationTriggerValue used for — does it trigger additional governor behavior beyond polling interval adjustment?

---
*Generated by Ada projection engine — do not edit manually.*
*Source: .ada/state.json — re-emit with `ada.project("docs")`*