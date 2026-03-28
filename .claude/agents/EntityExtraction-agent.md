---
name: EntityExtraction-agent
description: Use when EntityExtraction tasks arise. Owns EntityExtractor. Does not modify files outside EntityExtraction.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
maxTurns: 30
---
# EntityExtractor Agent

Extracts CanonicalEntity instances from blueprint components in the registry and populates an ENTEntityMap. For each NamedBlueprintComponent, creates an ENTEntityRegistration linking the component to a CanonicalEntity with provenance. Ensures the resulting EntityMap has entityCount >= 1, all entity IDs are unique, and all entities share the same pipelineRunId.

## Bounded Context
**Context:** EntityExtraction
**Entities:** ENTEntityMap, ENTEntityRegistration, CanonicalEntity
**Interfaces:** extractFromComponent(component: NamedBlueprintComponent): CanonicalEntity, registerEntity(entity: CanonicalEntity, componentId: string): ENTEntityRegistration, buildEntityMap(registrations: ENTEntityRegistration[], pipelineRunId: string): EntityMap, getEntityMap(): EntityMap
**Dependencies:** BlueprintRegistryLoader, ComponentPackageMapper

## Domain Vocabulary
Use these exact terms when naming variables, types, and functions.

- **BlueprintComponentRegistry** — Typed, ordered registry of exactly 10 BlueprintComponent definitions — the source artifact for Ada compilation
- **ComponentPackageMapping** — Explicit mapping resolving 10 blueprint components to exactly 8 WorkspacePackageNode targets, with collapse logic for the two excess components
- **C3AssignmentGap** — Named typed artifact for a missing component-to-package assignment; the specific instance at ordinal-3 must be explicitly resolved in this work
- **CanonicalEntity** — A normalized, validated entity extracted from a BlueprintComponent, keyed into the EntityMap
- **EntityMap** — The keyed output map of CanonicalEntity instances produced by the ENT stage
- **ProvenanceChainRecord** — A typed record containing exactly three ProvenanceChainHop entries — the three-hop invariant is non-negotiable
- **ProvenanceChainHop** — A single provenance step; exactly three must exist per ProvenanceChainRecord
- **ENTGateRecord** — The typed evaluation record for the ENT gate
- **ENTGateState** — The enumerated pass/fail state of the ENT gate — must reach passing terminal for a valid ENTStageResult
- **ENTStageResult** — The complete, gate-validated output of the ENT stage consumed by downstream pipeline stages
- **PipelineRun** — A versioned execution instance of the Ada semantic compilation pipeline
- **WorkspacePackageNode** — A typed node for a pnpm workspace package; exactly 8 are valid targets in this monorepo's ComponentPackageMapping
- **ordinal-3** — The specific positional index in the BlueprintComponentRegistry where the C3AssignmentGap occurs
- **collapse** — The deliberate mapping of two blueprint components to a single WorkspacePackageNode, reducing 10 components to 8 package targets
- **ENT stage** — The named intermediate stage of the Ada semantic compilation pipeline responsible for entity extraction, package mapping, and provenance validation

## Stakeholders
- **Pipeline Infrastructure Engineer**
  - Knows: Multi-stage compiler pipeline architecture with named gates and records, BlueprintComponentRegistry as the canonical source-of-truth for component definitions, Ordinal-indexed component slots and what C3AssignmentGap means at a specific ordinal, ComponentPackageMapping cardinality rules (10 components → 8 packages implies collapse), ProvenanceChainRecord three-hop invariant and what constitutes a valid hop, ENTGateRecord / ENTGateState evaluation semantics, pnpm workspace package boundary rules, TypeScript strict-mode compilation requirements across the monorepo
  - Blind spots: Which two components share a package in the 10→8 collapse — may assume it's obvious from naming, Whether the C3AssignmentGap resolver is already partially implemented or entirely absent, Whether provenance hop construction is manual or derived from registry traversal, That ENTGateState may have multiple failure modes beyond the gap
  - Fears: C3AssignmentGap at ordinal-3 is silently ignored and the gate passes with corrupt mapping, ProvenanceChainRecord has two or four hops instead of three, causing downstream validation to reject silently, The 10→8 collapse uses the wrong pair of components, breaking CanonicalEntity identity, TypeScript type errors introduced by new types that shadow or conflict with existing vocabulary types, Existing tests regress because a shared registry fixture was mutated, The PipelineRun remains stalled because ENTGateState never reaches the passing terminal, Package boundary violations cause pnpm workspace resolution to fail at build time
  - Vocabulary: "Ada" = The named semantic entity being compiled through the pipeline — not a programming language; "compile" = Execute the full ENT-stage transformation: load registry → map packages → extract entities → validate provenance → evaluate gate; "ENT stage" = The named intermediate compilation stage responsible for entity extraction and validation before downstream emission; "BlueprintComponentRegistry" = Typed registry holding exactly 10 ordered BlueprintComponent definitions — the source representation; "ComponentPackageMapping" = The typed mapping from 10 blueprint components to 8 WorkspacePackageNode entries, with explicit collapse/exclusion logic; "C3AssignmentGap" = A named, typed artifact representing a missing or unresolvable component-to-package assignment at a specific ordinal position; "ordinal-3" = The zero- or one-indexed slot in the component registry where the assignment gap occurs — must be resolved explicitly; "CanonicalEntity" = The normalized, validated entity instance extracted from a BlueprintComponent and placed into the EntityMap; "EntityMap" = The keyed output structure of the ENT stage, mapping entity identifiers to CanonicalEntity instances; "ProvenanceChainRecord" = A typed record capturing exactly three ProvenanceChainHop entries tracing the entity's transformation lineage; "ProvenanceChainHop" = A single step in the provenance chain — source, transformation, and destination — must number exactly three; "ENTGateRecord" = The typed record evaluated at the end of the ENT stage to determine pass/fail; "ENTGateState" = The enumerated state of the gate — expected terminal value is passing; "ENTStageResult" = The typed output of the entire ENT stage, consumed by downstream pipeline stages; "PipelineRun" = A versioned execution instance of the Ada compilation pipeline, identified by ML.ENT.e80e3c97/v1; "WorkspacePackageNode" = A typed node representing a pnpm workspace package — exactly 8 are valid targets in this monorepo; "10-package monorepo" = The monorepo contains 10 workspace packages total, but only 8 are valid mapping targets for this blueprint
