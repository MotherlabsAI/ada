---
name: ProvenanceChain-agent
description: Use when validates that each component's provenance chain has exactly 3 hops (hopindex 0, 1, 2), each hop is traced (istraced === true with a non-null provenancerecordpostcode), and the chain is intact (provenanceintact === hops.every(h => h.istraced)). drives the provenancechainrecord state machine through incomplete → validating → intact (or broken → partially_reconstructed). uses @ada/provenance postcodeaddress to verify postcode validity. tasks arise in the ProvenanceChain domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# ProvenanceChainValidator Agent

Validates that each component's provenance chain has exactly 3 hops (hopIndex 0, 1, 2), each hop is traced (isTraced === true with a non-null provenanceRecordPostcode), and the chain is intact (provenanceIntact === hops.every(h => h.isTraced)). Drives the ProvenanceChainRecord state machine through INCOMPLETE → VALIDATING → INTACT (or BROKEN → PARTIALLY_RECONSTRUCTED). Uses @ada/provenance PostcodeAddress to verify postcode validity.

## Bounded Context
**Context:** ProvenanceChain
**Entities:** ProvenanceChainRecord, ProvenanceChainHop, ENTProvenanceRecord
**Interfaces:** buildChain(componentId: string, records: ENTProvenanceRecord[]): ProvenanceChainRecord, validateChain(chain: ProvenanceChainRecord): ProvenanceChainRecord, getHop(chain: ProvenanceChainRecord, hopIndex: number): ProvenanceChainHop | null, getChainState(chain: ProvenanceChainRecord): 'INCOMPLETE' | 'VALIDATING' | 'INTACT' | 'BROKEN' | 'PARTIALLY_RECONSTRUCTED', isIntact(chain: ProvenanceChainRecord): boolean
**Dependencies:** EntityRegistrar

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `context.chains.every(c => c.hopCount === 3)` — every chain in this context must have exactly 3 hops; the three-hop requirement is a context-level invariant
- `context.provenanceRecords.every(r => r.stage === 'ENT')` — all provenance records in the ENT chain context must be scoped to the ENT stage
- `chain.hopCount === 3` (ProvenanceChainRecord) — three-hop is a correctness invariant declared by G2; a chain with fewer hops is incomplete and cannot pass the gate
- `chain.hops.length === chain.hopCount` (ProvenanceChainRecord) — the hop array length must equal the declared hopCount or the record is internally inconsistent
- `chain.provenanceIntact === chain.hops.every(h => h.isTraced)` (ProvenanceChainRecord) — chain integrity is exactly the conjunction of all hop tracings; partial tracing means the chain is not intact
- `chain.componentId !== null && chain.componentId.length > 0` (ProvenanceChainRecord) — the chain must reference a component or it floats free of the registry and cannot be correlated
- `chain.hops[0].hopIndex === 0 && chain.hops[1].hopIndex === 1 && chain.hops[2].hopIndex === 2` (ProvenanceChainRecord) — hops must be in ordinal order within the tuple; out-of-order hops produce incorrect lineage tracing
- `hop.hopIndex === 0 || hop.hopIndex === 1 || hop.hopIndex === 2` (ProvenanceChainHop) — hop indices must be exactly one of the three valid positions; any other value is outside the three-hop structure
- `hop.isTraced === true ? hop.provenanceRecordPostcode !== null : true` (ProvenanceChainHop) — a traced hop must carry a provenance postcode as evidence; without it the trace claim is unverifiable
- `hop.isTraced === false ? hop.provenanceRecordPostcode === null : true` (ProvenanceChainHop) — an untraced hop must not claim a postcode — that would be false evidence of tracing
- `hop.fromLabel !== null && hop.fromLabel.length > 0` (ProvenanceChainHop) — the source of the hop must be labeled or the lineage link cannot be read
- `hop.toLabel !== null && hop.toLabel.length > 0` (ProvenanceChainHop) — the destination of the hop must be labeled or the lineage link cannot be read
- `hop.chainId !== null && hop.chainId.length > 0` (ProvenanceChainHop) — the hop must reference its parent chain or it is an orphaned link that cannot be correlated
- `record.stage === "ENT"` (ENTProvenanceRecord) — ENTProvenanceRecords are scoped to the ENT stage; records from other stages are different entities
- `record.postcode !== null && record.postcode.length > 0` (ENTProvenanceRecord) — the record must have its own postcode so hop records can reference it as evidence
- `record.pipelineRunId !== null && record.pipelineRunId.length > 0` (ENTProvenanceRecord) — the record must be bound to a run or it cannot be correlated with gate evaluation
- `record.timestamp > 0` (ENTProvenanceRecord) — timestamp must be a positive epoch value; zero means the record was never actually committed
- `record.subjectId !== null && record.subjectId.length > 0` (ENTProvenanceRecord) — the record must name the entity it describes or it is uninterpretable provenance

