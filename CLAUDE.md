# ada is a stateless CLI compiler that ingests natural language intent, decomposes it into semantic fragments via Anthropic LLM inference, resolves ambiguities through an interactive clarification loop, emits structured entity models and process flows, validates the assembled blueprint against governance rules, records full provenance for every derived element, and writes the final governed blueprint to stdout or file — producing a deterministic, auditable, machine-readable artifact without executing anything
## Status: GHOST — new project

## Summary
ada is a stateless CLI compiler that ingests natural language intent, decomposes it into semantic fragments via Anthropic LLM inference, resolves ambiguities through an interactive clarification loop, emits structured entity models and process flows, validates the assembled blueprint against governance rules, records full provenance for every derived element, and writes the final governed blueprint to stdout or file — producing a deterministic, auditable, machine-readable artifact without executing anything.

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
**Rationale:** The compile-intent-to-blueprint workflow defines 10 sequential stages where each stage's output feeds the next. CompilationRun's state machine (INITIALIZED → PARSING → SEMANTIC_ANALYSIS → EMITTING → GOVERNANCE_CHECK → COMPLETE → WRITTEN) enforces ordering. Provenance recording at each stage boundary acts as a gate — no stage output is accepted without a ProvenanceRecord linking it to its input fragment, producing stage, and prompt version. This is a compiler architecture: lex → parse → analyze → emit → validate → serialize.

## Components
### CLIHostController
**Responsibility:** Entry point for the ada CLI. Parses command-line arguments (compile, config subcommands), resolves APIKeyConfiguration from flags, environment variables, or persisted config, initializes the PromptRegistry, and delegates to CompilationOrchestrator or ConfigurationManager. Owns the AdaCLI entity lifecycle and provides stdout/stderr I/O services to downstream components including the ClarificationLoop's interactive prompts.
**Bounded Context:** CLIHost
**Interfaces:** execute(argv: string[]): Promise<ExitCode>, resolveAPIKey(options: CLIOptions): APIKeyConfiguration, initializePromptRegistry(): PromptRegistry, writeOutput(blueprint: Blueprint, format: OutputFormat): void, promptUser(question: string): Promise<string>

### PromptRegistryManager
**Responsibility:** Manages the lifecycle of PinnedPrompt templates and the PromptRegistry. Loads prompt templates from bundled files, resolves the active version for each CompilerStage target, and provides version-pinned prompt text to any compilation stage that performs LLM inference. Ensures that DeterminismMetadata can record which prompt version was used for reproducibility.
**Bounded Context:** CLIHost
**Interfaces:** loadRegistry(): PromptRegistry, getPromptForStage(stageId: string, registryVersion: string): PinnedPrompt, getActiveVersion(): string, listEntries(): PinnedPrompt[]
**Dependencies:** CLIHostController

### ProvenanceTracker
**Responsibility:** Cross-cutting infrastructure service that creates, indexes, and validates ProvenanceRecords. Every component that derives a blueprint element calls this service to record the intentFingerprint, sourceFragment, producingStage, promptVersionRef, and reasoningSummary. Builds the provenanceIndex that is attached to the final Blueprint. Enforces the invariant that no blueprint element exists without a traceable provenance chain back to the original intent.
**Bounded Context:** ProvenanceTracking
**Interfaces:** recordProvenance(intentFingerprint: string, sourceFragment: SemanticFragment, producingStage: string, promptVersionRef: string, reasoningSummary: string): ProvenanceRecord, buildProvenanceIndex(records: ProvenanceRecord[]): ProvenanceIndex, validateChainIntegrity(index: ProvenanceIndex, intentFingerprint: string): ValidationResult, getRecordById(recordId: string): ProvenanceRecord

### CompilationOrchestrator
**Responsibility:** Owns the CompilationRun lifecycle and coordinates the sequential pipeline stages. Creates a CompilationRun in INITIALIZED state, advances it through PARSING → SEMANTIC_ANALYSIS → EMITTING → GOVERNANCE_CHECK → COMPLETE/FAILED states by invoking domain components in order. Manages DeterminismMetadata (temperature, modelId, promptRegistryVersion, structuredOutputEnforced) for each run. Handles stage failures by transitioning CompilationRun to FAILED state. Routes to fallback path when ambiguities remain unresolved.
**Bounded Context:** SemanticCompilation
**Interfaces:** compile(intent: Intent, config: APIKeyConfiguration, registry: PromptRegistry): Promise<CompilationRun>, advanceStage(run: CompilationRun, stage: CompilerStage): Promise<CompilationRun>, buildDeterminismMetadata(registry: PromptRegistry, modelConfig: ModelConfig): DeterminismMetadata, handleStageFailure(run: CompilationRun, error: StageError): CompilationRun
**Dependencies:** PromptRegistryManager, ProvenanceTracker, IntentParser, AmbiguityResolver, EntityModelEmitter, ProcessFlowEmitter, BlueprintAssembler, GovernanceValidator

### IntentParser
**Responsibility:** Handles the first three stages of the compilation pipeline: ingests raw intent text, tokenizes it into TextSpans with character offsets, and extracts SemanticFragments with roles (action, entity, constraint, qualifier) and source span references. Uses Anthropic LLM inference with pinned prompts and structured output to decompose natural language into typed semantic units. Computes the intent fingerprint for determinism tracking. Transitions Intent from CREATED → SPANNED → FRAGMENTED.
**Bounded Context:** IntentIngestion
**Interfaces:** ingestIntent(rawText: string): Intent, tokenizeAndSpan(intent: Intent): TextSpan[], extractSemanticFragments(intent: Intent, spans: TextSpan[], prompt: PinnedPrompt): Promise<SemanticFragment[]>, computeFingerprint(rawText: string): string
**Dependencies:** PromptRegistryManager, ProvenanceTracker

