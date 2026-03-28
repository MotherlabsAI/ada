# An integration architecture for the ENT stage of the Ada semantic compiler pipeline that loads a 10-component BlueprintComponentRegistry, maps those components to 8 workspace packages (resolving the C3 ordinal-3 assignment gap via collapse), extracts CanonicalEntity instances into a populated EntityMap, validates three-hop provenance chains, evaluates the ENT gate to produce a passing ENTStageResult, and unblocks the stalled pipeline run ML

## Summary
An integration architecture for the ENT stage of the Ada semantic compiler pipeline that loads a 10-component BlueprintComponentRegistry, maps those components to 8 workspace packages (resolving the C3 ordinal-3 assignment gap via collapse), extracts CanonicalEntity instances into a populated EntityMap, validates three-hop provenance chains, evaluates the ENT gate to produce a passing ENTStageResult, and unblocks the stalled pipeline run ML.ENT.e80e3c97/v1 — all within a TypeScript pnpm monorepo with zero compilation errors and zero test regressions.

## Out of Scope
Ada explicitly excluded these during compilation. Do not build them:
- Ada (ISO/IEC 8652) programming language — Ada here refers to the semantic entity being compiled, not the language
- ML model training, inference, weights, or neural architecture — this is pipeline infrastructure, not ML research
- Stages other than ENT — upstream ingestion stages and downstream emission stages
- Runtime execution or deployment of the compiled Ada entity — scope ends at a passing ENTStageResult
- UI, frontend, dashboard, or visualization of pipeline state — purely backend infrastructure
- External API integrations or network I/O — all operations are within monorepo workspace boundaries
- Database schema design or persistence layer implementation — registry is an in-memory or typed in-process structure
- CI/CD pipeline configuration — this is about the semantic compiler pipeline, not the deployment pipeline
- Adding new vocabulary types or parallel type structures — must use existing typed vocabulary (C4)
- Components 4-10 mapping details beyond resolving ordinal-3 — only the C3AssignmentGap at ordinal-3 is the named gap
- Changing the monorepo package count — the 10-package structure is fixed; only the 8-target mapping is in scope
- Provenance chains with any hop count other than exactly three — two-hop and four-hop variants are out of scope (C7)

## Working Principles
- Read this file and all `.claude/agents/` files before doing anything
- Delegate to specialist agents by bounded context, in build order
- Do NOT circumvent hook enforcement — hooks enforce entity invariants
- Verify postconditions after each step before proceeding

## Architecture
**Pattern:** gated-sequential-pipeline
**Rationale:** The ENT-Stage-Pipeline-Execution workflow defines a strict sequential flow: load-blueprint-registry → build-component-package-mapping → resolve-c3-assignment-gap → finalize-component-package-mapping → extract-canonical-entities-into-entity-map → validate-provenance-chain-records → evaluate-ent-gate → unblock-pipeline-run. Each step depends on the output of the previous step. The ENTGateRecord acts as a gate that must pass before the pipeline run can proceed. This is a gated-sequential-pipeline pattern where intermediate artifacts (registry, mapping, entity map, provenance chain) flow forward and the gate aggregates all conditions into a single PASS/FAIL decision.

## Components
_Build in order shown. Each line is one bounded context._

