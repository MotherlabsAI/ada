# An integration architecture that unblocks pipeline run ML

## Summary
An integration architecture that unblocks pipeline run ML.ENT.e80e3c97/v1 by resolving a C3 ordinal-3 component-to-package assignment gap via collapse, loading a 10-component BlueprintComponentRegistry, extracting CanonicalEntity instances into a populated EntityMap, validating three-hop provenance chains, and evaluating the ENT gate to produce a passing ENTStageResult — all within a pnpm monorepo of 8 target workspace packages with zero TypeScript errors and zero test regressions.

## Out of Scope
Ada explicitly excluded these during compilation. Do not build them:
- Ada programming language compilation and toolchain usage
- TypeScript, JavaScript, or any ECMAScript-family language compilation
- pnpm, npm, yarn, or any Node.js package manager
- Monorepo workspace topology or package graph resolution
- Machine learning pipelines, entity extraction, or EntityMap population
- Provenance chain validation or ENTStageResult evaluation
- BlueprintComponentRegistry or any blueprint component mapping
- Python, Rust, Go, C#, Java, or any non-Ada language compilation
- REST APIs, GraphQL, or network service development
- Database schema design or ORM configuration
- Frontend UI frameworks or browser-based tooling
- Docker, Kubernetes, or container orchestration
- Cloud provider SDKs or serverless deployment
- Test framework selection (Ada uses AUnit, but it is not the compilation concern)
- Linting or formatting tools unrelated to Ada compiler invocation
- WebAssembly targets (not a standard GNAT target profile)

## Working Principles
- Read this file and all `.claude/agents/` files before doing anything
- Delegate to specialist agents by bounded context, in build order
- Do NOT circumvent hook enforcement — hooks enforce entity invariants
- Verify postconditions after each step before proceeding

## Architecture
**Pattern:** gated-sequential-pipeline-with-collapse-precondition
**Rationale:** Two workflows execute sequentially: first resolve-c3-assignment-gap-and-complete-package-mapping (precondition), then evaluate-ent-stage-to-passing-result (main). The first workflow's completion (ComponentPackageMapping.isTotal = true) is a gate precondition for the second. Within each workflow, steps are sequential because each depends on prior step output. The collapse resolution for C3 must complete before any ENT evaluation can proceed, establishing a strict dependency chain: GapResolution → PackageAssignment → ComponentRegistry → EntityExtraction → ProvenanceVerification → ENTGate → PipelineExecution.

## Components
_Build in order shown. Each line is one bounded context._

