---
ada_postcode: "ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1"
ada_type: blueprint
ada_name: Ada is a semantic compiler and runtime governance infrastruc
ada_edges:
  implements:
    - "AdaStorage"
    - "BootstrapSeed"
    - "ProvenanceStore"
    - "EmbeddingProvider"
    - "DriftScoreCalculator"
    - "evaluateSemanticGate"
    - "Governor"
    - "ConfidenceTracker"
    - "ProvenanceChainValidator"
    - "ENTGateEvaluator"
    - "createGovernedCanUseTool"
    - "groundIntent"
    - "INTStageController"
    - "DialogueEngine"
    - "PersonaAgent"
    - "ProcessAgent"
    - "buildWorldModel"
    - "ManifoldProjector"
    - "PipelineOrchestrator"
    - "compileIntent"
    - "checkDrift"
    - "startServer"
    - "writeConfigGraph"
    - "RunStore"
    - "MotherCompiler"
    - "evaluateSemanticDrift"
    - "blueprintToCLAUDEMD"
    - "invariantsToHooks"
    - "blueprintToContracts"
    - "workflowsToSkills"
    - "buildSettings"
    - "componentsToAgents"
ada_compiled_at: 1776808391819
---
# Ada is a semantic compiler and runtime governance infrastructure for agentic Claude Code execution

## Summary
Ada is a semantic compiler and runtime governance infrastructure for agentic Claude Code execution. It transforms natural language intent into formal governance artifacts (CLAUDE.md, agent definitions, delegation contracts, invariant enforcement hooks, skill files, settings.json, world model) through a strict 9-stage sequential pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD). At runtime, it enforces semantic governance via a PreToolUse hook that classifies tool invocations against threat-model actor classes, computes drift scores, and issues structured gate verdicts. A ContinuousGovernor monitors drift across sessions, and a typed WorldModel graph persists governance state to .ada/world-model.json. The entire system is exposed as an MCP server over stdio/JSON-RPC.

## Architecture
Pattern: gated-sequential-pipeline-with-runtime-governance
The 9 compilation stages require strict sequential execution because each stage's output is the next stage's input, with entropy reducing at each gate. Runtime governance operates as an orthogonal concern via PreToolUse hooks. The pipeline pattern maps directly to the CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD workflow. The runtime gate enforcement pattern maps to the PreToolUse event-driven workflow. Both patterns share infrastructure (EmbeddingProvider, ProvenanceStore, WorldModel) but operate on separate activation paths. Dependency direction flows infrastructure → application → domain: storage and provenance at the bottom, MCP and orchestration in the middle, governance core and gate enforcement at the top.

## Out of Scope
Ada explicitly excluded these. Do not build them:
- ISO Ada programming language — all references to the ISO language standard, Ada compilers, or Ada runtime environments
- Application source code generation — Ada produces governance artifacts only
- Browser DOM, React, and frontend concerns — Ada has no UI layer
- npm and yarn package management — the monorepo uses pnpm exclusively
- REST, GraphQL, and gRPC service definitions — only MCP over stdio/JSON-RPC
- Standalone MCP daemon — the MCP server is co-located over stdio, not separately deployable
- In-pipeline database writes — all persistence is file-based
- ML model training — EmbeddingProvider is inference-only
- Multi-tenant operation — single operator context per deployment
- Automated amendment approval — governance changes require human operator approval
- Parallel pipeline stage execution — all 9 stages execute strictly sequentially
- Chatbot behavior and conversational AI patterns — Ada is not a dialogue system
- Infinite GOV iteration — bounded at 3 retries, 4th is terminal REJECT
- General-purpose code execution or scripting environments
- External identity providers, OAuth, or authentication systems