1. **BlueprintRegistryLoader** `BlueprintRegistry` — Constructs and validates a BlueprintComponentRegistry containing exactly 10 NamedBlueprintComponent entries with unique ordinals 0-9, sourced from the pipeline run's blueprint input. Ensures registry invariants hold: totalComponentCount === 10, all ordinals unique and in range, registryId and pipelineRunId populated.
2. **ComponentPackageMapper** `PackageMapping` — Builds the ComponentPackageMapping that assigns all 10 blueprint components to exactly 8 unique WorkspacePackageNode targets. Manages the assignment lifecycle from draft through gap-detected to total. Produces 10 ComponentPackageAssignment entries, detects when ordinal-3 has no definitive target (creating a C3AssignmentGap), and after gap resolution, finalizes the mapping with isTotal === true. Generates exactly 1 CollapseRecord when two components share a target package. ← BlueprintRegistryLoader
3. **C3GapResolver** `PackageMapping` — Resolves the C3AssignmentGap at ordinal-3 by classifying the ordinal-3 component, determining its collapse partner (another component that shares the same target package), and writing resolution provenance. Drives the C3AssignmentGap state machine from unresolved → classifying → awaiting-confirmation → resolved. Produces the CollapseRecord and updates the gap's resolvedPackage and resolutionProvenancePostcode. ← ComponentPackageMapper, BlueprintRegistryLoader
4. **EntityExtractor** `EntityExtraction` — Extracts CanonicalEntity instances from blueprint components in the registry and populates an ENTEntityMap. For each NamedBlueprintComponent, creates an ENTEntityRegistration linking the component to a CanonicalEntity with provenance. Ensures the resulting EntityMap has entityCount >= 1, all entity IDs are unique, and all entities share the same pipelineRunId. ← BlueprintRegistryLoader, ComponentPackageMapper
5. **ProvenanceChainValidator** `ProvenanceChain` — Constructs and validates three-hop ProvenanceChainRecord entries. Each chain has exactly 3 ProvenanceChainHop entries (hopIndex 0, 1, 2) tracing from intent through blueprint through component to entity. Validates that each hop's isTraced === true and provenanceRecordPostcode is populated. Sets provenanceIntact based on all hops being traced. Produces ENTProvenanceRecord entries with 'ML'-prefixed postcodes and stage === 'ENT'. ← EntityExtractor, ComponentPackageMapper
6. **PipelineRunController** `PipelineExecution` — Manages the StalledPipelineRun ML.ENT.e80e3c97/v1 lifecycle. Loads the run with its ENTBlocker instances, clears blockers as upstream conditions are met (C3 gap resolved, mapping finalized, entities extracted, provenance validated), and resumes the run when all blockers are cleared. Drives the PipelineRun state machine from stalled → partial-unblocked → proceeding. The ENTBlocker linked to the C3AssignmentGap is cleared when the gap reaches 'resolved' state. ← ENTGateEvaluator
7. **ENTGateEvaluator** `GateEvaluation` — Evaluates the ENT gate by checking four conditions: entityCount >= 1 (from EntityMap), provenanceIntact (from ProvenanceChainValidator), allBlockersCleared (from PipelineRunController), and mappingIsTotal (from ComponentPackageMapper). Produces an ENTGateRecord with state PASS or FAIL, and wraps it in an ENTStageResult with an ML-prefixed postcode. Drives the ENTGateRecord state machine from pending → evaluating → passed|failed. ← EntityExtractor, ProvenanceChainValidator, ComponentPackageMapper, PipelineRunController
8. **SourceFileResolver** `MonorepoStructure` — Identifies which MonorepoSourceFile entries must be authored (new) or modified (existing) to implement the ENT stage integration. Each file traces to one or more goals. Ensures that files are categorized exclusively as either authored or modified (not both). Primarily targets the @ada/ent package source root, but may include test files in other packages.
9. **CompilationValidator** `MonorepoStructure` — Compiles all workspace packages in dependency order and runs the test suite to verify zero TypeScript errors and zero test regressions. Produces TypeScriptCompilationUnit results per package and a TestSuiteResult aggregating all test outcomes. Respects pnpm workspace package boundaries and dependency order (infrastructure packages first). ← SourceFileResolver

> Invariants, workflows, state machines → `.claude/agents/` | Query: `ada.query_constraints(scope)`

## Non-Functional Requirements
- **maintainability**: TypeScript strict mode compilation must pass with zero errors across all 10 workspace packages after ENT stage changes [MonorepoStructure]
- **reliability**: All existing tests must pass with zero regressions — no previously passing test may fail after changes [MonorepoStructure]
- **maintainability**: All components must use existing vocabulary types from @ada/ent, @ada/compiler, and @ada/provenance — no parallel type structures invented
- **reliability**: BlueprintComponentRegistry must contain exactly 10 components with unique ordinals 0-9 — invariant enforced at construction time [BlueprintRegistry]
- **reliability**: ComponentPackageMapping must produce exactly 10 assignments mapping to exactly 8 unique target packages with isTotal === true [PackageMapping]
- **reliability**: Provenance chains must contain exactly 3 hops with indices 0, 1, 2 and provenanceIntact must equal the conjunction of all hops being traced [ProvenanceChain]
- **observability**: All ENTProvenanceRecord postcodes must start with 'ML' prefix and declare stage === 'ENT' [ProvenanceChain]
- **reliability**: ENT gate must pass if and only if all four conditions hold: entityCount >= 1, provenanceIntact, allBlockersCleared, mappingIsTotal [GateEvaluation]
- **compliance**: The stalled pipeline run ML.ENT.e80e3c97/v1 must only be resumed when all its blockers are cleared — no forced bypass [PipelineExecution]
- **maintainability**: Package boundaries must be respected — @ada/ent must not depend on packages that don't appear in its declared dependency graph [MonorepoStructure]
- **performance**: ENT stage execution should complete within the same order of magnitude as other pipeline stages — no blocking I/O or external calls
- **scalability**: Component and entity structures must not hardcode counts — the 10-component and 8-package constraints are validated at runtime, not baked into array indices

