@~/.claude/PROJECTS.md

# ada-claude — Semantic Compiler

## Status: COMPILED — standalone integration harness (not wired into main compiler pipeline)

`packages/ent/` is built, compiled to `dist/`, and all 17 integration tests pass. It runs on synthetic fixture data with a fixed pipelineRunId (`ML.ENT.e80e3c97/v1`). The main compiler's ENT stage uses `EntityAgent` (LLM-based); `@ada/ent` is a separate domain model that validates the ENT-stage workflow in isolation.

## Summary

An ENT-stage integration system for the Ada semantic compiler that loads a 10-component blueprint registry, maps components to 8 workspace packages (resolving the C3 ordinal-3 assignment gap), extracts entities into an EntityMap, validates three-hop provenance chains, evaluates the ENT gate, and unblocks the stalled pipeline run ML.ENT.e80e3c97/v1 — all while maintaining codebase integrity (TypeScript compilation, test passage, zero regressions).

## Theoretical Foundation

**Read `docs/FOUNDATION.md` before making any architectural decision.** It explains why the pipeline has the structure it does — not as design choices, but as entailments from a single primitive. Every stage corresponds to a specific structural operation. Changes that don't correspond to a genuine entailment are overhead, not architecture.

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
**Rationale:** The ENT-stage integration workflow is strictly sequential: each step depends on the output of the previous step (registry must be loaded before mapping, mapping must be total before entity extraction, entities must exist before provenance validation, provenance must be intact before gate evaluation). Gates between steps enforce entropy reduction and structural correctness. This matches Ada's existing 7-stage compilation pipeline pattern, with the ENT stage internally decomposed into the same gated-sequential structure.

## Components

### BlueprintRegistryLoader

**Responsibility:** Loads and validates the BlueprintComponentRegistry containing exactly 10 NamedBlueprintComponents, enforcing registry invariants (unique ordinals 1-10, non-null componentIds, valid pipelineRunId and postcode) and binding the ENTStageIntegrationSpec (declaredComponentCount=10, declaredPackageCount=8, requiredProvenanceHopCount=3, c3GapOrdinal=3). This is the entry point for the ENT-stage-integration workflow.
**Bounded Context:** BlueprintRegistration
**Interfaces:** loadRegistry(pipelineRunId: string): BlueprintComponentRegistry, validateRegistry(registry: BlueprintComponentRegistry): { valid: boolean; violations: string[] }, getComponent(registry: BlueprintComponentRegistry, ordinal: number): NamedBlueprintComponent | null, getIntegrationSpec(registry: BlueprintComponentRegistry): ENTStageIntegrationSpec

### ComponentPackageMapper

**Responsibility:** Assigns 10 BlueprintComponents to 8 workspace packages, producing a ComponentPackageMapping that transitions through EMPTY → PARTIAL → TOTAL states. Manages ComponentPackageAssignment records and WorkspacePackageNode bindings. The mapping achieves totality (isTotal === true) only when all 10 components are assigned, which requires the C3 gap to be resolved first. Some packages receive multiple components (10 components into 8 packages means at least 2 packages get 2+ components each).
**Bounded Context:** PackageMapping
**Interfaces:** createMapping(registry: BlueprintComponentRegistry): ComponentPackageMapping, assignComponent(mapping: ComponentPackageMapping, ordinal: number, targetPackage: WorkspacePackageName): ComponentPackageAssignment, getAssignment(mapping: ComponentPackageMapping, ordinal: number): ComponentPackageAssignment | null, getMappingState(mapping: ComponentPackageMapping): 'EMPTY' | 'PARTIAL' | 'TOTAL' | 'INVALIDATED', isTotal(mapping: ComponentPackageMapping): boolean, getWorkspaceNodes(mapping: ComponentPackageMapping): WorkspacePackageNode[]
**Dependencies:** BlueprintRegistryLoader, C3GapResolver

### C3GapResolver

**Responsibility:** Resolves the C3AssignmentGap — the specific case where BlueprintComponent ordinal 3 has no assigned workspace package. Drives the C3AssignmentGap state machine through OPEN → RESOLVING → RESOLVED (or FAILED → ESCALATED). On resolution, produces a resolvedPackage and resolutionProvenancePostcode. Also creates and clears the corresponding ENTBlocker linked to the gap, which is required for ENT gate passage.
**Bounded Context:** PackageMapping
**Interfaces:** diagnoseGap(component: NamedBlueprintComponent): C3AssignmentGap, resolveGap(gap: C3AssignmentGap, targetPackage: WorkspacePackageName): C3AssignmentGap, getGapState(gap: C3AssignmentGap): 'OPEN' | 'RESOLVING' | 'RESOLVED' | 'FAILED' | 'ESCALATED', getResolutionProvenance(gap: C3AssignmentGap): ENTProvenanceRecord | null
**Dependencies:** BlueprintRegistryLoader

### EntityRegistrar

**Responsibility:** Extracts entities from the TOTAL ComponentPackageMapping and registers them into an EntityMap via ENTEntityRegistration events. Each registration targets the EntityMap registry type and records a provenanceRecordPostcode, entityMapPostcode, and sourceComponentId. Drives the EntityMap state machine through ABSENT → DRAFT → POPULATED. The resulting entityCount must be > 0 for the ENT gate to pass.
**Bounded Context:** EntityRegistry
**Interfaces:** extractEntities(mapping: ComponentPackageMapping): ENTEntityRegistration[], registerEntity(registration: ENTEntityRegistration, entityMap: EntityMap): EntityMap, getEntityMap(pipelineRunId: string): EntityMap, getRegistrationCount(entityMap: EntityMap): number
**Dependencies:** ComponentPackageMapper

### ProvenanceChainValidator