### AmbiguityResolver
**Responsibility:** Evaluates SemanticFragments for ambiguity, creates AmbiguityMarkers for underspecified or polysemous fragments, and manages the ClarificationLoop — prompting the user interactively for answers via CLIHostController's promptUser interface. Collects ClarificationAnswers and applies them to refine the intent's semantic fragments. Supports a fallback mode (--no-clarify) that skips interactive prompting and marks unresolved ambiguities for FallbackBlueprintResult. Transitions Intent from FRAGMENTED → AWAITING_CLARIFICATION → UNAMBIGUOUS or PARTIALLY_RESOLVED.
**Bounded Context:** IntentIngestion
**Interfaces:** evaluateAmbiguity(fragments: SemanticFragment[], prompt: PinnedPrompt): Promise<AmbiguityMarker[]>, runClarificationLoop(markers: AmbiguityMarker[], promptUser: PromptUserFn): Promise<ClarificationAnswer[]>, applyAnswers(fragments: SemanticFragment[], answers: ClarificationAnswer[]): SemanticFragment[], produceFallbackMarkers(markers: AmbiguityMarker[]): UncertaintyMarker[]
**Dependencies:** CLIHostController, PromptRegistryManager, ProvenanceTracker

### EntityModelEmitter
**Responsibility:** Uses Anthropic LLM inference with pinned prompts to derive EntityModel definitions from unambiguous SemanticFragments. Emits EntityModels with their AttributeDefinitions, RelationshipDefinitions (with cardinality and self-referencing prevention), and ConstraintDefinitions. Each emitted entity carries a provenanceRef linking it to the source fragment and producing stage. Operates during the EMITTING phase of CompilationRun.
**Bounded Context:** BlueprintArtifact
**Interfaces:** emitEntityModels(fragments: SemanticFragment[], prompt: PinnedPrompt): Promise<EntityModel[]>, emitAttributes(entityModel: EntityModel, fragments: SemanticFragment[]): AttributeDefinition[], emitRelationships(entityModels: EntityModel[], fragments: SemanticFragment[]): RelationshipDefinition[], emitConstraints(entityModels: EntityModel[], fragments: SemanticFragment[]): ConstraintDefinition[]
**Dependencies:** PromptRegistryManager, ProvenanceTracker

### ProcessFlowEmitter
**Responsibility:** Uses Anthropic LLM inference with pinned prompts to derive ProcessFlow definitions from unambiguous SemanticFragments. Emits ProcessFlows containing ordered ProcessSteps, DecisionNodes (with minimum 2 branches), and Transitions (with self-transition prevention). Each emitted element carries a provenanceRef. Operates during the EMITTING phase of CompilationRun alongside EntityModelEmitter.
**Bounded Context:** BlueprintArtifact
**Interfaces:** emitProcessFlows(fragments: SemanticFragment[], prompt: PinnedPrompt): Promise<ProcessFlow[]>, emitSteps(processFlow: ProcessFlow, fragments: SemanticFragment[]): ProcessStep[], emitDecisionNodes(processFlow: ProcessFlow, fragments: SemanticFragment[]): DecisionNode[], emitTransitions(steps: ProcessStep[], decisions: DecisionNode[]): Transition[]
**Dependencies:** PromptRegistryManager, ProvenanceTracker

### BlueprintAssembler
**Responsibility:** Assembles the final Blueprint entity from EntityModel and ProcessFlow outputs. Sets schemaVersion, sourceIntentFingerprint, and determinismMetadata. Attaches the provenanceIndex built by ProvenanceTracker. Initializes governanceStatus to PENDING_GOVERNANCE. Handles the fallback path by producing FallbackBlueprintResult when the intent was only partially resolved (uncertainty markers from AmbiguityResolver). Transitions Blueprint from ABSENT → ASSEMBLING → PENDING_GOVERNANCE or produces FallbackBlueprintResult.
**Bounded Context:** BlueprintArtifact
**Interfaces:** assembleBlueprint(entityModels: EntityModel[], processFlows: ProcessFlow[], intentFingerprint: string, determinism: DeterminismMetadata, provenanceIndex: ProvenanceIndex): Blueprint, produceFallbackResult(partialBlueprint: Partial<Blueprint>, uncertaintyMarkers: UncertaintyMarker[], reason: string): FallbackBlueprintResult, attachProvenanceIndex(blueprint: Blueprint, index: ProvenanceIndex): Blueprint
**Dependencies:** ProvenanceTracker

### GovernanceValidator
**Responsibility:** Evaluates an assembled Blueprint against the BlueprintSchema's ValidationRules. Produces a GovernanceStatus with a verdict (COMPLIANT or VIOLATED), a list of PolicyViolations referencing specific violated rules and affected elements, and an auditTrailRef. Does NOT execute or simulate the blueprint — governance is structural, not environmental (per domain exclusion). Transitions Blueprint from PENDING_GOVERNANCE → COMPLIANT or VIOLATED.
**Bounded Context:** BlueprintArtifact
**Interfaces:** validateGovernance(blueprint: Blueprint, schema: BlueprintSchema): GovernanceStatus, evaluateRule(rule: ValidationRule, blueprint: Blueprint): PolicyViolation | null, buildAuditTrail(status: GovernanceStatus, violations: PolicyViolation[]): AuditTrail
**Dependencies:** SchemaManager

### SchemaManager
**Responsibility:** Owns the BlueprintSchema definition including FieldDefinitions and ValidationRules. Loads and resolves the active schema version. Provides structural validation (field presence, type conformance) separate from governance validation (policy compliance). Validates that a blueprint conforms to the schema before governance evaluation. Transitions Blueprint to SCHEMA_INVALID if structural validation fails.
**Bounded Context:** SchemaGovernance
**Interfaces:** loadSchema(version: string): BlueprintSchema, validateStructure(blueprint: Blueprint, schema: BlueprintSchema): StructuralValidationResult, getFieldDefinitions(schemaId: string): FieldDefinition[], getValidationRules(schemaId: string): ValidationRule[]

### AnthropicInferenceAdapter
**Responsibility:** Infrastructure adapter that wraps the Anthropic API client. Accepts a PinnedPrompt template, intent context, and DeterminismMetadata parameters (temperature, modelId), makes the API call with structured output enforcement, and returns the typed response. Centralizes all LLM interaction to enforce C2 (Anthropic only), C4 (determinism controls), and API key usage. Every component that needs LLM inference calls this adapter rather than the Anthropic SDK directly.
**Bounded Context:** CLIHost
**Interfaces:** infer(prompt: PinnedPrompt, context: InferenceContext, determinism: DeterminismMetadata): Promise<StructuredResponse>, validateAPIKey(config: APIKeyConfiguration): Promise<KeyValidationResult>, buildRequest(prompt: PinnedPrompt, context: InferenceContext, temperature: number): AnthropicRequest
**Dependencies:** CLIHostController