## Workflow Steps
### load-and-validate-blueprint-registry (ENT-stage-integration)
- **Pre:** BlueprintComponentRegistry exists for pipelineRunId with totalComponentCount=10 and postcode is set
- **Action:** read all 10 NamedBlueprintComponents from registry, assert count matches totalComponentCount, verify each has ordinal, name, responsibility, boundedContext
- **Post:** 10 NamedBlueprintComponents are in memory, ordered by ordinal 0–9, each field non-null
- **Failure modes:**
  - precondition: registry postcode missing or pipelineRunId not matched — registry was never written → emit REGISTRY_NOT_FOUND blocker, halt ENT stage, surface error to pipeline governor
  - action: component count in registry body differs from totalComponentCount — registry is corrupt or partially written → emit REGISTRY_CORRUPT blocker, log discrepancy, halt and await re-registration of blueprint
  - postcondition: one or more NamedBlueprintComponents have null boundedContext or assignedPackage field — incomplete schema → flag affected component IDs, emit COMPONENT_SCHEMA_INCOMPLETE, prevent assignment phase from starting

### assign-components-to-workspace-packages (ENT-stage-integration)
- **Pre:** 10 NamedBlueprintComponents loaded; 8 WorkspacePackageNodes exist with known packageNames; no ComponentPackageMapping exists for this pipelineRunId
- **Action:** iterate components by ordinal, match each to a targetPackage using boundedContext affinity rules, write one ComponentPackageAssignment per component, write ComponentPackageMapping with assignmentCount and isTotal flag
- **Post:** ComponentPackageMapping exists with assignmentCount=10; each ComponentPackageAssignment has targetPackage set; isTotal=true only if all 10 are resolved; each WorkspacePackageNode has its assignedComponentIds updated
- **Failure modes:**
  - action: component at ordinal 3 (C3) has no matching WorkspacePackageNode by boundedContext — C3AssignmentGap is created with isResolved=false → create C3AssignmentGap record with candidatePackages populated from fuzzy match; set ComponentPackageMapping.isTotal=false; do NOT halt — continue assigning remaining components; proceed to gap-resolution step
  - action: two components map to same targetPackage in a context where package capacity is exceeded — collision → log collision, apply secondary affinity rule (responsibility keyword match), reassign lower-priority component, re-evaluate
  - postcondition: assignmentCount < 10 after full iteration — at least one component was silently dropped → compare component IDs in assignments vs registry, identify missing IDs, emit ASSIGNMENT_INCOMPLETE, block extraction phase