**Responsibility:** Validates that each component's provenance chain has exactly 3 hops (hopIndex 0, 1, 2), each hop is traced (isTraced === true with a non-null provenanceRecordPostcode), and the chain is intact (provenanceIntact === hops.every(h => h.isTraced)). Drives the ProvenanceChainRecord state machine through INCOMPLETE → VALIDATING → INTACT (or BROKEN → PARTIALLY_RECONSTRUCTED). Uses @ada/provenance PostcodeAddress to verify postcode validity.
**Bounded Context:** ProvenanceChain
**Interfaces:** buildChain(componentId: string, records: ENTProvenanceRecord[]): ProvenanceChainRecord, validateChain(chain: ProvenanceChainRecord): ProvenanceChainRecord, getHop(chain: ProvenanceChainRecord, hopIndex: number): ProvenanceChainHop | null, getChainState(chain: ProvenanceChainRecord): 'INCOMPLETE' | 'VALIDATING' | 'INTACT' | 'BROKEN' | 'PARTIALLY_RECONSTRUCTED', isIntact(chain: ProvenanceChainRecord): boolean
**Dependencies:** EntityRegistrar

### ENTGateEvaluator

**Responsibility:** Evaluates the ENT gate as a pure structural conjunction: gate.passed === (gate.provenanceIntact && gate.allBlockersCleared && gate.entityCount > 0). Drives the ENTGateRecord state machine through PENDING → EVALUATING → PASSED (or FAILED/BLOCKED). No I/O or external API calls — this is a pure function over accumulated pipeline state. When passed, the pipeline run can advance past the ENT stage.
**Bounded Context:** GateEvaluation
**Interfaces:** evaluate(provenanceIntact: boolean, blockers: ENTBlocker[], entityCount: number, pipelineRunId: string): ENTGateRecord, getGateState(gate: ENTGateRecord): 'PENDING' | 'EVALUATING' | 'PASSED' | 'FAILED' | 'BLOCKED', isBlocked(gate: ENTGateRecord): boolean, getBlockers(gate: ENTGateRecord): ENTBlocker[], clearBlocker(blocker: ENTBlocker, clearanceProvenancePostcode: string): ENTBlocker
**Dependencies:** ProvenanceChainValidator, EntityRegistrar, C3GapResolver

### StalledRunResumer

**Responsibility:** Orchestrates the unblock-stalled-pipeline-run workflow for run ML.ENT.e80e3c97/v1. Diagnoses the stall cause (which blockers are open, whether the C3 gap is unresolved), coordinates clearance of blockers and gaps via C3GapResolver, drives the run through ENTGateEvaluator, and verifies codebase integrity afterward. Drives the StalledPipelineRun state machine through STALLED → DIAGNOSING → RESUMING → ADVANCED (or BLOCKED/AWAITING_HUMAN_INPUT).
**Bounded Context:** StalledRunResolution
**Interfaces:** diagnoseStall(run: StalledPipelineRun): { causes: string[]; blockerIds: string[]; gapIds: string[] }, clearBlockersAndGaps(run: StalledPipelineRun): StalledPipelineRun, resumeRun(run: StalledPipelineRun): StalledPipelineRun, getRunState(run: StalledPipelineRun): 'STALLED' | 'DIAGNOSING' | 'RESUMING' | 'AWAITING_HUMAN_INPUT' | 'ADVANCED' | 'BLOCKED', isResumable(run: StalledPipelineRun): boolean
**Dependencies:** C3GapResolver, ENTGateEvaluator, CodebaseIntegrityChecker

### CodebaseIntegrityChecker

**Responsibility:** Verifies that Ada's codebase remains in a clean state after ENT-stage changes: TypeScript compiles (typescriptErrorCount === 0), test suite passes (failedTestCount === 0), no regressions detected. Produces a CodebaseIntegrityState snapshot. This is the final step of the unblock-stalled-pipeline-run workflow and enforces G4.
**Bounded Context:** CodebaseIntegrity
**Interfaces:** checkTypeScript(): { compiles: boolean; errorCount: number }, runTestSuite(): { passRate: number; totalTests: number; failedTests: number }, detectRegressions(before: CodebaseIntegrityState, after: CodebaseIntegrityState): boolean, getIntegrityState(): CodebaseIntegrityState

## Invariants

Hooks enforce these at tool boundaries. Do not violate them.

### BlueprintComponentRegistry

- `registry.totalComponentCount === 10` — exactly 10 BlueprintComponents are declared in spec; fewer means incomplete registration, more means contamination from outside the spec
- `registry.components.length === registry.totalComponentCount` — the array length must equal the declared count or the registry is internally inconsistent
- `new Set(registry.components.map(c => c.ordinal)).size === registry.components.length` — every component must have a unique ordinal within the registry; duplicate ordinals produce ambiguous mappings
- `registry.pipelineRunId !== null && registry.pipelineRunId.length > 0` — the registry must be bound to a specific pipeline run or it cannot participate in provenance
- `registry.postcode !== null && registry.postcode.length > 0` — the registry must have a provenance address so downstream gates can reference it

### NamedBlueprintComponent

- `component.ordinal >= 1 && component.ordinal <= 10` — ordinals must fall within the 10-component spec range; ordinal 0 or ordinal 11+ would reference non-existent components
- `component.componentId !== null && component.componentId.length > 0` — without a stable ID the component cannot be referenced by assignments or gap records
- `component.registryId !== null && component.registryId.length > 0` — a component not bound to a registry is orphaned and cannot participate in the mapping
- `component.name !== null && component.name.length > 0` — unnamed components cannot be mapped or referenced by gap diagnostics
- `component.ordinal === 3 ? component.assignedPackage === null || component.assignedPackage !== null : true` — ordinal 3 is structurally valid with or without assignment; the C3AssignmentGap entity captures the unassigned case as a separate record

### C3AssignmentGap