### BlueprintSerializer
**Responsibility:** Serializes a validated Blueprint (or FallbackBlueprintResult) to the output format. Performs final schema conformance check. Writes to stdout by default or to a file path if specified. Handles the WRITTEN terminal state of Blueprint. Ensures machine-readability per G5.
**Bounded Context:** BlueprintArtifact
**Interfaces:** serialize(blueprint: Blueprint, format: OutputFormat): string, serializeFallback(fallback: FallbackBlueprintResult, format: OutputFormat): string, writeToTarget(serialized: string, target: OutputTarget): void
**Dependencies:** SchemaManager, CLIHostController

## Invariants
Hooks enforce these at tool boundaries. Do not violate them.

### AdaCLI
- `adaCLI.name === 'ada'` — tool name is fixed as 'ada'
- `adaCLI.license === 'MIT'` — project must be MIT licensed
- `adaCLI.apiKeyConfig !== null` — API key configuration must be present
- `adaCLI.activePromptRegistry !== null` — prompt registry must be bound at startup

### APIKeyConfiguration
- `apiKeyConfiguration.keyValue !== null && apiKeyConfiguration.keyValue.length > 0` — key value must be non-empty
- `apiKeyConfiguration.source !== null` — key source must be declared
- `apiKeyConfiguration.provider !== null` — provider must be identified

### Intent
- `intent.rawText !== null && intent.rawText.trim().length > 0` — intent must contain non-empty text
- `intent.fingerprint !== null` — every intent must have a stable identity fingerprint
- `intent.submittedAt !== null` — submission timestamp must be recorded

### SemanticFragment
- `semanticFragment.fragmentId !== null` — fragment must have a unique identifier
- `semanticFragment.role !== null` — fragment must have an assigned semantic role
- `semanticFragment.sourceIntentSpan !== null` — fragment must trace back to a span in the original intent

### TextSpan
- `textSpan.startIndex >= 0` — span start must be non-negative
- `textSpan.endIndex > textSpan.startIndex` — span end must be after start
- `textSpan.text !== null && textSpan.text.length > 0` — span must reference non-empty text

### EntityModel
- `entityModel.entityModelId !== null` — entity model must have a unique id
- `entityModel.domainType !== null && entityModel.domainType.length > 0` — entity model must declare its domain type
- `entityModel.attributes !== null` — attributes list must be initialized
- `entityModel.provenanceRef !== null` — every entity model must carry a provenance reference

### AttributeDefinition
- `attributeDefinition.attributeName !== null && attributeDefinition.attributeName.length > 0` — attribute must be named
- `attributeDefinition.dataType !== null` — attribute must declare a data type

### RelationshipDefinition
- `relationshipDefinition.sourceEntityModelId !== null` — relationship must have a source entity
- `relationshipDefinition.targetEntityModelId !== null` — relationship must have a target entity
- `relationshipDefinition.sourceEntityModelId !== relationshipDefinition.targetEntityModelId` — self-referential relationships must be explicitly typed and are not default
- `relationshipDefinition.cardinality !== null` — cardinality must be declared

### ConstraintDefinition
- `constraintDefinition.constraintId !== null` — constraint must be identified
- `constraintDefinition.expression !== null && constraintDefinition.expression.length > 0` — constraint must have a non-empty predicate expression
- `constraintDefinition.scope !== null` — constraint scope must be declared

### ProcessFlow
- `processFlow.processFlowId !== null` — flow must have a unique identifier
- `processFlow.steps !== null && processFlow.steps.length > 0` — a process flow must contain at least one step
- `processFlow.provenanceRef !== null` — process flow must carry provenance

### ProcessStep
- `processStep.stepId !== null` — step must have an id
- `processStep.ordinalPosition >= 0` — position must be non-negative
- `processStep.description !== null && processStep.description.length > 0` — step must have a description
- `processStep.provenanceRef !== null` — every step must be traceable to intent

### DecisionNode
- `decisionNode.nodeId !== null` — decision node must have an id
- `decisionNode.condition !== null && decisionNode.condition.length > 0` — decision must have a condition expression
- `decisionNode.branches !== null && decisionNode.branches.length >= 2` — decision node must have at least two branches
- `decisionNode.provenanceRef !== null` — decision node must be traceable

### Transition
- `transition.transitionId !== null` — transition must be identified
- `transition.fromStepId !== null` — transition must have a source step
- `transition.toStepId !== null` — transition must have a target step
- `transition.fromStepId !== transition.toStepId` — transitions must not loop to same step without explicit cycle marker

### ProvenanceRecord
- `provenanceRecord.recordId !== null` — provenance record must have a unique id
- `provenanceRecord.intentFingerprint !== null` — provenance must reference the source intent
- `provenanceRecord.sourceFragment !== null` — provenance must reference the specific semantic fragment
- `provenanceRecord.producingStage !== null` — the compiler stage that produced the element must be recorded
- `provenanceRecord.promptVersionRef !== null` — prompt version used must be captured
- `provenanceRecord.reasoningSummary !== null && provenanceRecord.reasoningSummary.length > 0` — reasoning behind the element must be recorded

### Blueprint
- `blueprint.blueprintId !== null` — blueprint must have a unique id
- `blueprint.schemaVersion !== null` — schema version must be declared
- `blueprint.sourceIntentFingerprint !== null` — blueprint must reference its source intent
- `blueprint.entityModels !== null` — entity models collection must be initialized
- `blueprint.processFlows !== null` — process flows collection must be initialized
- `blueprint.governanceStatus !== null` — governance status must be present on every blueprint
- `blueprint.provenanceIndex !== null` — provenance index must be present
- `blueprint.determinismMetadata !== null` — determinism metadata must be recorded

### BlueprintSchema
- `blueprintSchema.schemaId !== null` — schema must be identified
- `blueprintSchema.version !== null && blueprintSchema.version.length > 0` — schema version must be non-empty
- `blueprintSchema.fieldDefinitions !== null && blueprintSchema.fieldDefinitions.length > 0` — schema must define at least one field
- `blueprintSchema.requiredComponents !== null` — required components list must be declared

### FieldDefinition
- `fieldDefinition.fieldName !== null && fieldDefinition.fieldName.length > 0` — field must have a name
- `fieldDefinition.fieldType !== null` — field must declare a type