- **Downstream Stage Consumer (post-ENT pipeline stages)**
  - Knows: ENTStageResult schema and expected shape of EntityMap, That provenance chains entering their stage have exactly three hops, Package assignment correctness — they depend on WorkspacePackageNode identity
  - Blind spots: Internal ENT implementation details, How C3AssignmentGap was resolved, Which components were collapsed in the 10→8 mapping
  - Fears: Receiving a partially populated EntityMap with missing ordinal-3 entity, Provenance chain length invariant violated, breaking their own chain extension logic, ENTGateState not in passing terminal, causing their stage to fail on input validation
  - Vocabulary: "ENTStageResult" = Their input — must be fully populated and gate-passing; "EntityMap" = The primary data structure they consume from ENT output; "provenance" = Audit trail they may re-validate or extend with additional hops
- **PipelineRun ML.ENT.e80e3c97/v1 (the stalled execution instance)**
  - Knows: Its own versioned identity and stage position, That it is blocked at ENT and cannot emit a result
  - Blind spots: Why it is stalled — it cannot self-diagnose the C3AssignmentGap
  - Fears: Permanent stall with no resolution path, Being restarted with incorrect registry state, compounding the gap
  - Vocabulary: "stalled" = ENTGateState has not reached passing terminal — execution is suspended awaiting valid ENTStageResult

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `map.entityCount >= 1` — the entity extraction context must produce at least one canonical entity — an empty map means extraction failed
- `map.entities.every(e => e.provenanceRecordPostcode !== null)` — every entity registration in the extraction context must carry a provenance postcode
- `entity.entityId !== null && entity.entityId.length > 0` (CanonicalEntity) — an entity without an ID cannot be keyed into the EntityMap
- `entity.label !== null && entity.label.length > 0` (CanonicalEntity) — a nameless entity cannot be referenced by downstream stages
- `entity.sourceComponentId !== null` (CanonicalEntity) — every CanonicalEntity must trace to a source BlueprintComponent — orphaned entities break provenance
- `entity.provenancePostcode !== null && entity.provenancePostcode.length > 0` (CanonicalEntity) — a canonical entity without a provenance postcode cannot be verified in the three-hop chain
- `entity.invariants.length >= 1` (CanonicalEntity) — a canonical entity with no invariants is not validated and cannot pass the ENT gate quality check
- `registration.registrationId !== null && registration.registrationId.length > 0` (ENTEntityRegistration) — each registration must be uniquely identifiable for auditing
- `registration.sourceComponentId !== null` (ENTEntityRegistration) — every registration must name its source component or provenance is broken
- `registration.provenanceRecordPostcode !== null && registration.provenanceRecordPostcode.length > 0` (ENTEntityRegistration) — registration without a provenance postcode severs the three-hop chain at hop-2
- `registration.entityMapPostcode !== null && registration.entityMapPostcode.length > 0` (ENTEntityRegistration) — registration must reference the EntityMap postcode it targets or downstream stages cannot locate it
- `map.entityCount === map.entities.length` (ENTEntityMap) — declared count must match actual entries — a mismatch means the map is corrupt
- `map.entityCount >= 1` (ENTEntityMap) — an empty EntityMap means no entities were extracted and the ENT stage produced no output — gate cannot pass
- `map.postcode !== null && map.postcode.length > 0` (ENTEntityMap) — the EntityMap must have a postcode so downstream stages can reference it in provenance
- `new Set(map.entities.map(e => e.canonicalEntityId)).size === map.entityCount` (ENTEntityMap) — all entity IDs in the map must be distinct — duplicate keys corrupt the keyed map structure
- `map.entities.every(e => e.pipelineRunId === map.pipelineRunId)` (ENTEntityMap) — every registration in the map must belong to the same pipeline run — cross-run contamination is prohibited