- `gap.componentOrdinal === 3` — C3AssignmentGap is definitionally about ordinal 3; any other ordinal would be a different gap record
- `gap.isResolved === false ? gap.resolvedPackage === null : true` — an unresolved gap must not claim a resolved package — that would be a false provenance record
- `gap.isResolved === true ? gap.resolvedPackage !== null : true` — a resolved gap must name the package it was resolved to or the resolution is unverifiable
- `gap.isResolved === true ? gap.resolutionProvenancePostcode !== null : true` — resolution must be traceable to a provenance record or it cannot be validated by the ENT gate
- `gap.componentId !== null && gap.componentId.length > 0` — the gap must reference a real component ID or it cannot be linked to the registry

### ComponentPackageMapping

- `mapping.assignmentCount === mapping.assignments.length` — the declared count must match the actual array length or the mapping is inconsistent
- `mapping.isTotal === (mapping.assignmentCount === 10)` — totality is precisely the condition that all 10 components are assigned; the boolean must reflect the actual count
- `new Set(mapping.assignments.map(a => a.componentOrdinal)).size === mapping.assignments.length` — each component ordinal must appear exactly once; duplicate ordinals mean one component is assigned twice and another not at all
- `new Set(mapping.assignments.map(a => a.targetPackage)).size === 8` — exactly 8 distinct target packages must appear in a total mapping matching the 10→8 spec
- `mapping.isTotal === true ? mapping.postcode !== null : true` — a total mapping must have a provenance postcode so the ENT gate can reference it as evidence of completeness

### ComponentPackageAssignment

- `assignment.componentOrdinal >= 1 && assignment.componentOrdinal <= 10` — assignments must reference valid ordinals within the 10-component spec
- `assignment.isResolved === true ? assignment.provenanceRecordPostcode !== null : true` — resolved assignments must carry a provenance postcode so the chain can be validated
- `assignment.componentId !== null && assignment.componentId.length > 0` — assignments must reference a real component ID or they cannot be correlated with the registry
- `assignment.mappingId !== null && assignment.mappingId.length > 0` — assignments must belong to a mapping or they are orphaned structural records with no context

### WorkspacePackageNode

- `node.packageName !== null && node.packageName.length > 0` — a package node without a name cannot be referenced by assignments or validated as a real monorepo package
- `node.assignedComponentIds.length >= 1` — a package node that participates in the mapping must have at least one component; zero-assigned packages are not part of the 8-target mapping
- `node.pipelineStage !== null && node.pipelineStage.length > 0` — each workspace package must declare which pipeline stage it serves so assignment correctness can be checked

### ENTEntityRegistration

- `registration.targetRegistryType === "EntityMap"` — ENT-stage registrations must target EntityMap specifically; other registries are out of scope for this stage
- `registration.provenanceRecordPostcode !== null && registration.provenanceRecordPostcode.length > 0` — every registration must have provenance or the ENT gate cannot verify the three-hop chain through it
- `registration.entityMapPostcode !== null && registration.entityMapPostcode.length > 0` — the registration must reference the EntityMap it populates or it is an orphaned record
- `registration.sourceComponentId !== null && registration.sourceComponentId.length > 0` — entities must trace to a source BlueprintComponent or their origin is unverifiable
- `registration.registeredAt > 0` — registration timestamp must be a positive epoch value; zero indicates the record was never actually committed

### EntityMap

- `entityMap.entityCount === entityMap.entities.length` — the declared count must match the actual array length or the ENT gate will evaluate on wrong numbers
- `entityMap.pipelineRunId !== null && entityMap.pipelineRunId.length > 0` — the EntityMap must be bound to a specific run or it cannot participate in provenance validation
- `entityMap.postcode !== null && entityMap.postcode.length > 0` — the EntityMap must have a provenance address so the ENT gate can reference it as evidence of entity extraction
- `entityMap.entityCount > 0` — an empty EntityMap cannot pass the ENT gate; zero entities means extraction did not occur

### ProvenanceChainRecord

- `chain.hopCount === 3` — three-hop is a correctness invariant declared by G2; a chain with fewer hops is incomplete and cannot pass the gate
- `chain.hops.length === chain.hopCount` — the hop array length must equal the declared hopCount or the record is internally inconsistent
- `chain.provenanceIntact === chain.hops.every(h => h.isTraced)` — chain integrity is exactly the conjunction of all hop tracings; partial tracing means the chain is not intact
- `chain.componentId !== null && chain.componentId.length > 0` — the chain must reference a component or it floats free of the registry and cannot be correlated
- `chain.hops[0].hopIndex === 0 && chain.hops[1].hopIndex === 1 && chain.hops[2].hopIndex === 2` — hops must be in ordinal order within the tuple; out-of-order hops produce incorrect lineage tracing

### ProvenanceChainHop

- `hop.hopIndex === 0 || hop.hopIndex === 1 || hop.hopIndex === 2` — hop indices must be exactly one of the three valid positions; any other value is outside the three-hop structure
- `hop.isTraced === true ? hop.provenanceRecordPostcode !== null : true` — a traced hop must carry a provenance postcode as evidence; without it the trace claim is unverifiable
- `hop.isTraced === false ? hop.provenanceRecordPostcode === null : true` — an untraced hop must not claim a postcode — that would be false evidence of tracing
- `hop.fromLabel !== null && hop.fromLabel.length > 0` — the source of the hop must be labeled or the lineage link cannot be read
- `hop.toLabel !== null && hop.toLabel.length > 0` — the destination of the hop must be labeled or the lineage link cannot be read
- `hop.chainId !== null && hop.chainId.length > 0` — the hop must reference its parent chain or it is an orphaned link that cannot be correlated

### ENTProvenanceRecord