### ValidationRule
- `validationRule.ruleId !== null` — rule must be identified
- `validationRule.predicate !== null && validationRule.predicate.length > 0` — rule must have a predicate expression
- `validationRule.severity !== null` — severity must be declared

### GovernanceStatus
- `governanceStatus.statusId !== null` — status must be identified
- `governanceStatus.verdict !== null` — verdict must be assigned
- `governanceStatus.violations !== null` — violations list must be initialized even if empty
- `governanceStatus.auditTrailRef !== null` — audit trail reference must be present
- `governanceStatus.evaluatedAt !== null` — evaluation timestamp must be recorded

### PolicyViolation
- `policyViolation.violationId !== null` — violation must be identified
- `policyViolation.violatedRuleId !== null` — violation must reference the rule that was violated
- `policyViolation.affectedElementId !== null` — violation must reference the affected blueprint element

### CompilerStage
- `compilerStage.stageId !== null` — stage must be identified
- `compilerStage.name !== null` — stage must have a declared name
- `compilerStage.inputSchema !== null` — stage must declare its input schema
- `compilerStage.outputSchema !== null` — stage must declare its output schema
- `compilerStage.pinnedPromptRef !== null` — every stage must reference a pinned prompt

### PinnedPrompt
- `pinnedPrompt.promptId !== null` — prompt must be identified
- `pinnedPrompt.version !== null && pinnedPrompt.version.length > 0` — prompt version must be non-empty
- `pinnedPrompt.templateText !== null && pinnedPrompt.templateText.length > 0` — prompt must have template text
- `pinnedPrompt.stageTarget !== null` — prompt must declare which stage it targets
- `pinnedPrompt.structuredOutputSchema !== null` — prompt must declare its expected output schema

### PromptRegistry
- `promptRegistry.registryId !== null` — registry must be identified
- `promptRegistry.entries !== null && promptRegistry.entries.length > 0` — registry must contain at least one prompt
- `promptRegistry.activeVersion !== null` — registry must declare an active version

### DeterminismMetadata
- `determinismMetadata.modelId !== null && determinismMetadata.modelId.length > 0` — model identifier must be recorded
- `determinismMetadata.temperature >= 0 && determinismMetadata.temperature <= 1` — temperature must be in valid range
- `determinismMetadata.promptRegistryVersion !== null` — prompt registry version used must be recorded
- `determinismMetadata.structuredOutputEnforced !== null` — structured output enforcement flag must be set

### ClarificationLoop
- `clarificationLoop.loopId !== null` — loop must be identified
- `clarificationLoop.sourceIntentFingerprint !== null` — loop must reference the originating intent
- `clarificationLoop.detectedAmbiguities !== null && clarificationLoop.detectedAmbiguities.length > 0` — clarification loop must have at least one detected ambiguity
- `clarificationLoop.collectedAnswers !== null` — answers collection must be initialized

### AmbiguityMarker
- `ambiguityMarker.markerId !== null` — marker must be identified
- `ambiguityMarker.affectedFragmentId !== null` — marker must reference its fragment
- `ambiguityMarker.ambiguityType !== null` — ambiguity type must be classified
- `ambiguityMarker.question !== null && ambiguityMarker.question.length > 0` — ambiguity must produce a question for the user

### ClarificationAnswer
- `clarificationAnswer.answerId !== null` — answer must be identified
- `clarificationAnswer.markerRef !== null` — answer must reference its ambiguity marker
- `clarificationAnswer.answerText !== null && clarificationAnswer.answerText.length > 0` — answer must contain text
- `clarificationAnswer.appliedToIntentSpan !== null` — answer must reference the intent span it resolves

### FallbackBlueprintResult
- `fallbackBlueprintResult.resultId !== null` — fallback result must be identified
- `fallbackBlueprintResult.uncertaintyMarkers !== null && fallbackBlueprintResult.uncertaintyMarkers.length > 0` — fallback must carry at least one uncertainty marker
- `fallbackBlueprintResult.fallbackReason !== null && fallbackBlueprintResult.fallbackReason.length > 0` — fallback reason must be declared

### CompilationRun
- `compilationRun.runId !== null` — run must be identified
- `compilationRun.sourceIntent !== null` — every run must have a source intent
- `compilationRun.stagesExecuted !== null` — stages executed list must be initialized
- `(compilationRun.resultBlueprintId !== null) || (compilationRun.fallbackResultId !== null)` — a completed run must produce either a blueprint or a fallback result
- `compilationRun.startedAt !== null` — run start time must be recorded
- `compilationRun.determinismMetadata !== null` — determinism metadata must be captured per run

## Workflows
### compile-intent-to-blueprint
**Trigger:** user executes `ada compile "<natural language intent>"`

**ingest-raw-intent** (enables)
- Pre: rawText is non-empty string AND apiKeyConfig.keyValue is present AND apiKeyConfig.provider is reachable
- Action: create Intent record with submittedAt timestamp, compute fingerprint hash of rawText, initialize ambiguityScore to null
- Post: Intent exists with fingerprint assigned AND submittedAt recorded AND ambiguityScore is null (pending analysis)
- Failure (precondition): rawText is empty or whitespace-only → emit validation error 'INTENT_EMPTY', exit with code 1
- Failure (precondition): apiKeyConfig.keyValue is missing or provider is unreachable → emit error 'API_KEY_UNAVAILABLE', prompt user to configure key via `ada config set-key`, exit with code 2
- Failure (action): fingerprint hashing fails due to encoding error → log warning, assign UUID as fallback fingerprint, continue

**tokenize-and-span** (enables)
- Pre: Intent record exists with non-null rawText AND fingerprint is assigned
- Action: segment rawText into TextSpan array by sentence and clause boundaries, assign startIndex and endIndex to each span
- Post: one or more TextSpan records exist referencing the Intent AND every character of rawText is covered by at least one span
- Failure (action): tokenizer produces zero spans (e.g. purely punctuation input) → emit error 'SPAN_EMPTY', abort compilation, surface message 'Intent produced no parseable spans'
- Failure (postcondition): coverage check fails — gap detected between spans → log warning 'SPAN_GAP_DETECTED', insert a residual TextSpan covering the gap with role=UNKNOWN