## Open Questions
These were not resolved during compilation. Address them before or during implementation:
- Which specific source files in @ada/ent currently exist vs. need to be authored — is there an existing src/ directory with partial implementations or is it an empty package with only type declarations? (U1 unresolved)
- What is the concrete identity of the ordinal-3 component — which NamedBlueprintComponent.name sits at ordinal 3, and which WorkspacePackageName is its correct target after resolution? (U2 unresolved)
- Is CanonicalEntity imported from @ada/int-rerun into @ada/ent, or does @ada/ent define its own compatible type — and if imported, should @ada/ent declare @ada/int-rerun as a dependency? (cross-package type dependency)
- What are the concrete fromLabel/toLabel values for each provenance hop — are they 'intent'→'blueprint', 'blueprint'→'component', 'component'→'entity', or different semantic labels? (U3 partially resolved by assumption)
- Is ML.ENT.e80e3c97/v1 stored as a test fixture, an in-memory constant, or fetched from @ada/storage — and does unblocking require writing to a RunRecord in @ada/storage? (U4 partially resolved by assumption)
- Which 2 of the 10 monorepo packages are excluded from component mapping — is the assumption that @ada/mcp-server and @ada/int-rerun are excluded correct, or are different packages excluded? (U5 partially resolved by assumption)
- Are ENTBlocker instances pre-created when the pipeline run enters ENT stage, or are they dynamically discovered during stage execution? (U8 partially addressed)
- Does the ENTGateEvaluator→PipelineRunController dependency require a callback/event pattern to avoid the apparent circular reference, or is the sequential orchestration sufficient? (architectural)

## Done
- [ ] TypeScript strict mode compilation must pass with zero errors across all 10 workspace packages after ENT stage changes (`compilationUnits.every(u => u.errorCount === 0)`) [MonorepoStructure]
- [ ] All existing tests must pass with zero regressions — no previously passing test may fail after changes (`testSuiteResult.regressionCount === 0 && testSuiteResult.failedTests === 0`) [MonorepoStructure]
- [ ] All components must use existing vocabulary types from @ada/ent, @ada/compiler, and @ada/provenance — no parallel type structures invented
- [ ] BlueprintComponentRegistry must contain exactly 10 components with unique ordinals 0-9 — invariant enforced at construction time (`registry.totalComponentCount === 10 && new Set(registry.components.map(c => c.ordinal)).size === 10`) [BlueprintRegistry]
- [ ] ComponentPackageMapping must produce exactly 10 assignments mapping to exactly 8 unique target packages with isTotal === true (`mapping.assignmentCount === 10 && new Set(mapping.assignments.map(a => a.targetPackage)).size === 8 && mapping.isTotal === true`) [PackageMapping]
- [ ] Provenance chains must contain exactly 3 hops with indices 0, 1, 2 and provenanceIntact must equal the conjunction of all hops being traced (`chain.hopCount === 3 && chain.hops.length === 3 && chain.provenanceIntact === chain.hops.every(h => h.isTraced)`) [ProvenanceChain]
- [ ] All ENTProvenanceRecord postcodes must start with 'ML' prefix and declare stage === 'ENT' (`record.postcode.startsWith('ML') && record.stage === 'ENT'`) [ProvenanceChain]
- [ ] ENT gate must pass if and only if all four conditions hold: entityCount >= 1, provenanceIntact, allBlockersCleared, mappingIsTotal (`gate.passed === (gate.entityCount >= 1 && gate.provenanceIntact && gate.allBlockersCleared && gate.mappingIsTotal)`) [GateEvaluation]
- [ ] The stalled pipeline run ML.ENT.e80e3c97/v1 must only be resumed when all its blockers are cleared — no forced bypass (`run.resumable === run.blockers.every(b => b.isCleared)`) [PipelineExecution]
- [ ] Package boundaries must be respected — @ada/ent must not depend on packages that don't appear in its declared dependency graph [MonorepoStructure]
- [ ] ENT stage execution should complete within the same order of magnitude as other pipeline stages — no blocking I/O or external calls
- [ ] Component and entity structures must not hardcode counts — the 10-component and 8-package constraints are validated at runtime, not baked into array indices

## Compilation Health
**Decision:** ACCEPT  **Confidence:** 97%  **Gates:** 100%
**Coverage:** 95%  **Coherence:** 93%  **Drifts:** 0  **Gaps:** 0

## Ada MCP
Ada world model is queryable via MCP. Before modifying any entity or workflow:
- `ada.query_constraints(scope)` — get invariants for any domain scope
- `ada.check_drift(description)` — verify a planned action against original intent
- `ada.get_world_model(stage?)` — read any compiled stage artifact

## Semantic Drift
Ada verifies codebase alignment after each push. Before starting work:
- If `.ada/drift.md` exists: read it — Ada has flagged semantic violations
- Run `ada verify` at any time to check current alignment
- Run `ada hook install` once to automate this check on every push

## This Session
You are the lead agent. Read this file and all `.claude/agents/` files. Delegate by bounded context in build order. Verify postconditions before each next step.