- `record.stage === "ENT"` — ENTProvenanceRecords are scoped to the ENT stage; records from other stages are different entities
- `record.postcode !== null && record.postcode.length > 0` — the record must have its own postcode so hop records can reference it as evidence
- `record.pipelineRunId !== null && record.pipelineRunId.length > 0` — the record must be bound to a run or it cannot be correlated with gate evaluation
- `record.timestamp > 0` — timestamp must be a positive epoch value; zero means the record was never actually committed
- `record.subjectId !== null && record.subjectId.length > 0` — the record must name the entity it describes or it is uninterpretable provenance

### ENTGateRecord

- `gate.passed === (gate.provenanceIntact && gate.allBlockersCleared && gate.entityCount > 0)` — gate pass is exactly the conjunction of provenance integrity, cleared blockers, and non-zero entity count; any weaker definition allows a false pass
- `gate.evaluatedAt !== null ? gate.state !== 'PENDING' : true` — evaluated gates must not remain in PENDING state; an evaluated gate with PENDING state is a contradiction
- `gate.evaluatedAt === null ? gate.passed === false : true` — an unevaluated gate cannot have passed; pass requires evaluation
- `gate.pipelineRunId !== null && gate.pipelineRunId.length > 0` — the gate record must be bound to a specific run or it is unattributable
- `gate.entityCount >= 0` — entity count cannot be negative; negative counts indicate a corrupted aggregation

### ENTBlocker

- `blocker.isCleared === false ? blocker.clearedAt === null : true` — uncleared blockers must not have a clearance timestamp; a timestamp without isCleared=true is inconsistent state
- `blocker.isCleared === true ? blocker.clearedAt !== null : true` — cleared blockers must record when they were cleared so gate evaluation can verify the clearance is not retroactive
- `blocker.isCleared === true ? blocker.clearanceProvenancePostcode !== null : true` — clearance must be traceable to a provenance record or it cannot be verified by the gate
- `blocker.linkedGapId !== null && blocker.linkedGapId.length > 0` — blockers must trace to a gap or they are causally ungrounded records that cannot be cleared by resolving the gap
- `blocker.pipelineRunId !== null && blocker.pipelineRunId.length > 0` — blockers must be scoped to a run or they contaminate gate evaluation across runs

### StalledPipelineRun

- `run.runId === "ML.ENT.e80e3c97/v1"` — this entity represents the specific stalled run named in G3; any other runId is a different run instance
- `run.stage === "ENT"` — this run is stalled at the ENT stage specifically; a different stage means G3 is not satisfied
- `run.blockerCount === run.blockers.length` — the declared blocker count must match the actual array length or resumability cannot be correctly computed
- `run.resumable === run.blockers.every(b => b.isCleared)` — resumability is exactly the condition that all blockers are cleared; partial clearance is not enough to advance
- `run.resumable === false ? run.blockers.some(b => b.isCleared === false) : true` — a non-resumable run must have at least one uncleared blocker; if all are cleared it must be resumable

### CodebaseIntegrityState

- `state.typescriptCompiles === (state.typescriptErrorCount === 0)` — TypeScript compilation status must be exactly zero errors; non-zero errors mean the codebase is broken regardless of other passing checks
- `state.testSuitePassRate === (state.totalTestCount - state.failedTestCount) / state.totalTestCount` — pass rate must be computed from actual counts; a mismatch means the state record is internally inconsistent
- `state.regressionDetected === (state.failedTestCount > 0)` — regression is exactly the condition of having failed tests; calling it false when tests fail conceals breakage
- `state.capturedAt > 0` — the snapshot must have a valid timestamp or it cannot be ordered relative to changes
- `state.totalTestCount >= 0 && state.failedTestCount >= 0` — test counts cannot be negative; negative values indicate a corrupted measurement

### ENTStageIntegrationSpec

- `spec.declaredComponentCount === 10` — the spec declares exactly 10 components; any other value contradicts the CLAUDE.md source document
- `spec.declaredPackageCount === 8` — the spec declares exactly 8 target packages; any other value contradicts the mapping structure
- `spec.requiredProvenanceHopCount === 3` — provenance chain must have exactly 3 hops per G2; fewer hops mean incomplete lineage validation
- `spec.c3GapOrdinal === 3` — the C3 gap is definitionally at ordinal 3; any other ordinal means we are solving a different gap
- `spec.sourceDocument !== null && spec.sourceDocument.length > 0` — the spec must reference its source document or its authority cannot be established

## Workflows

### ENT-stage-integration

**Trigger:** pipeline run enters ENT stage with a BlueprintComponentRegistry containing 10 components

**load-and-validate-blueprint-registry** (enables)

- Pre: BlueprintComponentRegistry exists for pipelineRunId with totalComponentCount=10 and postcode is set
- Action: read all 10 NamedBlueprintComponents from registry, assert count matches totalComponentCount, verify each has ordinal, name, responsibility, boundedContext
- Post: 10 NamedBlueprintComponents are in memory, ordered by ordinal 0–9, each field non-null
- Failure (precondition): registry postcode missing or pipelineRunId not matched — registry was never written → emit REGISTRY_NOT_FOUND blocker, halt ENT stage, surface error to pipeline governor
- Failure (action): component count in registry body differs from totalComponentCount — registry is corrupt or partially written → emit REGISTRY_CORRUPT blocker, log discrepancy, halt and await re-registration of blueprint
- Failure (postcondition): one or more NamedBlueprintComponents have null boundedContext or assignedPackage field — incomplete schema → flag affected component IDs, emit COMPONENT_SCHEMA_INCOMPLETE, prevent assignment phase from starting

**assign-components-to-workspace-packages** (enables)