**extract-semantic-fragments** (enables)
- Pre: TextSpan array is non-empty AND CompilationRun is in state PARSING AND PinnedPrompt for stage FRAGMENT_EXTRACTION is loaded from PromptRegistry
- Action: invoke LLM with pinned prompt at temperature=0.0 and structured-output schema, map each TextSpan to one or more SemanticFragment records with role (ENTITY_HINT | PROCESS_HINT | CONSTRAINT_HINT | AMBIGUOUS) and normalizedValue
- Post: every TextSpan has at least one SemanticFragment AND each SemanticFragment has a role AND ambiguous flag is set on fragments with role=AMBIGUOUS
- Failure (precondition): PinnedPrompt for FRAGMENT_EXTRACTION not found in PromptRegistry → emit error 'PROMPT_NOT_PINNED', halt compilation, advise user to run `ada registry repair`
- Failure (action): LLM returns malformed JSON or violates structured-output schema → retry up to 2 times with same prompt; on third failure emit 'LLM_SCHEMA_VIOLATION', record DeterminismMetadata.schemaViolationCount++, abort stage
- Failure (action): LLM call times out or returns 5xx → apply exponential backoff with 3 retries; if all fail emit 'LLM_UNREACHABLE', transition CompilationRun to FAILED
- Failure (postcondition): one or more TextSpans have zero fragments assigned → create SemanticFragment with role=AMBIGUOUS, ambiguous=true for each uncovered span, increment Intent.ambiguityScore

**evaluate-ambiguity** (guards)
- Pre: all SemanticFragments are assigned AND Intent.ambiguityScore is computable from fragment count where ambiguous=true
- Action: compute ambiguityScore as ratio of ambiguous fragments to total fragments, compare against configured AMBIGUITY_THRESHOLD; if score exceeds threshold transition to ClarificationLoop, else mark Intent as UNAMBIGUOUS
- Post: Intent.ambiguityScore is a decimal in [0.0, 1.0] AND Intent is in state UNAMBIGUOUS or AWAITING_CLARIFICATION
- Failure (action): AMBIGUITY_THRESHOLD not configured → apply default threshold of 0.3, log warning 'USING_DEFAULT_AMBIGUITY_THRESHOLD'
- Failure (action): clarification loop invoked but stdin is not a TTY (non-interactive mode) → emit structured FallbackBlueprintResult with all ambiguous fragments marked as UNRESOLVED, attach ProvenanceRecord noting fallback reason, continue to emit partial blueprint

**run-clarification-loop** (requires)
- Pre: Intent is in state AWAITING_CLARIFICATION AND at least one SemanticFragment has ambiguous=true AND stdin is a TTY
- Action: for each ambiguous SemanticFragment in priority order: render clarification prompt to stdout, read ClarificationAnswer from stdin, update fragment normalizedValue and set ambiguous=false, record ClarificationAnswer linked to fragment
- Post: all previously ambiguous SemanticFragments have ambiguous=false OR user has explicitly skipped them AND Intent transitions to UNAMBIGUOUS or PARTIALLY_RESOLVED
- Failure (action): user provides empty answer for a non-skippable fragment → re-prompt up to 2 times, then mark fragment as UNRESOLVED and continue
- Failure (action): user sends interrupt signal (Ctrl+C) during loop → gracefully exit loop, mark all remaining fragments as UNRESOLVED, transition Intent to PARTIALLY_RESOLVED, proceed with partial compilation
- Failure (postcondition): one or more fragments remain UNRESOLVED after loop → emit warning 'PARTIAL_RESOLUTION', continue to emit FallbackBlueprintResult for unresolved fragments

**emit-entity-models** (concurrent)
- Pre: SemanticFragments with role=ENTITY_HINT exist AND Intent is UNAMBIGUOUS or PARTIALLY_RESOLVED AND CompilationRun is in state SEMANTIC_ANALYSIS AND PinnedPrompt for ENTITY_EMISSION is loaded
- Action: invoke LLM with pinned entity-emission prompt at temperature=0.0; for each ENTITY_HINT fragment generate EntityModel with domainType, AttributeDefinitions, RelationshipDefinitions, ConstraintDefinitions; attach provenanceRef linking to source SemanticFragment and TextSpan
- Post: one EntityModel exists per distinct ENTITY_HINT fragment AND each EntityModel.provenanceRef is non-null AND each EntityModel has at least one AttributeDefinition
- Failure (precondition): no fragments with role=ENTITY_HINT exist → emit warning 'NO_ENTITY_HINTS', produce empty EntityModel list, continue to process flow emission
- Failure (action): LLM generates duplicate entityModelId values → detect collision, regenerate conflicting ID with UUID suffix, log 'ENTITY_ID_COLLISION_RESOLVED'
- Failure (postcondition): EntityModel produced with zero AttributeDefinitions → insert synthetic attribute 'id' of dataType=string required=true as minimum viable attribute, log 'SYNTHETIC_ATTRIBUTE_INJECTED'

**emit-process-flows** (concurrent)
- Pre: SemanticFragments with role=PROCESS_HINT exist AND Intent is UNAMBIGUOUS or PARTIALLY_RESOLVED AND CompilationRun is in state SEMANTIC_ANALYSIS AND PinnedPrompt for PROCESS_EMISSION is loaded
- Action: invoke LLM with pinned process-emission prompt at temperature=0.0; generate ProcessFlow with ordered ProcessSteps, DecisionNodes, and Transitions; assign ordinalPosition to each step; attach provenanceRef per step and decision node
- Post: one ProcessFlow exists per coherent PROCESS_HINT cluster AND each ProcessStep has ordinalPosition >= 1 AND no two steps share the same ordinalPosition within a flow AND all provenanceRefs are non-null
- Failure (precondition): no fragments with role=PROCESS_HINT exist → emit warning 'NO_PROCESS_HINTS', produce empty ProcessFlow list, continue
- Failure (action): LLM produces a cycle in step ordinal sequence → run cycle-detection on step graph; if cycle found emit error 'PROCESS_CYCLE_DETECTED', mark CompilationRun stage as DEGRADED, emit partial flow with cycle annotated
- Failure (postcondition): DecisionNode references a branch target stepId that does not exist in the flow → emit warning 'DANGLING_BRANCH_TARGET', insert a terminal ProcessStep as placeholder for the missing target