1. **C3GapDetector** `GapResolution` — Detects the C3 ordinal-3 assignment gap by inspecting ComponentPackageMapping for unresolved assignments where componentOrdinal === 3. Produces a C3AssignmentGap entity in 'open' state. WHY: Workflow 'resolve-c3-assignment-gap-and-complete-package-mapping' step 'detect-c3-gap' requires detection logic. Entity C3AssignmentGap (state) defines the gap with invariant c3AssignmentGap.componentOrdinal === 3.
2. **CollapseStrategyResolver** `GapResolution` — Selects and applies the collapse resolution strategy for the C3 ordinal-3 gap. Identifies the target package from candidatePackages, records the priorOccupantComponentIds, and transitions C3AssignmentGap from 'open' → 'resolving' → 'resolved'. WHY: Workflow steps 'select-collapse-resolution-strategy' and 'apply-collapse-strategy' require a component that implements the collapse semantics mandated by C6. Entity CollapseResolutionStrategy defines the strategy shape with targetComponentOrdinal === 3. ← C3GapDetector
3. **PackageMappingFinalizer** `PackageAssignment` — Finalizes all ComponentPackageAssignments after collapse resolution, marks the ComponentPackageMapping as total (isTotal = true), and validates that exactly 10 components map to exactly 8 packages. WHY: Workflow step 'finalize-assignment-and-mark-mapping-total' requires totality check. Entity ComponentPackageMapping invariant isTotal === assignments.every(a => a.isResolved). This component bridges GapResolution completion to PackageAssignment totality. ← CollapseStrategyResolver
4. **BlueprintRegistryLoader** `ComponentRegistry` — Loads exactly 10 NamedBlueprintComponents into a BlueprintComponentRegistry, validating unique ordinals (1-10), non-null componentIds, and registry postcode. WHY: Workflow step 'load-blueprint-component-registry' in 'evaluate-ent-stage-to-passing-result' requires registry population. Entity BlueprintComponentRegistry invariant totalComponentCount === 10 (C3). Entity NamedBlueprintComponent defines per-component shape. ← PackageMappingFinalizer
5. **CanonicalEntityExtractor** `EntityExtraction` — Extracts CanonicalEntity instances from blueprint components and registers them into an EntityMap via ENTEntityRegistration events. Transitions ENTEntityMap from 'empty' → 'accumulating' → 'populated'. WHY: Workflow step 'extract-and-register-canonical-entities' populates the EntityMap (G4). Entity ENTEntityRegistration defines the registration event shape. Entity CanonicalEntity defines the extracted entity shape. ENTEntityMap invariant entityCount >= 1 for populated state. ← BlueprintRegistryLoader
6. **ThreeHopProvenanceValidator** `ProvenanceVerification` — Constructs and validates three-hop provenance chains for ENT stage artifacts. Each ProvenanceChainRecord must have exactly 3 hops (hopIndex 0, 1, 2), each traced to an ENTProvenanceRecord with a postcode starting with 'ML.' and stage === 'ENT'. WHY: Workflow step 'verify-three-hop-provenance-chains' enforces C5 (exactly three hops). Entity ProvenanceChainRecord invariant hopCount === 3. Entity ProvenanceChainHop defines hop shape. ENTProvenanceRecord defines the provenance record shape. ← CanonicalEntityExtractor
7. **ENTGateEvaluator** `ENTGate` — Evaluates the ENT gate by checking three conditions: entityCount >= 1, provenanceIntact === true, allBlockersCleared === true. Produces an ENTGateRecord and, on pass, an ENTStageResult with passed === true. WHY: Workflow step 'evaluate-ent-gate' produces the passing result (G6). Entity ENTGateRecord invariant passed === (entityCount >= 1 && provenanceIntact && allBlockersCleared). Entity ENTStageResult invariant passed === true. ← ThreeHopProvenanceValidator, CanonicalEntityExtractor
8. **PipelineUnblocker** `PipelineExecution` — Clears ENTBlockers for pipeline run ML.ENT.e80e3c97/v1 after a passing ENTStageResult, transitions StalledPipelineRun from 'stalled' → 'unblocking' → 'running', and records clearance provenance. WHY: Workflow step 'clear-ent-blocker-and-resume-pipeline' unblocks the stalled run (G1). Entity ENTBlocker state machine: active → clearing → cleared. Entity StalledPipelineRun state machine: stalled → unblocking → running. ENTBlocker invariant isCleared === false || clearanceProvenancePostcode !== null. ← ENTGateEvaluator
9. **WorkspaceTypeGuard** `WorkspaceStructure` — Validates that all 8 target workspace packages have correct TypeScript project references, composite mode enabled, and zero compilation errors. Ensures MonorepoTypeScriptConfiguration invariants hold. WHY: G7 requires zero TypeScript compilation errors. Entity MonorepoTypeScriptConfiguration invariant packageTsConfigPaths.length === 8 and compositeEnabled === true. Entity TypeScriptProjectReference invariant fromPackage !== toPackage. This component guards the infrastructure/build layer.
10. **TestRegressionGuard** `WorkspaceStructure` — Verifies zero test regressions by comparing current test results against baseline snapshots. Ensures all previously passing tests continue to pass across all affected packages. WHY: G8 and C7 require zero test regressions. Entity TestSuite invariant previouslyPassingTestIds.length >= 1 and baselineSnapshotTimestamp > 0. This is a cross-cutting verification component.

> Invariants, workflows, state machines → `.claude/agents/` | Query: `ada.query_constraints(scope)`

## Non-Functional Requirements
- **maintainability**: TypeScript strict mode compilation with zero errors across all 8 target workspace packages
- **reliability**: Node.js runtime version >= 18 enforced via engines field
- **reliability**: Zero test regressions — all previously passing tests must continue to pass after integration changes
- **compliance**: Three-hop provenance chain integrity for all ENT stage artifacts — exactly 3 hops, each traced [ProvenanceVerification]
- **compliance**: BlueprintComponentRegistry must contain exactly 10 components with unique ordinals 1-10 [ComponentRegistry]
- **compliance**: Component-to-package mapping must resolve all 10 components to exactly 8 workspace packages with C3 collapse [PackageAssignment]
- **compliance**: ENTStageResult must have passed === true with valid pipelineRunId ML.ENT.e80e3c97/v1 [ENTGate]
- **maintainability**: All ENT integration types must use existing codebase vocabulary — no parallel type definitions
- **observability**: All provenance records must carry ML.-prefixed postcodes with stage === 'ENT' for auditability [ProvenanceVerification]
- **maintainability**: pnpm workspace structure must be preserved — no new package managers or build systems introduced
- **performance**: ENT stage evaluation must complete within a single pipeline pass without requiring re-entry [PipelineExecution]
- **scalability**: EntityMap population must handle at minimum the 23 entities defined upstream without structural changes [EntityExtraction]