### resolve-C3-assignment-gap (ENT-stage-integration)
- **Pre:** C3AssignmentGap exists for pipelineRunId with isResolved=false and candidatePackages is non-empty; ComponentPackageMapping.isTotal=false
- **Action:** evaluate candidatePackages using responsibility-text similarity score; select highest-scoring package as resolvedPackage; write ENTProvenanceRecord for resolution decision; update C3AssignmentGap.isResolved=true and resolvedPackage; update corresponding ComponentPackageAssignment.targetPackage; set ComponentPackageMapping.isTotal=true
- **Post:** C3AssignmentGap.state=RESOLVED; ComponentPackageAssignment for ordinal 3 has targetPackage non-null and isResolved=true; ComponentPackageMapping.isTotal=true; resolutionProvenancePostcode written
- **Failure modes:**
  - precondition: candidatePackages is empty — no fuzzy match was possible during assignment phase → transition C3AssignmentGap to FAILED state; emit C3_UNRESOLVABLE blocker; escalate to human governor decision; pipeline remains stalled
  - action: similarity scores are tied across multiple candidatePackages — deterministic selection not possible → apply tiebreak rule: prefer package with fewest currently assigned components; if still tied, select lexicographically first packageName; log tiebreak rationale in ENTProvenanceRecord
  - postcondition: resolutionProvenancePostcode not written — provenance event failed to persist → mark C3AssignmentGap as RESOLVED but flag provenanceIntact risk; retry provenance write up to 3 times; if exhausted, emit PROVENANCE_WRITE_FAILURE and flag ProvenanceChainRecord as incomplete for this component

### extract-and-register-entities-into-entity-map (ENT-stage-integration)
- **Pre:** ComponentPackageMapping.isTotal=true; all 10 ComponentPackageAssignments have isResolved=true; EntityMap for pipelineRunId does not yet exist or has entityCount=0
- **Action:** for each ComponentPackageAssignment, read the NamedBlueprintComponent's name and responsibility, extract entity names using semantic parse, create one ENTEntityRegistration per extracted entity with sourceComponentId and targetRegistryType, write entityMapPostcode and provenanceRecordPostcode per registration, accumulate into EntityMap
- **Post:** EntityMap exists with entityCount >= 10 (at least one entity per component); each ENTEntityRegistration has registeredAt timestamp, entityMapPostcode, and provenanceRecordPostcode non-null; EntityMap.postcode is written
- **Failure modes:**
  - precondition: ComponentPackageMapping.isTotal=false at time of extraction — gap was not resolved before this step executed → abort extraction; emit EXTRACTION_BLOCKED_BY_GAP; ensure C3 gap resolution step is replayed before retry
  - action: semantic parse of a component's responsibility yields zero entity names — component has ambiguous or empty responsibility text → emit ENTITY_EXTRACTION_EMPTY for that sourceComponentId; use component name itself as fallback entity name; register with a LOW_CONFIDENCE flag on the ENTEntityRegistration
  - postcondition: EntityMap.postcode not written — map accumulation succeeded but final write failed → retry EntityMap write with exponential backoff; if all retries fail, mark EntityMap as DRAFT state and block gate evaluation until postcode is confirmed

### validate-three-hop-provenance-chain (ENT-stage-integration)
- **Pre:** EntityMap.postcode exists; at least one ENTEntityRegistration per component exists with provenanceRecordPostcode set; ProvenanceChainRecord for pipelineRunId does not yet have provenanceIntact=true
- **Action:** for each component, construct ProvenanceChainRecord with hopCount=3; trace hop 0: BlueprintComponentRegistry postcode → ComponentPackageAssignment provenanceRecordPostcode; trace hop 1: ComponentPackageAssignment → ENTEntityRegistration provenanceRecordPostcode; trace hop 2: ENTEntityRegistration → EntityMap postcode; mark each ProvenanceChainHop.isTraced; set ProvenanceChainRecord.provenanceIntact based on all hops traced
- **Post:** ProvenanceChainRecord exists for pipelineRunId with hopCount=3; all ProvenanceChainHops have isTraced=true; ProvenanceChainRecord.provenanceIntact=true; ProvenanceChainRecord.postcode written
- **Failure modes:**
  - action: hop 1 fromLabel postcode does not match any known ComponentPackageAssignment provenanceRecordPostcode — postcode mismatch breaks chain → mark that ProvenanceChainHop.isTraced=false; set ProvenanceChainRecord.provenanceIntact=false; emit PROVENANCE_HOP_BROKEN with hop index; gate evaluation will receive provenanceIntact=false and fail unless compensated
  - action: C3 resolution provenance record was never written (from earlier failure mode) — hop involving C3 component cannot be traced → attempt to reconstruct C3 provenance from C3AssignmentGap.resolutionProvenancePostcode; if not recoverable, mark chain broken for C3 component only; emit PARTIAL_PROVENANCE_CHAIN
  - postcondition: ProvenanceChainRecord.postcode not written — validation succeeded but record persistence failed → retry write; if failed, gate evaluation proceeds with in-memory provenanceIntact value but emits PROVENANCE_RECORD_UNPERSISTED warning; treat as soft failure unless gate is configured strict