- Pre: 10 NamedBlueprintComponents loaded; 8 WorkspacePackageNodes exist with known packageNames; no ComponentPackageMapping exists for this pipelineRunId
- Action: iterate components by ordinal, match each to a targetPackage using boundedContext affinity rules, write one ComponentPackageAssignment per component, write ComponentPackageMapping with assignmentCount and isTotal flag
- Post: ComponentPackageMapping exists with assignmentCount=10; each ComponentPackageAssignment has targetPackage set; isTotal=true only if all 10 are resolved; each WorkspacePackageNode has its assignedComponentIds updated
- Failure (action): component at ordinal 3 (C3) has no matching WorkspacePackageNode by boundedContext — C3AssignmentGap is created with isResolved=false → create C3AssignmentGap record with candidatePackages populated from fuzzy match; set ComponentPackageMapping.isTotal=false; do NOT halt — continue assigning remaining components; proceed to gap-resolution step
- Failure (action): two components map to same targetPackage in a context where package capacity is exceeded — collision → log collision, apply secondary affinity rule (responsibility keyword match), reassign lower-priority component, re-evaluate
- Failure (postcondition): assignmentCount < 10 after full iteration — at least one component was silently dropped → compare component IDs in assignments vs registry, identify missing IDs, emit ASSIGNMENT_INCOMPLETE, block extraction phase

**resolve-C3-assignment-gap** (requires)

- Pre: C3AssignmentGap exists for pipelineRunId with isResolved=false and candidatePackages is non-empty; ComponentPackageMapping.isTotal=false
- Action: evaluate candidatePackages using responsibility-text similarity score; select highest-scoring package as resolvedPackage; write ENTProvenanceRecord for resolution decision; update C3AssignmentGap.isResolved=true and resolvedPackage; update corresponding ComponentPackageAssignment.targetPackage; set ComponentPackageMapping.isTotal=true
- Post: C3AssignmentGap.state=RESOLVED; ComponentPackageAssignment for ordinal 3 has targetPackage non-null and isResolved=true; ComponentPackageMapping.isTotal=true; resolutionProvenancePostcode written
- Failure (precondition): candidatePackages is empty — no fuzzy match was possible during assignment phase → transition C3AssignmentGap to FAILED state; emit C3_UNRESOLVABLE blocker; escalate to human governor decision; pipeline remains stalled
- Failure (action): similarity scores are tied across multiple candidatePackages — deterministic selection not possible → apply tiebreak rule: prefer package with fewest currently assigned components; if still tied, select lexicographically first packageName; log tiebreak rationale in ENTProvenanceRecord
- Failure (postcondition): resolutionProvenancePostcode not written — provenance event failed to persist → mark C3AssignmentGap as RESOLVED but flag provenanceIntact risk; retry provenance write up to 3 times; if exhausted, emit PROVENANCE_WRITE_FAILURE and flag ProvenanceChainRecord as incomplete for this component

**extract-and-register-entities-into-entity-map** (enables)

- Pre: ComponentPackageMapping.isTotal=true; all 10 ComponentPackageAssignments have isResolved=true; EntityMap for pipelineRunId does not yet exist or has entityCount=0
- Action: for each ComponentPackageAssignment, read the NamedBlueprintComponent's name and responsibility, extract entity names using semantic parse, create one ENTEntityRegistration per extracted entity with sourceComponentId and targetRegistryType, write entityMapPostcode and provenanceRecordPostcode per registration, accumulate into EntityMap
- Post: EntityMap exists with entityCount >= 10 (at least one entity per component); each ENTEntityRegistration has registeredAt timestamp, entityMapPostcode, and provenanceRecordPostcode non-null; EntityMap.postcode is written
- Failure (precondition): ComponentPackageMapping.isTotal=false at time of extraction — gap was not resolved before this step executed → abort extraction; emit EXTRACTION_BLOCKED_BY_GAP; ensure C3 gap resolution step is replayed before retry
- Failure (action): semantic parse of a component's responsibility yields zero entity names — component has ambiguous or empty responsibility text → emit ENTITY_EXTRACTION_EMPTY for that sourceComponentId; use component name itself as fallback entity name; register with a LOW_CONFIDENCE flag on the ENTEntityRegistration
- Failure (postcondition): EntityMap.postcode not written — map accumulation succeeded but final write failed → retry EntityMap write with exponential backoff; if all retries fail, mark EntityMap as DRAFT state and block gate evaluation until postcode is confirmed

**validate-three-hop-provenance-chain** (enables)

- Pre: EntityMap.postcode exists; at least one ENTEntityRegistration per component exists with provenanceRecordPostcode set; ProvenanceChainRecord for pipelineRunId does not yet have provenanceIntact=true
- Action: for each component, construct ProvenanceChainRecord with hopCount=3; trace hop 0: BlueprintComponentRegistry postcode → ComponentPackageAssignment provenanceRecordPostcode; trace hop 1: ComponentPackageAssignment → ENTEntityRegistration provenanceRecordPostcode; trace hop 2: ENTEntityRegistration → EntityMap postcode; mark each ProvenanceChainHop.isTraced; set ProvenanceChainRecord.provenanceIntact based on all hops traced
- Post: ProvenanceChainRecord exists for pipelineRunId with hopCount=3; all ProvenanceChainHops have isTraced=true; ProvenanceChainRecord.provenanceIntact=true; ProvenanceChainRecord.postcode written
- Failure (action): hop 1 fromLabel postcode does not match any known ComponentPackageAssignment provenanceRecordPostcode — postcode mismatch breaks chain → mark that ProvenanceChainHop.isTraced=false; set ProvenanceChainRecord.provenanceIntact=false; emit PROVENANCE_HOP_BROKEN with hop index; gate evaluation will receive provenanceIntact=false and fail unless compensated
- Failure (action): C3 resolution provenance record was never written (from earlier failure mode) — hop involving C3 component cannot be traced → attempt to reconstruct C3 provenance from C3AssignmentGap.resolutionProvenancePostcode; if not recoverable, mark chain broken for C3 component only; emit PARTIAL_PROVENANCE_CHAIN
- Failure (postcondition): ProvenanceChainRecord.postcode not written — validation succeeded but record persistence failed → retry write; if failed, gate evaluation proceeds with in-memory provenanceIntact value but emits PROVENANCE_RECORD_UNPERSISTED warning; treat as soft failure unless gate is configured strict