**assemble-blueprint** (requires)
- Pre: EntityModel list and ProcessFlow list are both produced (may be empty) AND all ProvenanceRecords are written AND CompilationRun is in state EMITTING
- Action: instantiate Blueprint record linking EntityModels, ProcessFlows, ProvenanceRecords, and DeterminismMetadata; assign blueprintId; set GovernanceStatus to PENDING; serialize to BlueprintSchema-validated JSON
- Post: Blueprint record exists with non-null blueprintId AND all linked entity and process artefacts are reachable from Blueprint AND GovernanceStatus is PENDING AND serialized JSON conforms to BlueprintSchema
- Failure (action): serialization fails due to circular reference in relationship graph → break circular ref using ProvenanceRecord id reference only, log 'CIRCULAR_REF_BROKEN_IN_SERIALIZATION'
- Failure (postcondition): serialized JSON fails BlueprintSchema validation → emit error 'SCHEMA_VALIDATION_FAILED' with field-level diff, transition CompilationRun to FAILED, write partial blueprint to .ada/failed/ for inspection

**validate-governance** (guards)
- Pre: Blueprint exists with GovernanceStatus=PENDING AND BlueprintSchema is loaded AND ValidationRules are loaded from SchemaGovernance context
- Action: evaluate each ValidationRule against Blueprint; collect PolicyViolations; if zero violations set GovernanceStatus=COMPLIANT; if violations exist set GovernanceStatus=VIOLATED and attach PolicyViolation list to Blueprint
- Post: GovernanceStatus is COMPLIANT or VIOLATED (never PENDING) AND PolicyViolation list is empty iff GovernanceStatus=COMPLIANT AND CompilationRun transitions to COMPLETE or GOVERNANCE_FAILED
- Failure (precondition): ValidationRules list is empty (misconfigured governance) → emit warning 'NO_GOVERNANCE_RULES', set GovernanceStatus=UNVALIDATED, allow blueprint emission with audit flag
- Failure (action): a ValidationRule evaluation throws an exception (malformed rule expression) → skip the failing rule, record it as PolicyViolation with severity=RULE_ERROR, continue evaluating remaining rules
- Failure (postcondition): GovernanceStatus=VIOLATED and user has --strict flag set → block blueprint output to stdout, write violations report to stderr, exit with code 3

**write-blueprint-output** (requires)
- Pre: Blueprint GovernanceStatus is COMPLIANT or UNVALIDATED or (VIOLATED and --strict is NOT set) AND CompilationRun is in state COMPLETE or GOVERNANCE_FAILED with non-strict mode
- Action: write serialized Blueprint JSON to stdout or to --output file path; write ProvenanceRecord manifest to sidecar file if --provenance flag set; print compilation summary to stderr
- Post: Blueprint JSON is written to destination without truncation AND if --provenance flag set then ProvenanceRecord sidecar file exists AND CompilationRun transitions to WRITTEN
- Failure (precondition): output file path is not writable → emit error 'OUTPUT_NOT_WRITABLE', fall back to stdout if --output was specified, log warning
- Failure (action): disk write fails mid-stream (disk full) → emit error 'WRITE_INTERRUPTED', delete partial file, advise user, exit with code 4
- Failure (postcondition): written file byte count does not match serialized blueprint byte count → emit error 'WRITE_INTEGRITY_FAILURE', delete file, exit with code 4

### configure-api-key
**Trigger:** user executes `ada config set-key --provider <name> --key <value>` or `ada config set-key --env <VAR>`

**resolve-key-source** (enables)
- Pre: CLI arguments are parsed AND either --key flag or --env flag is present (not both)
- Action: if --key provided: set keyValue from flag, set source=CLI_FLAG; if --env provided: read environment variable named by flag value, set keyValue from env var, set source=ENV_VAR
- Post: APIKeyConfiguration record has keyValue set to non-empty string AND source is CLI_FLAG or ENV_VAR AND provider is set from --provider flag
- Failure (precondition): both --key and --env flags provided simultaneously → emit error 'AMBIGUOUS_KEY_SOURCE', print usage hint, exit with code 1
- Failure (precondition): neither --key nor --env flag provided → emit error 'NO_KEY_SOURCE', print usage hint, exit with code 1
- Failure (action): environment variable named by --env does not exist → emit error 'ENV_VAR_NOT_FOUND', list available env vars matching 'ADA_*' or 'OPENAI_*' as hints, exit with code 1

**validate-key-format** (enables)
- Pre: APIKeyConfiguration.keyValue is non-empty AND APIKeyConfiguration.provider is known provider string
- Action: apply provider-specific regex pattern to keyValue to verify structural format (e.g. 'sk-' prefix for OpenAI); do NOT make network call
- Post: keyValue passes structural validation for the declared provider
- Failure (precondition): provider string is unrecognized → emit warning 'UNKNOWN_PROVIDER', skip format validation, proceed with storage using provider=GENERIC
- Failure (action): keyValue fails structural format check → emit warning 'KEY_FORMAT_SUSPICIOUS', prompt user to confirm with y/n; if n abort; if y continue with flag stored in APIKeyConfiguration

**persist-key-configuration** (enables)
- Pre: APIKeyConfiguration is structurally valid AND target config file path is known (default: ~/.ada/config.json) AND parent directory exists or can be created
- Action: create parent directory if absent; write APIKeyConfiguration to config file with permissions 0600; if file already exists merge provider entry without overwriting other providers
- Post: config file exists at target path with permissions 0600 AND contains the new provider entry AND previously stored providers are preserved
- Failure (precondition): home directory is not resolvable → emit error 'HOME_DIR_UNRESOLVABLE', ask user to set --config-path explicitly, exit with code 2
- Failure (action): file write fails due to permissions → emit error 'CONFIG_WRITE_DENIED', suggest `sudo chown $USER ~/.ada`, exit with code 2
- Failure (action): existing config file is malformed JSON → back up malformed file to config.json.bak, write fresh config, emit warning 'CONFIG_BACKUP_CREATED'
- Failure (postcondition): file permissions are not 0600 after write (e.g. umask override) → explicitly call chmod 0600, if chmod fails emit warning 'INSECURE_KEY_FILE_PERMISSIONS'