### evaluate-ENT-gate (ENT-stage-integration)
- **Pre:** EntityMap.entityCount >= 1; ProvenanceChainRecord.provenanceIntact is determined (true or false); no uncleared ENT blockers remain in active state
- **Action:** read entityCount from EntityMap; read provenanceIntact from ProvenanceChainRecord; read allBlockersCleared by querying active blocker list for pipelineRunId; compute passed = (entityCount > 0 AND provenanceIntact AND allBlockersCleared); write ENTGateRecord with evaluatedAt timestamp and governorDecisionPostcode; set ENTGateRecord.state
- **Post:** ENTGateRecord exists with passed=true or passed=false; evaluatedAt is set; if passed=true then pipeline run advances past ENT stage; if passed=false then pipeline run remains at ENT stage with GATE_FAILED state
- **Failure modes:**
  - precondition: active blockers still exist — C3 gap or provenance failure was never cleared → set allBlockersCleared=false; ENTGateRecord.passed=false; emit GATE_BLOCKED_BY_OPEN_BLOCKERS; pipeline run transitions to BLOCKED state
  - action: governorDecisionPostcode write fails — gate computed a result but cannot record the decision → retry postcode write; if exhausted, still record ENTGateRecord with passed value but flag DECISION_UNANCHORED; treat as audit risk, not pipeline block
  - postcondition: passed=true but pipeline run does not advance — downstream stage listener missed the gate event → re-emit gate-passed event with ENTGateRecord.gateId; if pipeline run still stalled after re-emit, escalate to pipeline governor for manual stage advancement

### diagnose-stall-cause (unblock-stalled-pipeline-run)
- **Pre:** pipelineRunId ML.ENT.e80e3c97/v1 exists in STALLED state; ENT stage is the current stage
- **Action:** query C3AssignmentGap for pipelineRunId — check isResolved; query ENTGateRecord for pipelineRunId — check if evaluated; query active blockers for pipelineRunId; query ProvenanceChainRecord for provenanceIntact; query EntityMap for entityCount
- **Post:** stall cause is classified into one of: GAP_UNRESOLVED, GATE_NOT_EVALUATED, EXTRACTION_NOT_STARTED, PROVENANCE_BROKEN, UNKNOWN; cause is logged with evidence postcodes
- **Failure modes:**
  - action: no C3AssignmentGap record exists and ComponentPackageMapping.isTotal=false — assignment phase never wrote the gap record → synthesize C3AssignmentGap from ComponentPackageMapping data; set state=OPEN; proceed as if gap was just detected
  - postcondition: stall cause classified as UNKNOWN — no diagnostic query returned useful state → emit STALL_UNDIAGNOSABLE; request full re-execution of ENT stage from load-and-validate-blueprint-registry step; preserve existing EntityMap if present to avoid data loss