## Open Questions
These were not resolved during compilation. Address them before or during implementation:
- What are the names and identities of the 10 NamedBlueprintComponents that must be loaded into the BlueprintComponentRegistry? (U2 — needed to implement BlueprintRegistryLoader)
- Which 2 of the 10 monorepo packages are excluded from the component-to-package mapping? (U4 — needed to validate PackageMappingFinalizer output)
- What is the precise collapse target for C3 ordinal-3 — which specific package does component 3 collapse into, and which component(s) already occupy that package? (U3 — needed to implement CollapseStrategyResolver.selectStrategy)
- Is ML.ENT.e80e3c97/v1 a persisted record in @ada/storage or a runtime construct? This affects PipelineUnblocker's data access pattern (U6)
- Do existing tests for the ENT stage currently pass or fail? If they fail, are they counted in the 'previously passing' baseline for C7? (U9)
- Where should CollapseResolutionStrategy and PackageOwnershipDeclaration types be defined — @ada/ent or a new file within an existing package? (derived from entity-to-package gap analysis)
- What are the concrete postcode formats for ENTStageResult.postcode, ENTStageResult.entityMapPostcode, and ENTGateRecord.governorDecisionPostcode? (derived from provenance compliance requirements)
- Does @ada/ent need to declare explicit pnpm dependencies on @ada/provenance and @ada/int-rerun, or are these type-only imports resolved via TypeScript project references? (derived from dependency analysis)
- What is the INTStage's role in the ComponentRegistry bounded context — does it gate registry loading or merely provide metadata? (INTStage entity has aggregateEntropyHardCap === 0.3 but its integration point with BlueprintRegistryLoader is unclear)

## Done
- [ ] TypeScript strict mode compilation with zero errors across all 8 target workspace packages (`tsc --noEmit --composite exits with code 0 for all packages`)
- [ ] Node.js runtime version >= 18 enforced via engines field (`process.versions.node >= '18.0.0'`)
- [ ] Zero test regressions — all previously passing tests must continue to pass after integration changes (`testSuite.previouslyPassingTestIds.every(id => currentResults[id].passed === true)`)
- [ ] Three-hop provenance chain integrity for all ENT stage artifacts — exactly 3 hops, each traced (`provenanceChainRecord.hopCount === 3 && provenanceChainRecord.hops.every(h => h.isTraced === true)`) [ProvenanceVerification]
- [ ] BlueprintComponentRegistry must contain exactly 10 components with unique ordinals 1-10 (`blueprintComponentRegistry.totalComponentCount === 10 && new Set(components.map(c => c.ordinal)).size === 10`) [ComponentRegistry]
- [ ] Component-to-package mapping must resolve all 10 components to exactly 8 workspace packages with C3 collapse (`componentPackageMapping.isTotal === true && new Set(assignments.map(a => a.packageName)).size === 8`) [PackageAssignment]
- [ ] ENTStageResult must have passed === true with valid pipelineRunId ML.ENT.e80e3c97/v1 (`entStageResult.passed === true && entStageResult.pipelineRunId === 'ML.ENT.e80e3c97/v1'`) [ENTGate]
- [ ] All ENT integration types must use existing codebase vocabulary — no parallel type definitions
- [ ] All provenance records must carry ML.-prefixed postcodes with stage === 'ENT' for auditability (`entProvenanceRecord.postcode.startsWith('ML.') && entProvenanceRecord.stage === 'ENT'`) [ProvenanceVerification]
- [ ] pnpm workspace structure must be preserved — no new package managers or build systems introduced
- [ ] ENT stage evaluation must complete within a single pipeline pass without requiring re-entry [PipelineExecution]
- [ ] EntityMap population must handle at minimum the 23 entities defined upstream without structural changes [EntityExtraction]

## Compilation Health
**Decision:** ACCEPT  **Confidence:** 94%  **Gates:** 100%
**Coverage:** 92%  **Coherence:** 93%  **Drifts:** 0  **Gaps:** 1

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