## Components
1. **AdaStorage** `Bootstrap`
2. **BootstrapSeed** `Bootstrap`
3. **ProvenanceStore** `Bootstrap`
4. **EmbeddingProvider** `DriftMonitoring`
5. **DriftScoreCalculator** `DriftMonitoring`
6. **evaluateSemanticGate** `GateEnforcement`
7. **Governor** `GovernanceCore`
8. **ConfidenceTracker** `GovernanceCore`
9. **ProvenanceChainValidator** `ArtifactProvenance`
10. **ENTGateEvaluator** `GateEnforcement`
11. **createGovernedCanUseTool** `GateEnforcement`
12. **groundIntent** `IntentResolution`
13. **INTStageController** `IntentResolution`
14. **DialogueEngine** `IntentResolution`
15. **PersonaAgent** `PipelineOrchestration`
16. **ProcessAgent** `PipelineOrchestration`
17. **buildWorldModel** `WorldModeling`
18. **ManifoldProjector** `ArtifactProvenance`
19. **PipelineOrchestrator** `PipelineOrchestration`
20. **compileIntent** `MCPIntegration`
21. **checkDrift** `MCPIntegration`
22. **startServer** `MCPIntegration`
23. **writeConfigGraph** `WorldModeling`
24. **RunStore** `PipelineOrchestration`
25. **MotherCompiler** `PipelineOrchestration`
26. **evaluateSemanticDrift** `DriftMonitoring`
27. **blueprintToCLAUDEMD** `ArtifactProvenance`
28. **invariantsToHooks** `ArtifactProvenance`
29. **blueprintToContracts** `ArtifactProvenance`
30. **workflowsToSkills** `ArtifactProvenance`
31. **buildSettings** `ArtifactProvenance`
32. **componentsToAgents** `ArtifactProvenance`

## Working Principles
Implement exactly what the compiled blueprint specifies. Follow invariants from agent files. Call `ada.query_constraints` before modifying any entity. Do not add scope beyond what is specified.

## Done
- preToolUseHook.executionTimeMs <= 30000 || preToolUseHook.mode === 'advisory': PreToolUse hook must complete gate evaluation within 30-second soft ceiling; exceeding this degrades to advisory mode
- stage.index <= 3 ? stage.temperature === 0 && stage.structuredOutput === true : true: Pipeline stages 1–4 must use temperature 0 with structured output to ensure deterministic results
- continuousGovernor.currentIterationCount <= 3: ContinuousGovernor must terminate with REJECT after exactly 3 failed iterations — no infinite loops
- WorldModel must be restorable from .ada/world-model.json at SessionStart without data loss
- bootstrapSeed.immutable === true && bootstrapSeed.contentHash === computeHash(bootstrapSeed): BootstrapSeed is immutable — pipeline may read and validate but never overwrite or regenerate it
- typeof gateFailure !== 'string' && gateFailure.gateId !== undefined: Gate failure must always produce structured GateFailurePayload — never plain error strings
- actorClass.classId === 'injection' || actorClass.classId === 'scope_violation' ? verdict === 'HALT' || verdict === 'ESCALATE' : true: HARD violations (injection, scope violation) must result in HALT or ESCALATE verdict — never RETRY or REPLAN
- embeddingProvider.singleton === true: EmbeddingProvider must be a singleton — no independent embedding computation in SemanticGate, DriftDetector, or WorldModelManager
- All 18 monorepo packages must be mapped to exactly one of the 9 bounded contexts
- TypeScript strict mode with noImplicitAny across all packages; pnpm as exclusive package manager
- All pipeline stage transitions must be logged with postcode, stage code, timestamp, and compilationRunId
- Drift score computations must be logged with component scores (semanticDivergence, blueprintStaleness, intentDrift) and final weighted score
- No in-pipeline database writes — all persistence is file-based
- Governance changes require human operator approval — no automated amendment acceptance
- mcpServer.exposedTools.length === 12: MCP server must expose exactly 12 tools over stdio/JSON-RPC — no more, no fewer

## Open Questions
- U1: What is the actual PreToolUse hook timeout enforced by the Claude Code environment — does the 30s soft ceiling ever conflict with a shorter forced termination?
- U2: What is the concrete drift score formula for DriftScoreCalculator — what are the weights for semanticDivergence, blueprintStaleness, and intentDrift components?
- U3: What is the maximum WorldModel graph node count before performance degrades, and what pruning/archival strategy should be used?
- U4: How does ContinuousGovernor distinguish legitimate semantic evolution from governance drift in long sessions — is an evolution window or operator acknowledgment needed?
- U5: How do the 18 monorepo packages map to the 9 bounded contexts — which packages compose Bootstrap vs GovernanceCore vs ArtifactProvenance etc.?
- U6: What is the correct Anthropic embedding model identifier for EmbeddingProvider — 'text-embedding-3' is not a confirmed Anthropic model name?
- U7: What hook or callback surface provides streaming token counting for ContinuousGovernor's 50-token trigger in the Claude Code environment?
- U8: What is the compilationRunId generation strategy (UUID, timestamp, sequential) and which component owns generation — RunStore or PipelineOrchestrator?
- U9: What is the BootstrapSeed file path in the repository — .ada/bootstrap-seed.json, root-level, or elsewhere?
- U10: What MCP tool or event carries SessionReloadSignal — it is not in the G5 12-tool list, so is it an out-of-band notification or a 13th tool?
- How does the system handle partial pipeline failures — if stage 5 fails after stages 1-4 succeeded, are stage 1-4 results cached for reuse?
- What is the interaction model between DialogueEngine (elicitation) and the pipeline — does elicitation pause pipeline execution or run as a pre-pipeline phase?