### clear-open-blockers-and-gaps (unblock-stalled-pipeline-run)
- **Pre:** stall cause is identified; C3AssignmentGap.isResolved=false OR active blockers exist for pipelineRunId
- **Action:** if cause=GAP_UNRESOLVED: execute resolve-C3-assignment-gap sub-workflow; if cause=PROVENANCE_BROKEN: re-execute validate-three-hop-provenance-chain; if cause=EXTRACTION_NOT_STARTED: execute extract-and-register-entities sub-workflow; mark cleared blockers as RESOLVED with resolution timestamp
- **Post:** C3AssignmentGap.isResolved=true; no active blockers remain for pipelineRunId; ComponentPackageMapping.isTotal=true
- **Failure modes:**
  - precondition: stall cause was UNKNOWN and re-execution was requested — re-execution conflicts with partially-written EntityMap → archive existing EntityMap as EntityMap.state=SUPERSEDED before re-executing; create fresh EntityMap to avoid duplicate entity registrations
  - action: C3 gap resolution fails again (candidatePackages empty) — root cause is unresolvable by automation → transition pipeline run to AWAITING_HUMAN_INPUT state; emit human-escalation event with C3AssignmentGap details; do not retry automatically
  - postcondition: active blockers still exist after resolution attempts — a blocker's clear condition was not met → log each remaining blocker ID with its unmet clear condition; emit BLOCKERS_NOT_CLEARED; prevent gate re-evaluation until all are resolved

### resume-pipeline-run-through-ENT-gate (unblock-stalled-pipeline-run)
- **Pre:** pipelineRunId is in STALLED state; C3AssignmentGap.isResolved=true; EntityMap.entityCount >= 10; ProvenanceChainRecord.provenanceIntact=true; no active blockers
- **Action:** transition pipeline run from STALLED to RESUMING; re-execute evaluate-ENT-gate step; on gate passed, transition pipeline run to ADVANCED; write final ENTGateRecord with passed=true
- **Post:** pipeline run ML.ENT.e80e3c97/v1 is no longer in STALLED state; ENTGateRecord.passed=true; pipeline run state=ADVANCED; next stage is triggered
- **Failure modes:**
  - precondition: EntityMap.entityCount < 10 — extraction was incomplete despite gap resolution → identify which component IDs have no ENTEntityRegistration; re-execute extraction for those components only (partial re-extraction); do not duplicate existing registrations
  - action: gate evaluates but passed=false — a condition regressed during resume (e.g. provenance became broken during re-execution) → transition pipeline run back to BLOCKED (not STALLED); emit RESUME_FAILED_GATE_REJECTED with ENTGateRecord.gateId; require fresh diagnosis before next unblock attempt
  - postcondition: pipeline run advances but next stage does not start — downstream listener not subscribed to gate-passed event for this pipelineRunId → re-emit gate-passed event with explicit pipelineRunId and ENTGateRecord.gateId; verify downstream stage subscription; if still unresponsive, escalate to pipeline governor

### verify-codebase-integrity-after-changes (unblock-stalled-pipeline-run)
- **Pre:** pipeline run has advanced past ENT stage; any TypeScript source files were modified during ENT integration implementation
- **Action:** run TypeScript compiler with --noEmit; run existing test suite; verify no new type errors; verify all pre-existing tests pass; check that no ENT-stage entity files were accidentally deleted or overwritten
- **Post:** TypeScript compilation exits with code 0; test suite passes with zero new failures; codebase is in consistent state with all ENT integration changes applied
- **Failure modes:**
  - action: TypeScript compilation fails — a new type was introduced without proper interface declaration or an import is missing → identify failing file and line; revert only the offending change if isolated; if entangled with ENT logic, roll back entire ENT implementation changeset and re-implement with correct types
  - action: existing tests fail — a refactor of an assignment or provenance function changed behavior relied on by prior tests → run failing tests in isolation; determine if test expectation is now wrong (update test) or implementation regressed (fix implementation); do not suppress tests
  - postcondition: compilation passes but runtime behavior is incorrect — types are satisfied but logic produces wrong entityCount or wrong gate result → add integration test that asserts entityCount=10 and passed=true for a known fixture pipelineRunId; run test; fix logic until test passes

## Acceptance Criteria
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

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