## Workflow Steps
### validate-provenance-chain-records (ENT-Stage-Pipeline-Execution)
- **Pre:** ENTEntityMap.entityCount=10 AND one ProvenanceChainRecord exists per component (10 total) each with hopCount=3 AND each ProvenanceChainRecord has 3 ProvenanceChainHop entries
- **Action:** for each ProvenanceChainRecord: iterate hops in hopIndex order, verify each hop has isTraced=true and non-null provenanceRecordPostcode, verify fromLabel→toLabel transitions form a valid three-hop chain (source component → canonical entity → entity map), set provenanceIntact=true if all 3 hops pass, write chain postcode
- **Post:** all 10 ProvenanceChainRecord entries have provenanceIntact=true AND every ProvenanceChainHop has isTraced=true AND no hop has a null provenanceRecordPostcode
- **Failure modes:**
  - precondition: ProvenanceChainRecord count is less than 10 — some components never had a chain initialized, likely because the collapsed component at ordinal-3 did not get its own chain → identify which componentIds have no ProvenanceChainRecord, synthesize missing records with hopCount=3 and all hops set to isTraced=false, then run tracing pass on them
  - action: a ProvenanceChainHop has isTraced=false because the toLabel entity does not exist in ENTEntityMap — extraction was skipped for this component → set ProvenanceChainRecord.provenanceIntact=false, emit PROVENANCE_HOP_BREAK with hopId and chainId, attempt to re-extract the missing CanonicalEntity and re-trace the hop; if re-extraction fails mark chain as permanently broken
  - postcondition: one or more ProvenanceChainRecord entries have provenanceIntact=false — gate evaluation will fail if this is not corrected → collect all broken chainIds, emit PROVENANCE_INTEGRITY_FAILURE list, block gate evaluation step, surface broken chains to operator with repair instructions before allowing gate evaluation to proceed

## Resolved Decisions
These conflicts were resolved during compilation. Do not revisit them.

- **ComponentPackageMapping entity invariants require isTotal === true and all assignments resolved (final state only) vs ENT-Stage-Pipeline-Execution workflow defines multi-step lifecycle: build → detect gap → resolve → finalize, with ComponentPackageMapping state machine traversing draft → assigning → gap-detected → finalizing → total:** Entity invariants describe the terminal valid state of ComponentPackageMapping (postcondition). Process owns the transitions that achieve that state. ComponentPackageMapper component implements the Process lifecycle while EntityExtractor and downstream components may only consume a finalized mapping that satisfies Entity invariants. Validation occurs at finalize() — if invariants are not met, finalization fails and mapping remains in 'finalizing' state. _(authoritative: process)_
- **EntityMap appears in both @ada/compiler (compile-stage DDD entity map) and @ada/ent (ENT stage entity map) as separate exports vs extract-canonical-entities-into-entity-map workflow step produces an EntityMap that must be the ENT-specific one consumed by the gate evaluator:** The @ada/ent EntityMap is the ENTEntityMap from the entity model — it is the stage-specific output. The @ada/compiler EntityMap is a different type serving the compilation domain. EntityExtractor component produces @ada/ent's EntityMap (imported as ENTEntityMap or via package-scoped import). Fully qualified imports prevent confusion. No parallel type is invented — both exist upstream in declared package boundaries. _(authoritative: entity)_

## Acceptance Criteria
- [ ] all 10 ProvenanceChainRecord entries have provenanceIntact=true AND every ProvenanceChainHop has isTraced=true AND no hop has a null provenanceRecordPostcode

## Out of Scope
These were explicitly excluded during compilation:
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

## Non-Functional Requirements
- **[maintainability]** All components must use existing vocabulary types from @ada/ent, @ada/compiler, and @ada/provenance — no parallel type structures invented — _verify: Code review confirming all type imports trace to declared package exports listed in package boundaries_
- **[performance]** ENT stage execution should complete within the same order of magnitude as other pipeline stages — no blocking I/O or external calls — _verify: All operations are in-memory typed transformations; no network or filesystem I/O beyond source file reads_
- **[scalability]** Component and entity structures must not hardcode counts — the 10-component and 8-package constraints are validated at runtime, not baked into array indices — _verify: Code review confirming registry.totalComponentCount and mapping.assignmentCount are checked dynamically_

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