**evaluate-ENT-gate** (guards)

- Pre: EntityMap.entityCount >= 1; ProvenanceChainRecord.provenanceIntact is determined (true or false); no uncleared ENT blockers remain in active state
- Action: read entityCount from EntityMap; read provenanceIntact from ProvenanceChainRecord; read allBlockersCleared by querying active blocker list for pipelineRunId; compute passed = (entityCount > 0 AND provenanceIntact AND allBlockersCleared); write ENTGateRecord with evaluatedAt timestamp and governorDecisionPostcode; set ENTGateRecord.state
- Post: ENTGateRecord exists with passed=true or passed=false; evaluatedAt is set; if passed=true then pipeline run advances past ENT stage; if passed=false then pipeline run remains at ENT stage with GATE_FAILED state
- Failure (precondition): active blockers still exist — C3 gap or provenance failure was never cleared → set allBlockersCleared=false; ENTGateRecord.passed=false; emit GATE_BLOCKED_BY_OPEN_BLOCKERS; pipeline run transitions to BLOCKED state
- Failure (action): governorDecisionPostcode write fails — gate computed a result but cannot record the decision → retry postcode write; if exhausted, still record ENTGateRecord with passed value but flag DECISION_UNANCHORED; treat as audit risk, not pipeline block
- Failure (postcondition): passed=true but pipeline run does not advance — downstream stage listener missed the gate event → re-emit gate-passed event with ENTGateRecord.gateId; if pipeline run still stalled after re-emit, escalate to pipeline governor for manual stage advancement

### unblock-stalled-pipeline-run

**Trigger:** detection that pipeline run ML.ENT.e80e3c97/v1 is in STALLED state at ENT stage with no recent state transition

**diagnose-stall-cause** (enables)

- Pre: pipelineRunId ML.ENT.e80e3c97/v1 exists in STALLED state; ENT stage is the current stage
- Action: query C3AssignmentGap for pipelineRunId — check isResolved; query ENTGateRecord for pipelineRunId — check if evaluated; query active blockers for pipelineRunId; query ProvenanceChainRecord for provenanceIntact; query EntityMap for entityCount
- Post: stall cause is classified into one of: GAP_UNRESOLVED, GATE_NOT_EVALUATED, EXTRACTION_NOT_STARTED, PROVENANCE_BROKEN, UNKNOWN; cause is logged with evidence postcodes
- Failure (action): no C3AssignmentGap record exists and ComponentPackageMapping.isTotal=false — assignment phase never wrote the gap record → synthesize C3AssignmentGap from ComponentPackageMapping data; set state=OPEN; proceed as if gap was just detected
- Failure (postcondition): stall cause classified as UNKNOWN — no diagnostic query returned useful state → emit STALL_UNDIAGNOSABLE; request full re-execution of ENT stage from load-and-validate-blueprint-registry step; preserve existing EntityMap if present to avoid data loss

**clear-open-blockers-and-gaps** (enables)

- Pre: stall cause is identified; C3AssignmentGap.isResolved=false OR active blockers exist for pipelineRunId
- Action: if cause=GAP_UNRESOLVED: execute resolve-C3-assignment-gap sub-workflow; if cause=PROVENANCE_BROKEN: re-execute validate-three-hop-provenance-chain; if cause=EXTRACTION_NOT_STARTED: execute extract-and-register-entities sub-workflow; mark cleared blockers as RESOLVED with resolution timestamp
- Post: C3AssignmentGap.isResolved=true; no active blockers remain for pipelineRunId; ComponentPackageMapping.isTotal=true
- Failure (precondition): stall cause was UNKNOWN and re-execution was requested — re-execution conflicts with partially-written EntityMap → archive existing EntityMap as EntityMap.state=SUPERSEDED before re-executing; create fresh EntityMap to avoid duplicate entity registrations
- Failure (action): C3 gap resolution fails again (candidatePackages empty) — root cause is unresolvable by automation → transition pipeline run to AWAITING_HUMAN_INPUT state; emit human-escalation event with C3AssignmentGap details; do not retry automatically
- Failure (postcondition): active blockers still exist after resolution attempts — a blocker's clear condition was not met → log each remaining blocker ID with its unmet clear condition; emit BLOCKERS_NOT_CLEARED; prevent gate re-evaluation until all are resolved

**resume-pipeline-run-through-ENT-gate** (requires)

- Pre: pipelineRunId is in STALLED state; C3AssignmentGap.isResolved=true; EntityMap.entityCount >= 10; ProvenanceChainRecord.provenanceIntact=true; no active blockers
- Action: transition pipeline run from STALLED to RESUMING; re-execute evaluate-ENT-gate step; on gate passed, transition pipeline run to ADVANCED; write final ENTGateRecord with passed=true
- Post: pipeline run ML.ENT.e80e3c97/v1 is no longer in STALLED state; ENTGateRecord.passed=true; pipeline run state=ADVANCED; next stage is triggered
- Failure (precondition): EntityMap.entityCount < 10 — extraction was incomplete despite gap resolution → identify which component IDs have no ENTEntityRegistration; re-execute extraction for those components only (partial re-extraction); do not duplicate existing registrations
- Failure (action): gate evaluates but passed=false — a condition regressed during resume (e.g. provenance became broken during re-execution) → transition pipeline run back to BLOCKED (not STALLED); emit RESUME_FAILED_GATE_REJECTED with ENTGateRecord.gateId; require fresh diagnosis before next unblock attempt
- Failure (postcondition): pipeline run advances but next stage does not start — downstream listener not subscribed to gate-passed event for this pipelineRunId → re-emit gate-passed event with explicit pipelineRunId and ENTGateRecord.gateId; verify downstream stage subscription; if still unresponsive, escalate to pipeline governor