## Orchestration Map
Ada builds this project by bounded context. Each context is one Claude Code session:

**Bootstrap**
Build the bootstrap subsystem that loads, validates, and enforces immutability of the BootstrapSeed static artifact containing meta-invariants and the PreToolUse write-block hook, with file-based storage infrastructure.

**GovernanceCore** <- after: DriftMonitoring, GateEnforcement
Build the continuous governance subsystem that monitors pipeline and runtime state, activates on PreToolUse events and 50-token windows and drift threshold exceedance, issues ACCEPT/REJECT/ITERATE decisions bounded to 3 iterations before terminal REJECT.

**GateEnforcement** <- after: Bootstrap, DriftMonitoring
Build the gate enforcement subsystem that evaluates ENT gate pass conditions, classifies tool invocations against threat-model actor classes (injection, scope violation, drift), maps violation severity to HARD/SOFT verdicts, and emits structured GateFailurePayload on failure.

**IntentResolution** <- after: Bootstrap
Build the intent resolution subsystem that extracts project context (CTX stage), resolves natural language intent into structured intent graphs (INT stage) with disambiguation, entropy calculation, and elicitation dialogue for ambiguity resolution.

**MCPIntegration** <- after: PipelineOrchestration, DriftMonitoring, ArtifactProvenance
Build the MCP integration subsystem that exposes Ada's 12 tools (compile, get_blueprint, get_contract, query_constraints, check_drift, log_drift, advance_execution, checkpoint, rollback_to, set_task_status, complete_subgoal, verify_stack) over stdio/JSON-RPC transport and emits SessionReloadSignal as JSON-RPC notification.

**WorldModeling** <- after: Bootstrap, DriftMonitoring
Build the world modeling subsystem that constructs, persists, and restores a typed graph (node types: blueprint, agent, skill, hook; typed edges) to .ada/world-model.json, supporting session-spanning governance state.

**PipelineOrchestration** <- after: Bootstrap, IntentResolution, GateEnforcement, GovernanceCore, WorldModeling
Build the pipeline orchestration subsystem that executes the 9-stage sequential pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) with strict ordering, determinism boundary enforcement (stages 1–4 temp 0, stages 5–9 extended thinking), concrete PersonaResolver and ProcessModeler handlers, and bounded context mapping.

**DriftMonitoring** <- after: Bootstrap
Build the drift monitoring subsystem that computes normalized drift scores via a weighted formula (semanticDivergence + blueprintStaleness + intentDrift, weights summing to 1.0) using a singleton EmbeddingProvider, producing scores comparable to the 0.3 threshold.

**ArtifactProvenance** <- after: Bootstrap, PipelineOrchestration, WorldModeling
Build the artifact provenance subsystem that projects blueprints into governance artifacts (CLAUDE.md, agent definitions, delegation contracts, hooks, skill files, settings.json, world model) with partial regeneration by default and full regeneration via --force, tracking postcode changes and emitting SessionReloadSignal after regeneration.

## Orchestration Protocol
When ADA_SUBGOAL env is set, you are in an orchestrated session:
1. Call `ada.advance_execution("<sessionId>")` to get your component-level task brief
2. Implement all components in your bounded context
3. Call `ada.set_task_status("<component>", "complete", [<evidence>])` per component
4. Call `ada.complete_subgoal("<subGoalName>", [<evidence>])` when ALL components are done
5. Exit — the Ada orchestrator will spawn the next session

## Ada MCP
The MCP server is the spec authority. Pull context on demand — never assume from memory.

**Start of every task:** call `ada.advance_execution(agentId)` — returns your task brief, bounded context contract, and execution instructions.

**Before modifying any entity:**
- `ada.query_constraints(entityName)` — get invariants and constraints
- `ada.check_drift(description)` — verify a planned action against original intent

**During execution:**
- `ada.get_contract(boundedContext)` — read your delegation contract
- `ada.get_workflow(workflowName)` — get step-by-step workflow with Hoare triples
- `ada.report_execution_failure(component, description)` — request retry guidance
- `ada.set_task_status(component, 'complete', [evidence])` — mark complete

## Compilation Health
**Decision:** ACCEPT  **Confidence:** 88%  **Gates:** 100%

## This Session
You are the lead agent. Call `ada.advance_execution(agentId)` to get your first task. Follow the execution brief. Verify postconditions before marking complete.