**verify-key-liveness** (compensates)
- Pre: APIKeyConfiguration is persisted AND --no-verify flag is NOT set AND provider endpoint is known
- Action: make minimal authenticated request to provider API (e.g. list models or token introspection endpoint); measure response status
- Post: provider returns 2xx response AND APIKeyConfiguration.keyValue is confirmed live AND AdaCLI.apiKeyConfig references this configuration
- Failure (precondition): --no-verify flag is set → skip liveness check, emit warning 'KEY_NOT_VERIFIED', proceed to success message
- Failure (action): provider returns 401 Unauthorized → emit error 'KEY_INVALID', advise user to check key value, do NOT delete persisted key, exit with code 3
- Failure (action): provider is unreachable (network timeout) → emit warning 'LIVENESS_CHECK_SKIPPED_OFFLINE', mark APIKeyConfiguration as UNVERIFIED, continue
- Failure (postcondition): AdaCLI.apiKeyConfig not updated to reference new config after successful verification → reload in-memory config from disk, retry reference assignment; if still fails emit error 'CONFIG_RELOAD_FAILED'

## State Machines
### Intent
**States:** CREATED → SPANNED → FRAGMENTED → AWAITING_CLARIFICATION → UNAMBIGUOUS → PARTIALLY_RESOLVED → COMPILATION_COMPLETE → FAILED
- CREATED → SPANNED (trigger: tokenize-and-span completes, guard: at least one TextSpan produced)
- CREATED → FAILED (trigger: tokenize-and-span produces zero spans, guard: rawText yields no parseable tokens)
- SPANNED → FRAGMENTED (trigger: extract-semantic-fragments completes, guard: all TextSpans have at least one SemanticFragment)
- SPANNED → FAILED (trigger: LLM unreachable after retries during fragment extraction, guard: retry count exceeded)
- FRAGMENTED → AWAITING_CLARIFICATION (trigger: evaluate-ambiguity finds score exceeds threshold, guard: ambiguityScore > AMBIGUITY_THRESHOLD AND stdin is TTY)
- FRAGMENTED → UNAMBIGUOUS (trigger: evaluate-ambiguity finds score within threshold, guard: ambiguityScore <= AMBIGUITY_THRESHOLD)
- FRAGMENTED → PARTIALLY_RESOLVED (trigger: evaluate-ambiguity finds score exceeds threshold but stdin is not TTY, guard: ambiguityScore > AMBIGUITY_THRESHOLD AND stdin is NOT TTY)
- AWAITING_CLARIFICATION → UNAMBIGUOUS (trigger: clarification loop resolves all ambiguous fragments, guard: zero fragments remain with ambiguous=true)
- AWAITING_CLARIFICATION → PARTIALLY_RESOLVED (trigger: clarification loop ends with unresolved fragments, guard: at least one fragment remains UNRESOLVED)
- UNAMBIGUOUS → COMPILATION_COMPLETE (trigger: blueprint assembled and governance validated, guard: GovernanceStatus is COMPLIANT or UNVALIDATED)
- PARTIALLY_RESOLVED → COMPILATION_COMPLETE (trigger: partial blueprint assembled and written, guard: FallbackBlueprintResult emitted)
- UNAMBIGUOUS → FAILED (trigger: blueprint schema validation fails, guard: serialized JSON does not conform to BlueprintSchema)

### CompilationRun
**States:** INITIALIZED → PARSING → SEMANTIC_ANALYSIS → EMITTING → GOVERNANCE_CHECK → COMPLETE → GOVERNANCE_FAILED → FAILED → WRITTEN
- INITIALIZED → PARSING (trigger: ingest-raw-intent succeeds, guard: Intent record created with valid fingerprint)
- PARSING → SEMANTIC_ANALYSIS (trigger: fragment extraction and ambiguity evaluation complete, guard: Intent is UNAMBIGUOUS or PARTIALLY_RESOLVED)
- PARSING → FAILED (trigger: LLM unreachable or schema violation unrecoverable, guard: retry limit exceeded during fragment extraction)
- SEMANTIC_ANALYSIS → EMITTING (trigger: entity and process emission complete, guard: at least one of EntityModel list or ProcessFlow list is non-empty)
- SEMANTIC_ANALYSIS → EMITTING (trigger: entity and process emission complete with empty lists, guard: both EntityModel list and ProcessFlow list are empty (warnings emitted))
- EMITTING → GOVERNANCE_CHECK (trigger: blueprint assembled and schema-validated, guard: Blueprint GovernanceStatus=PENDING)
- EMITTING → FAILED (trigger: blueprint schema validation fails, guard: serialized JSON violates BlueprintSchema)
- GOVERNANCE_CHECK → COMPLETE (trigger: all ValidationRules pass, guard: GovernanceStatus=COMPLIANT)
- GOVERNANCE_CHECK → GOVERNANCE_FAILED (trigger: one or more PolicyViolations detected, guard: GovernanceStatus=VIOLATED)
- GOVERNANCE_CHECK → COMPLETE (trigger: no ValidationRules configured, guard: GovernanceStatus=UNVALIDATED)
- COMPLETE → WRITTEN (trigger: write-blueprint-output succeeds, guard: byte count matches serialized blueprint)
- GOVERNANCE_FAILED → WRITTEN (trigger: write-blueprint-output succeeds with --strict NOT set, guard: GovernanceStatus=VIOLATED AND --strict flag absent)
- GOVERNANCE_FAILED → FAILED (trigger: write blocked by --strict flag, guard: GovernanceStatus=VIOLATED AND --strict flag present)

### APIKeyConfiguration
**States:** ABSENT → RESOLVED → FORMAT_VALIDATED → PERSISTED → VERIFIED → UNVERIFIED → INVALID
- ABSENT → RESOLVED (trigger: resolve-key-source succeeds, guard: keyValue is non-empty and source is set)
- RESOLVED → FORMAT_VALIDATED (trigger: validate-key-format passes, guard: keyValue matches provider structural pattern)
- RESOLVED → FORMAT_VALIDATED (trigger: user confirms suspicious format, guard: format check failed but user confirmed continuation)
- RESOLVED → INVALID (trigger: user declines suspicious format confirmation, guard: format check failed and user declined)
- FORMAT_VALIDATED → PERSISTED (trigger: persist-key-configuration succeeds, guard: config file written with 0600 permissions)
- FORMAT_VALIDATED → INVALID (trigger: persist-key-configuration fails unrecoverably, guard: write error not remediated)
- PERSISTED → VERIFIED (trigger: verify-key-liveness returns 2xx, guard: provider API confirms key is active)
- PERSISTED → INVALID (trigger: verify-key-liveness returns 401, guard: provider rejects key)
- PERSISTED → UNVERIFIED (trigger: verify-key-liveness skipped or network unavailable, guard: --no-verify set OR provider unreachable)