**verify-codebase-integrity-after-changes** (compensates)

- Pre: pipeline run has advanced past ENT stage; any TypeScript source files were modified during ENT integration implementation
- Action: run TypeScript compiler with --noEmit; run existing test suite; verify no new type errors; verify all pre-existing tests pass; check that no ENT-stage entity files were accidentally deleted or overwritten
- Post: TypeScript compilation exits with code 0; test suite passes with zero new failures; codebase is in consistent state with all ENT integration changes applied
- Failure (action): TypeScript compilation fails — a new type was introduced without proper interface declaration or an import is missing → identify failing file and line; revert only the offending change if isolated; if entangled with ENT logic, roll back entire ENT implementation changeset and re-implement with correct types
- Failure (action): existing tests fail — a refactor of an assignment or provenance function changed behavior relied on by prior tests → run failing tests in isolation; determine if test expectation is now wrong (update test) or implementation regressed (fix implementation); do not suppress tests
- Failure (postcondition): compilation passes but runtime behavior is incorrect — types are satisfied but logic produces wrong entityCount or wrong gate result → add integration test that asserts entityCount=10 and passed=true for a known fixture pipelineRunId; run test; fix logic until test passes

## State Machines

### C3AssignmentGap

**States:** OPEN → RESOLVING → RESOLVED → FAILED → ESCALATED

- OPEN → RESOLVING (trigger: resolution attempt initiated, guard: candidatePackages is non-empty AND pipelineRunId matches active run)
- OPEN → FAILED (trigger: resolution attempt initiated with empty candidatePackages, guard: candidatePackages is empty)
- RESOLVING → RESOLVED (trigger: highest-scoring candidate selected and provenanceRecordPostcode written, guard: resolvedPackage is non-null AND resolutionProvenancePostcode is non-null)
- RESOLVING → FAILED (trigger: similarity scoring produces no valid result after retries, guard: all candidatePackages scored below minimum threshold after 3 attempts)
- FAILED → ESCALATED (trigger: human-escalation event emitted, guard: pipeline run is in AWAITING_HUMAN_INPUT state)
- ESCALATED → RESOLVED (trigger: human governor provides resolvedPackage assignment, guard: resolvedPackage is a valid WorkspacePackageNode.packageName)

### ENTGateRecord

**States:** PENDING → EVALUATING → PASSED → FAILED → BLOCKED

- PENDING → EVALUATING (trigger: gate evaluation invoked, guard: EntityMap.entityCount >= 1 AND ProvenanceChainRecord exists for pipelineRunId)
- PENDING → BLOCKED (trigger: gate evaluation invoked but active blockers exist, guard: active blocker count > 0 for pipelineRunId)
- EVALUATING → PASSED (trigger: all gate conditions satisfied, guard: entityCount > 0 AND provenanceIntact=true AND allBlockersCleared=true)
- EVALUATING → FAILED (trigger: one or more gate conditions not satisfied, guard: entityCount=0 OR provenanceIntact=false OR allBlockersCleared=false)
- FAILED → PENDING (trigger: gate reset after blocker resolution, guard: all previously failing conditions have been remediated)
- BLOCKED → PENDING (trigger: all blockers cleared, guard: active blocker count = 0 for pipelineRunId)

### ProvenanceChainRecord

**States:** INCOMPLETE → VALIDATING → INTACT → BROKEN → PARTIALLY_RECONSTRUCTED

- INCOMPLETE → VALIDATING (trigger: provenance validation initiated, guard: EntityMap.postcode exists AND at least one ENTEntityRegistration.provenanceRecordPostcode exists)
- VALIDATING → INTACT (trigger: all 3 hops traced successfully for all components, guard: all ProvenanceChainHops.isTraced=true AND hopCount=3)
- VALIDATING → BROKEN (trigger: one or more hops fail to trace, guard: any ProvenanceChainHop.isTraced=false)
- BROKEN → VALIDATING (trigger: provenance reconstruction attempted, guard: missing postcode can be re-derived from existing records)
- BROKEN → PARTIALLY_RECONSTRUCTED (trigger: partial reconstruction succeeds for subset of components, guard: C3 component provenance reconstructed from C3AssignmentGap.resolutionProvenancePostcode but others remain broken)
- PARTIALLY_RECONSTRUCTED → INTACT (trigger: all remaining broken hops resolved, guard: all ProvenanceChainHops.isTraced=true after reconstruction)

### ComponentPackageMapping

**States:** EMPTY → PARTIAL → TOTAL → INVALIDATED

- EMPTY → PARTIAL (trigger: first component assignment written, guard: at least one ComponentPackageAssignment exists for mappingId)
- PARTIAL → PARTIAL (trigger: additional component assigned but gap exists, guard: assignmentCount < 10 OR any ComponentPackageAssignment.isResolved=false)
- PARTIAL → TOTAL (trigger: C3 gap resolved and all assignments confirmed, guard: assignmentCount=10 AND all ComponentPackageAssignments.isResolved=true AND C3AssignmentGap.isResolved=true)
- TOTAL → INVALIDATED (trigger: a WorkspacePackageNode is removed or renamed after mapping was completed, guard: any targetPackage in assignments no longer exists in WorkspacePackageNode set)
- INVALIDATED → EMPTY (trigger: mapping reset and reassignment initiated, guard: all ComponentPackageAssignments for mappingId are deleted)

### StalledPipelineRun

**States:** STALLED → DIAGNOSING → RESUMING → AWAITING_HUMAN_INPUT → ADVANCED → BLOCKED

