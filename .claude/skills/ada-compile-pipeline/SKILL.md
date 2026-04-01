---
name: ada-compile-pipeline
description: "Use when user executes 'ada compile <projectDir>' from CLI pattern detected."
---

# ada-compile-pipeline

Trigger: user executes 'ada compile <projectDir>' from CLI

## Steps
1. **CTX-codebase-scan**
   - Pre: `projectDir is readable AND contains at least one TypeScript or JavaScript source file AND no prior RUNNING CompilationRun exists for this projectDir`
   - Action: `traverse projectDir AST, extract typeRegistry (all exported types/interfaces/enums), vocabulary (domain terms from identifiers/comments), constants, packageBoundaries from package.json workspaces, and emit CodebaseContext with PostcodeAddress ML.CTX.{hash}/v{n} written to provenance.db`
   - Post: `CodebaseContext record exists in provenance.db with valid hash, typeRegistry is non-empty, vocabulary set contains at least 10 domain terms, postcode is addressable`

2. **INT-intent-parsing**
   - Pre: `CTX postcode ML.CTX.{hash}/v{n} is resolvable in provenance.db AND CodebaseContext.vocabulary is non-empty AND raw intent text is present in CompilationRun.sourceIntent`
   - Action: `submit raw intent plus CodebaseContext.vocabulary and CodebaseContext.typeRegistry as grounding context to LLM; extract goals, constraints, unknowns, challenges into IntentGraph; apply Ada-the-language exclusion guard (reject any output token sequences matching ISO Ada reserved words or Ada package naming conventions); emit IntentGraph with PostcodeAddress ML.INT.{hash}/v{n} chained from CTX postcode`
   - Post: `IntentGraph exists with at least 3 goals and 1 constraint; all terms in IntentGraph.goals and IntentGraph.constraints appear in CodebaseContext.vocabulary or CodebaseContext.typeRegistry (semantic grounding check passes); no Ada-the-language terms present; ML.INT postcode recorded in provenance.db with parent=ML.CTX.{hash}`

3. **PER-persona-and-domain-context**
   - Pre: `ML.INT postcode is resolvable AND IntentGraph.goals count >= 3 AND IntentGraph has no unresolved HALLUCINATION_BLOCKED flag`
   - Action: `derive DomainContext from IntentGraph: identify domain name, stakeholders, ubiquitousLanguage (terms from CodebaseContext.vocabulary that appear in IntentGraph.goals), excludedConcerns (explicitly named out-of-scope items including Ada-the-language), challenges; emit DomainContext with PostcodeAddress ML.PER.{hash}/v{n} chained from ML.INT`
   - Post: `DomainContext.ubiquitousLanguage contains at least 5 terms all verifiable in CodebaseContext.vocabulary; DomainContext.excludedConcerns explicitly lists 'Ada programming language (ISO)'; ML.PER postcode recorded with parent=ML.INT.{hash}`

4. **ENT-entity-extraction-via-isolated-packages**
   - Pre: `ML.PER postcode is resolvable AND DomainContext.ubiquitousLanguage is non-empty AND entgate package is reachable (isolated ENT boundary is mounted) AND blueprintregistry is initialized AND ordinalassignment is ready to sequence entities`
   - Action: `invoke entityextraction package with DomainContext and CodebaseContext as input; extract entities and boundedContexts using vocabulary-grounded LLM call; assign ordinals via ordinalassignment; register entities in blueprintregistry; bind components to packages via componentpackagebinding; record workspace package references via workspacepackages; pass through entgate boundary check (verifies no cross-boundary type leakage); run int-rerun if entity conflicts detected against IntentGraph; emit EntityMap with PostcodeAddress ML.ENT.{hash}/v{n} chained from ML.PER`
   - Post: `EntityMap.entities is non-empty; all entity type names exist in CodebaseContext.typeRegistry or are explicitly flagged as NEW_ENTITY; all boundedContexts names appear in DomainContext.ubiquitousLanguage; entgate boundary check passed with no cross-boundary leakage; ML.ENT postcode recorded with parent=ML.PER.{hash}`

5. **PRO-process-flow-modeling**
   - Pre: `ML.ENT postcode is resolvable AND EntityMap.entities is non-empty AND entgate boundary check is recorded as PASSED in provenance.db`
   - Action: `derive ProcessFlow from EntityMap and IntentGraph: model workflows as sequences of state transitions over entities, identify state machines per entity lifecycle, map process verbs from CodebaseContext.vocabulary to workflow steps, identify temporal relations (enables, requires, concurrent, compensates, guards), emit ProcessFlow with PostcodeAddress ML.PRO.{hash}/v{n} chained from ML.ENT`
   - Post: `ProcessFlow.workflows contains at least 2 workflows; each workflow has at least 1 state machine reference; all process verbs appear in CodebaseContext.vocabulary; temporal relations are drawn only from the allowed set {enables, requires, concurrent, compensates, guards}; ML.PRO postcode recorded with parent=ML.ENT.{hash}`