### Blueprint
**States:** ABSENT → ASSEMBLING → SCHEMA_INVALID → PENDING_GOVERNANCE → COMPLIANT → VIOLATED → UNVALIDATED → WRITTEN
- ABSENT → ASSEMBLING (trigger: assemble-blueprint step begins, guard: EntityModel and ProcessFlow lists are available)
- ASSEMBLING → PENDING_GOVERNANCE (trigger: serialization succeeds and schema validates, guard: serialized JSON conforms to BlueprintSchema)
- ASSEMBLING → SCHEMA_INVALID (trigger: serialization produces schema-invalid JSON, guard: JSON violates one or more FieldDefinitions)
- PENDING_GOVERNANCE → COMPLIANT (trigger: validate-governance finds zero violations, guard: PolicyViolation list is empty)
- PENDING_GOVERNANCE → VIOLATED (trigger: validate-governance finds one or more violations, guard: PolicyViolation list is non-empty)
- PENDING_GOVERNANCE → UNVALIDATED (trigger: governance validation skipped, guard: ValidationRules list is empty)
- COMPLIANT → WRITTEN (trigger: write-blueprint-output completes successfully, guard: output destination written without error)
- VIOLATED → WRITTEN (trigger: write-blueprint-output completes in non-strict mode, guard: --strict flag absent)
- UNVALIDATED → WRITTEN (trigger: write-blueprint-output completes with audit flag, guard: audit annotation attached to Blueprint)

## Build Order
1. CLIHostController (CLIHost)
2. PromptRegistryManager (CLIHost)
3. ProvenanceTracker (ProvenanceTracking)
4. IntentParser (IntentIngestion)
5. AmbiguityResolver (IntentIngestion)
6. EntityModelEmitter (BlueprintArtifact)
7. ProcessFlowEmitter (BlueprintArtifact)
8. BlueprintAssembler (BlueprintArtifact)
9. SchemaManager (SchemaGovernance)
10. GovernanceValidator (BlueprintArtifact)
11. CompilationOrchestrator (SemanticCompilation)
12. AnthropicInferenceAdapter (CLIHost)
13. BlueprintSerializer (BlueprintArtifact)

## Done
- [ ] TypeScript strict mode with noImplicitAny — C1 mandates TypeScript; strict mode enforces type safety across 29 entity invariants
- [ ] Node.js >= 18 — required for native fetch (AnthropicInferenceAdapter), structured clone, and stable ESM support
- [ ] Anthropic API as sole inference provider — C2 excludes all other model providers; AnthropicInferenceAdapter enforces this
- [ ] MIT license with no proprietary dependencies — C3 mandates MIT; all transitive dependencies must be MIT/BSD/Apache-2.0 compatible
- [ ] User-supplied API keys only — no embedded keys, no key management service; APIKeyConfiguration.source is env var or CLI flag
- [ ] Approximate determinism: temperature 0, structured output schemas on all LLM calls, prompt version pinning — C4 via DeterminismMetadata
- [ ] Stateless execution — no database, no session persistence, no compilation history; each invocation is independent per domain exclusions
- [ ] CLI-first interface — stdin/stdout/stderr, exit codes, composable with pipes and scripts per C5
- [ ] Structured output enforcement on all Anthropic API calls — JSON mode with schema validation to constrain LLM output shape
- [ ] Blueprint must always contain entity models, process flows, and provenance — C6 enforced at BlueprintAssembler level
- [ ] All ProvenanceRecords must include intentFingerprint, sourceFragment, producingStage, promptVersionRef, and reasoningSummary — G4 completeness
- [ ] Maximum compilation pipeline latency target: proportional to number of LLM calls (4-6 per compilation) — no hard SLA but stages should not retry indefinitely
- [ ] Output blueprint must be valid against BlueprintSchema before writing — structural validation is a hard gate
- [ ] Intent exists with fingerprint assigned AND submittedAt recorded AND ambiguityScore is null (pending analysis)
- [ ] one or more TextSpan records exist referencing the Intent AND every character of rawText is covered by at least one span
- [ ] every TextSpan has at least one SemanticFragment AND each SemanticFragment has a role AND ambiguous flag is set on fragments with role=AMBIGUOUS
- [ ] Intent.ambiguityScore is a decimal in [0.0, 1.0] AND Intent is in state UNAMBIGUOUS or AWAITING_CLARIFICATION
- [ ] all previously ambiguous SemanticFragments have ambiguous=false OR user has explicitly skipped them AND Intent transitions to UNAMBIGUOUS or PARTIALLY_RESOLVED
- [ ] one EntityModel exists per distinct ENTITY_HINT fragment AND each EntityModel.provenanceRef is non-null AND each EntityModel has at least one AttributeDefinition
- [ ] one ProcessFlow exists per coherent PROCESS_HINT cluster AND each ProcessStep has ordinalPosition >= 1 AND no two steps share the same ordinalPosition within a flow AND all provenanceRefs are non-null
- [ ] Blueprint record exists with non-null blueprintId AND all linked entity and process artefacts are reachable from Blueprint AND GovernanceStatus is PENDING AND serialized JSON conforms to BlueprintSchema
- [ ] GovernanceStatus is COMPLIANT or VIOLATED (never PENDING) AND PolicyViolation list is empty iff GovernanceStatus=COMPLIANT AND CompilationRun transitions to COMPLETE or GOVERNANCE_FAILED
- [ ] Blueprint JSON is written to destination without truncation AND if --provenance flag set then ProvenanceRecord sidecar file exists AND CompilationRun transitions to WRITTEN
- [ ] APIKeyConfiguration record has keyValue set to non-empty string AND source is CLI_FLAG or ENV_VAR AND provider is set from --provider flag
- [ ] keyValue passes structural validation for the declared provider
- [ ] config file exists at target path with permissions 0600 AND contains the new provider entry AND previously stored providers are preserved
- [ ] provider returns 2xx response AND APIKeyConfiguration.keyValue is confirmed live AND AdaCLI.apiKeyConfig references this configuration

## This Session
You are the lead agent. Follow this protocol:
1. Read this file fully
2. Read all agent files in `.claude/agents/`
3. Delegate to specialist agents by bounded context, in build order
4. After each agent completes, verify its postconditions
5. Do not proceed to the next step until postconditions are met