- STALLED → DIAGNOSING (trigger: unblock workflow initiated, guard: pipelineRunId confirmed in STALLED state with stage=ENT)
- DIAGNOSING → RESUMING (trigger: stall cause identified and all causes are auto-resolvable, guard: stall cause is GAP_UNRESOLVED or EXTRACTION_NOT_STARTED or GATE_NOT_EVALUATED and candidatePackages non-empty)
- DIAGNOSING → AWAITING_HUMAN_INPUT (trigger: stall cause identified as unresolvable by automation, guard: C3AssignmentGap.state=FAILED or stall cause=UNKNOWN after exhausted retries)
- RESUMING → ADVANCED (trigger: ENT gate passes, guard: ENTGateRecord.passed=true AND pipeline run next-stage event emitted)
- RESUMING → BLOCKED (trigger: gate evaluated but failed during resume, guard: ENTGateRecord.passed=false)
- AWAITING_HUMAN_INPUT → RESUMING (trigger: human governor provides missing assignment or decision, guard: C3AssignmentGap.state=RESOLVED after human input)
- BLOCKED → DIAGNOSING (trigger: fresh diagnosis requested after gate rejection, guard: previous diagnosis context is cleared)

### EntityMap

**States:** ABSENT → DRAFT → POPULATED → SUPERSEDED

- ABSENT → DRAFT (trigger: first ENTEntityRegistration written to map, guard: EntityMap record created for pipelineRunId with entityCount >= 1)
- DRAFT → POPULATED (trigger: all component extractions complete and EntityMap.postcode written, guard: entityCount >= 10 AND postcode is non-null)
- DRAFT → DRAFT (trigger: additional entity registrations accumulate, guard: postcode not yet written)
- POPULATED → SUPERSEDED (trigger: re-execution of extraction ordered during stall recovery, guard: a newer EntityMap is being created for same pipelineRunId)

## Build Order

1. BlueprintRegistryLoader (BlueprintRegistration)
2. C3GapResolver (PackageMapping)
3. ComponentPackageMapper (PackageMapping)
4. EntityRegistrar (EntityRegistry)
5. ProvenanceChainValidator (ProvenanceChain)
6. ENTGateEvaluator (GateEvaluation)
7. CodebaseIntegrityChecker (CodebaseIntegrity)
8. StalledRunResumer (StalledRunResolution)

## Done

- [ ] TypeScript strict mode compilation with no implicit any — enforced by existing tsconfig across all packages (C3, G4)
- [ ] Node.js >= 18 runtime — required by existing monorepo infrastructure (C3)
- [ ] ENT gate evaluation must be a pure structural function with no I/O, network calls, or side effects — gates evaluate accumulated state, not live system state (EXCLUDED)
- [ ] All 6 state machines (C3AssignmentGap, ENTGateRecord, ProvenanceChainRecord, ComponentPackageMapping, StalledPipelineRun, EntityMap) must enforce valid transitions only — invalid state transitions must throw, not silently fail
- [ ] Provenance postcodes must be generated through @ada/provenance PostcodeAddress — no ad hoc postcode construction outside the provenance package (dependency direction: infrastructure → domain)
- [ ] Component-to-package mapping must maintain exact cardinality: 10 BlueprintComponents → 8 WorkspacePackages, verified by invariant new Set(assignments.map(a => a.targetPackage)).size === 8 (C4)
- [ ] Existing test suite must pass after all changes with zero regressions — captured by CodebaseIntegrityState.regressionDetected === false (G4)
- [ ] No new workspace packages may be created — all 8 target packages already exist in the pnpm workspace (C1)
- [ ] All type names must match existing codebase vocabulary exactly — no synonyms or renamings of types already exported by @ada/ent (C2)
- [ ] 10 NamedBlueprintComponents are in memory, ordered by ordinal 0–9, each field non-null
- [ ] ComponentPackageMapping exists with assignmentCount=10; each ComponentPackageAssignment has targetPackage set; isTotal=true only if all 10 are resolved; each WorkspacePackageNode has its assignedComponentIds updated
- [ ] C3AssignmentGap.state=RESOLVED; ComponentPackageAssignment for ordinal 3 has targetPackage non-null and isResolved=true; ComponentPackageMapping.isTotal=true; resolutionProvenancePostcode written
- [ ] EntityMap exists with entityCount >= 10 (at least one entity per component); each ENTEntityRegistration has registeredAt timestamp, entityMapPostcode, and provenanceRecordPostcode non-null; EntityMap.postcode is written
- [ ] ProvenanceChainRecord exists for pipelineRunId with hopCount=3; all ProvenanceChainHops have isTraced=true; ProvenanceChainRecord.provenanceIntact=true; ProvenanceChainRecord.postcode written
- [ ] ENTGateRecord exists with passed=true or passed=false; evaluatedAt is set; if passed=true then pipeline run advances past ENT stage; if passed=false then pipeline run remains at ENT stage with GATE_FAILED state
- [ ] stall cause is classified into one of: GAP_UNRESOLVED, GATE_NOT_EVALUATED, EXTRACTION_NOT_STARTED, PROVENANCE_BROKEN, UNKNOWN; cause is logged with evidence postcodes
- [ ] C3AssignmentGap.isResolved=true; no active blockers remain for pipelineRunId; ComponentPackageMapping.isTotal=true
- [ ] pipeline run ML.ENT.e80e3c97/v1 is no longer in STALLED state; ENTGateRecord.passed=true; pipeline run state=ADVANCED; next stage is triggered
- [ ] TypeScript compilation exits with code 0; test suite passes with zero new failures; codebase is in consistent state with all ENT integration changes applied

## This Session

You are the lead agent. Follow this protocol:

1. Read this file fully
2. Read all agent files in `.claude/agents/`
3. Delegate to specialist agents by bounded context, in build order
4. After each agent completes, verify its postconditions
5. Do not proceed to the next step until postconditions are met
