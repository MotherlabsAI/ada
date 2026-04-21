---
ada_postcode: "ML.SKL.semantic-pipeline-compilation/v1"
ada_type: skill
ada_name: semantic-pipeline-compilation
ada_compiled_at: 1776808391825
---
---
name: semantic-pipeline-compilation
description: "Use when MCP tool 'compile' called with raw natural language intent string and optional compilationRunId pattern detected."
---

# semantic-pipeline-compilation

Trigger: MCP tool 'compile' called with raw natural language intent string and optional compilationRunId

## Steps
1. **CTX-context-extraction**
   - Pre: `rawIntent is non-empty string; BootstrapSeed present in source control with valid contentHash; no active compilationRunId collision in WorldModel`
   - Action: `generate fresh compilationRunId; embed rawIntent via EmbeddingProvider at temperature 0 with structured output; snapshot current WorldModel state; store EmbeddingVector and session context`
   - Post: `compilationRunId is globally unique and registered; EmbeddingVector persisted with sourceText=rawIntent; WorldModel snapshot exists for rollback anchor; stage postcode CTX-{hash} stamped on context record`

2. **INT-intent-resolution**
   - Pre: `compilationRunId registered from CTX; EmbeddingVector for rawIntent exists; WorldModel snapshot available; temperature enforcement at 0 with structured output schema loaded`
   - Action: `compare intent embedding against WorldModel node embeddings to detect semantic overlap or contradiction; resolve intent into structured IntentResolution record with confidence score, scope, and identified ambiguities; flag any MetaInvariant that intent would violate`
   - Post: `IntentResolution record exists with compilationRunId, confidence >= 0.0, scope defined, ambiguity list (may be empty); any MetaInvariant conflicts explicitly listed with invariantId refs; stage postcode INT-{hash} stamped`

3. **PER-persona-resolution**
   - Pre: `IntentResolution record exists with passed confidence; compilationRunId active; PersonaResolver handler registered in PipelineStageExecutor (non-stub); temperature 0 enforced`
   - Action: `PersonaResolver reads IntentResolution scope and actor context; maps to WHOEntity with entityId, name, role, scope, trustLevel; derives provenancePostcode from compilationRunId + role hash; writes WHOEntity to WorldModel node graph`
   - Post: `WHOEntity exists in WorldModel with all required fields populated; provenancePostcode is deterministic for same inputs; trustLevel is one of defined ActorClass levels; stage postcode PER-{hash} stamped on WHOEntity`

4. **ENT-entity-gate-evaluation**
   - Pre: `WHOEntity exists in WorldModel from PER stage; compilationRunId matches active run; all prior stages have stamped postcodes; temperature 0 enforced`
   - Action: `instantiate ENTGatePassCondition for this pipelineRunId; evaluate all five conditions: entityCountAboveZero, provenanceIntact, allBlockersCleared, whoEntityDefined, whoEntityRef resolves; set passed=true only if all five conditions true; stamp evaluatedAt`
   - Post: `ENTGatePassCondition record persisted with passed boolean and evaluatedAt; if passed=false a GateFailurePayload is emitted with gateId=ENT, all failing condition IDs listed in failingInvariantRef; pipeline may not advance to PRO if passed=false`

5. **PRO-process-modeling**
   - Pre: `ENTGatePassCondition.passed=true for this pipelineRunId; ProcessModeler handler registered as non-stub in PipelineStageExecutor; extended thinking mode activated; budget tokens allocated for postcode stamping`
   - Action: `ProcessModeler reads WHOEntity, IntentResolution, and WorldModel graph; derives process graph of agent behaviors, delegation paths, and skill invocations; assigns each node a postcode derived from compilationRunId + node content hash; writes process graph to WorldModel`
   - Post: `process graph nodes all exist in WorldModel with typed edges (blueprint, agent, skill, hook node types); every node has compilationRunId-scoped postcode; ProcessModeler output is postcode-stamped for auditability; stage postcode PRO-{hash} stamped`

6. **SYN-blueprint-synthesis**
   - Pre: `process graph fully written to WorldModel with all nodes postcoded; extended thinking active; ContinuousGovernor status is not TERMINAL_REJECT`
   - Action: `synthesize blueprint artifact from process graph, WHOEntity, IntentResolution; assign blueprint postcode as hash of all input postcodes; write blueprint node to WorldModel; do not write to filesystem yet`
   - Post: `blueprint node in WorldModel with typed edges to agent, skill, hook nodes; blueprint postcode computed and stored; blueprint content is deterministic given same input postcodes; stage postcode SYN-{hash} stamped`

7. **VER-verification**
   - Pre: `blueprint node in WorldModel with postcode; all MetaInvariants loaded from BootstrapSeed; extended thinking active`
   - Action: `for each MetaInvariant, evaluate predicate against blueprint content; for each invariant hook in process graph evaluate hook compatibility; classify each violation as HARD or SOFT; collect all violations before emitting`
   - Post: `verification report exists listing all HARD and SOFT violations with invariantId refs; if zero HARD violations, VER passes; if any HARD violations, VER fails with aggregate GateFailurePayload; stage postcode VER-{hash} stamped`

8. **GOV-governance-check**
   - Pre: `VER passed with zero HARD violations; ContinuousGovernor status=ACTIVE; currentIterationCount < maxIterations (3); DriftScoreCalculator available with embeddingProviderRef valid`
   - Action: `ContinuousGovernor computes DriftScore using all three components (semanticDivergence, blueprintStaleness, intentDrift) weighted by formula; compare against legitimateEvolutionBaseline; if driftScore.value > driftThreshold (0.3) increment iteration count and replan; else mark governor RESOLVED`
   - Post: `DriftScore record persisted with calculatedAt and compilationRunId; if exceedsThreshold=false governor status=RESOLVED and pipeline advances to BLD; if exceedsThreshold=true and iterations < 3, REPLAN issued; if iterations=3 governor status=TERMINAL_REJECT`

9. **BLD-artifact-build**
   - Pre: `ContinuousGovernor status=RESOLVED; VER passed; blueprint postcode and all dependent node postcodes available; PartialRegenerationPlan computed by comparing current postcodes against last-written postcodes on disk`
   - Action: `for each artifact in PartialRegenerationPlan where postcode changed: write artifact to filesystem (CLAUDE.md, agent definition files, delegation contracts, invariant enforcement hooks, skill files, settings.json); if --force flag set, rewrite all artifacts regardless of postcode; after all writes, emit SessionReloadSignal via MCP to active Claude Code session; call checkpoint MCP tool to persist WorldModel state`
   - Post: `all artifacts with changed postcodes written to filesystem; artifacts with unchanged postcodes untouched; WorldModel checkpointed in .ada/world-model.json; SessionReloadSignal emitted and acknowledged by consumer; every written artifact has embedded compilationRunId and postcode in header`