6. **SYN-blueprint-synthesis**
   - Pre: `ML.PRO postcode is resolvable AND ProcessFlow.workflows count >= 2 AND DomainContext.excludedConcerns contains Ada-the-language exclusion AND all prior stage postcodes form an unbroken provenance chain in provenance.db`
   - Action: `synthesize Blueprint from all prior stage outputs (CodebaseContext, IntentGraph, DomainContext, EntityMap, ProcessFlow): populate summary, scope, architecture, dataModel, processModel, nonFunctional, openQuestions, resolvedConflicts, challenges, audit, build sections; apply LLM with full grounding context from all prior postcodes; enforce Ada-the-language exclusion in LLM prompt; validate all blueprint terms against CodebaseContext.vocabulary and typeRegistry; emit Blueprint with PostcodeAddress ML.SYN.{hash}/v{n} chained from ML.PRO`
   - Post: `Blueprint is fully populated with no null sections; Blueprint.audit references all 5 prior postcode addresses; all type names in Blueprint.dataModel exist in CodebaseContext.typeRegistry; no Ada-the-language terms present anywhere in Blueprint; ML.SYN postcode recorded with parent=ML.PRO.{hash}`

7. **VER-5-layer-verification**
   - Pre: `ML.SYN postcode is resolvable AND Blueprint is fully populated AND AuditReport entity is initialized for this CompilationRun`
   - Action: `execute 5-layer independent verification stack sequentially: (1) provenance integrity — verify all postcode hashes form an unbroken chain from CTX to SYN; (2) semantic grounding — verify all Blueprint terms exist in CodebaseContext vocabulary/typeRegistry; (3) Ada-the-language exclusion — scan all Blueprint text for ISO Ada terminology; (4) coverage — compare Blueprint.scope against IntentGraph.goals and measure coverageScore; (5) coherence — cross-check Blueprint.processModel against ProcessFlow.workflows and measure coherenceScore; emit AuditReport with PostcodeAddress ML.VER.{hash}/v{n}`
   - Post: `AuditReport.passed is true (all 5 layers passed); AuditReport.coverageScore >= 0.8; AuditReport.coherenceScore >= 0.8; AuditReport.drifts is empty or all drifts are documented with mitigations; ML.VER postcode recorded with parent=ML.SYN.{hash}`

8. **GOV-governor-decision**
   - Pre: `ML.VER postcode is resolvable AND AuditReport.passed is true AND AuditReport.coverageScore >= 0.8 AND AuditReport.coherenceScore >= 0.8`
   - Action: `invoke Governor agent with full provenance chain (CTX through VER postcodes) and AuditReport; Governor evaluates: decision (APPROVE or REJECT), confidence, coverageScore, coherenceScore, gatePassRate, provenanceIntact, rejectionReasons, violations, nextAction; if APPROVE: mark GovernorDecision as immutable in provenance.db, generate DelegationContract and invariants (these become immutable governance core); emit GovernorDecision with PostcodeAddress ML.GOV.{hash}/v{n}`
   - Post: `GovernorDecision.decision is APPROVE or REJECT (never null); if APPROVE: DelegationContract is stored as immutable, GovernorDecision.provenanceIntact is true, GovernorDecision.gatePassRate >= 0.9; if REJECT: GovernorDecision.rejectionReasons is non-empty and GovernorDecision.nextAction is specified; ML.GOV postcode recorded with parent=ML.VER.{hash}`

9. **BLD-artifact-generation**
   - Pre: `ML.GOV postcode is resolvable AND GovernorDecision.decision is APPROVE AND DelegationContract is stored as immutable AND GovernorDecision.gatePassRate >= 0.9`
   - Action: `generate BuildContract from Blueprint and GovernorDecision: define stack, stackLabel, fileTree, dependencies, acceptanceCriteria; generate all output artifacts: CLAUDE.md (with Ada-the-language exclusion guard propagated, using vocabulary from DomainContext.ubiquitousLanguage, referencing DelegationContract invariants), agent files (macro agent orchestrator, micro agent specs, each embedding delegation boundaries), hook scripts (pre-tool-call and post-tool-call hooks referencing MCP server), .mcp.json (22-tool MCP server manifest), BUILD.md (human-readable build contract summary); emit BuildContract with PostcodeAddress ML.BLD.{hash}/v{n}; set CompilationRun.decision=APPROVE and completedAt=now`
   - Post: `all 5 artifact types exist on disk (CLAUDE.md, agent files, hooks, .mcp.json, BUILD.md); CLAUDE.md contains Ada-the-language exclusion guard verbatim; every agent file references DelegationContract immutable hash; BuildContract.gatePass is true; ML.BLD postcode recorded with parent=ML.GOV.{hash}; CompilationRun status transitions to COMPLETED; full provenance chain CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD is intact and queryable`
