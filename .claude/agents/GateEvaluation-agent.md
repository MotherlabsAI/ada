---
name: GateEvaluation-agent
description: Use when GateEvaluation tasks arise. Owns ENTGateEvaluator. Does not modify files outside GateEvaluation.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
maxTurns: 30
---
# ENTGateEvaluator Agent

Evaluates the ENT gate by checking four conditions: entityCount >= 1 (from EntityMap), provenanceIntact (from ProvenanceChainValidator), allBlockersCleared (from PipelineRunController), and mappingIsTotal (from ComponentPackageMapper). Produces an ENTGateRecord with state PASS or FAIL, and wraps it in an ENTStageResult with an ML-prefixed postcode. Drives the ENTGateRecord state machine from pending → evaluating → passed|failed.

## Bounded Context
**Context:** GateEvaluation
**Entities:** ENTGateRecord, ENTStageResult
**Interfaces:** evaluate(entityMap: EntityMap, provenanceChains: ProvenanceChainRecord[], blockers: ENTBlocker[], mapping: ComponentPackageMapping): ENTGateRecord, buildStageResult(gate: ENTGateRecord, entityMap: EntityMap): ENTStageResult, checkPreconditions(entityMap: EntityMap, mapping: ComponentPackageMapping): boolean
**Dependencies:** EntityExtractor, ProvenanceChainValidator, ComponentPackageMapper, PipelineRunController

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

- `gate.passed === true ? result.passed === true : true` — a passing ENTGateRecord must produce a passing ENTStageResult — gate and result pass states must agree
- `gate.state === 'PASS' ? gate.allBlockersCleared && gate.provenanceIntact && gate.mappingIsTotal && gate.entityCount >= 1 : true` — the PASS state requires all four conditions to hold simultaneously
- `gate.passed === (gate.entityCount >= 1 && gate.provenanceIntact && gate.allBlockersCleared && gate.mappingIsTotal)` (ENTGateRecord) — the passed flag must be the logical conjunction of all gate conditions — a discrepancy is a false gate result
- `gate.passed === true ? gate.state === 'PASS' : gate.state !== 'PASS'` (ENTGateRecord) — the ENTGateState enumeration must agree with the passed boolean — contradictory state is structurally invalid
- `gate.passed === true ? gate.evaluatedAt !== null : true` (ENTGateRecord) — a passing gate must record when it was evaluated — an unevaluated gate cannot have passed
- `gate.gateId !== null && gate.gateId.length > 0` (ENTGateRecord) — a gate without an ID cannot be referenced in the ENTStageResult
- `result.passed === true ? result.gateState === 'PASS' : result.gateState !== 'PASS'` (ENTStageResult) — the result's passed flag and gateState must be consistent — a passing result with a non-PASS gate state is an invalid terminal
- `result.postcode !== null && result.postcode.startsWith('ML')` (ENTStageResult) — the result must carry a valid postcode so downstream stages can reference it in their provenance chains
- `result.entityMapId !== null && result.entityMapId.length > 0` (ENTStageResult) — the result must reference the EntityMap it produced — without this the downstream SYN stage has no entity input
- `result.gateId !== null && result.gateId.length > 0` (ENTStageResult) — the result must reference the gate record that validated it — without this the result is unauditable
- `result.producedAt > 0` (ENTStageResult) — a result with no timestamp was never finalized and cannot be consumed by downstream stages

## Workflow Steps
### unblock-pipeline-run (ENT-Stage-Pipeline-Execution)
- **Pre:** ENTGateRecord.state=passed AND ENTStageResult.outcome=pass AND PipelineRun ML.ENT.e80e3c97/v1 has state=stalled
- **Action:** locate StalledPipelineRun record for ML.ENT.e80e3c97/v1, clear ENTBlocker records associated with this run, transition PipelineRun state from stalled to proceeding, emit pipeline-continuation event to downstream stage
- **Post:** PipelineRun state=proceeding AND no active ENTBlocker records remain for this pipelineRunId AND downstream stage has received continuation signal
- **Failure modes:**
  - precondition: ENTGateRecord.state=passed but PipelineRun state is failed rather than stalled — run was terminated and cannot be unblocked without a restart → emit PIPELINE_RUN_TERMINAL_STATE error, do not attempt state transition, require operator to create a new PipelineRun and replay from ENT stage entry
  - action: ENTBlocker records cannot be cleared because one blocker has a dependency on an external audit lock not owned by this process → clear only owned ENTBlocker records, flag externally-locked blocker for async release, set PipelineRun to partial-unblocked state, retry unblock after external lock expires
  - postcondition: downstream stage does not acknowledge continuation signal within timeout — signal was lost or downstream stage is itself stalled → retry signal emission up to 3 times with exponential backoff, after 3 failures set PipelineRun to stalled again with reason=DOWNSTREAM_CONTINUATION_TIMEOUT, emit alert to pipeline operator

## State Machines
### ENTGateRecord
**States:** pending → evaluating → passed → failed → reset
**Transitions:**
- pending → evaluating (trigger: evaluate-ent-gate step begins; guard: ComponentPackageMapping.isTotal=true AND ENTEntityMap.entityCount=10 AND all ProvenanceChainRecord.provenanceIntact=true)
- evaluating → passed (trigger: all four gate criteria evaluated successfully; guard: mapping totality=true AND entity count=10 AND provenance integrity=all intact AND C3 gap isResolved=true)
- evaluating → failed (trigger: any gate criterion evaluation returns false; guard: at least one of: isTotal=false OR entityCount≠10 OR any provenanceIntact=false OR C3AssignmentGap.isResolved=false)
- failed → reset (trigger: operator initiates gate reset after upstream repairs are confirmed; guard: all upstream blocking conditions have been resolved and re-verified)
- reset → pending (trigger: gate reset completes and record is re-initialized; guard: ENTGateRecord fields cleared to initial values and pipelineRunId still matches active run)

## Resolved Decisions
These conflicts were resolved during compilation. Do not revisit them.

- **ENTGateRecord entity invariant defines passed as a computed boolean: passed === (entityCount >= 1 && provenanceIntact && allBlockersCleared && mappingIsTotal) vs ENT-Stage-Pipeline-Execution workflow has evaluate-ent-gate as a discrete step that may transition gate state to 'passed' or 'failed' via the ENTGateRecord state machine:** Entity defines WHAT conditions must hold (the boolean predicate). Process defines WHEN and HOW evaluation occurs (the state machine transition). ENTGateEvaluator component computes the Entity predicate during the Process step. The gate state machine (pending → evaluating → passed|failed) is the Process concern; the invariant predicate is the Entity concern. Both are honored. _(authoritative: entity)_

## Acceptance Criteria
- [ ] PipelineRun state=proceeding AND no active ENTBlocker records remain for this pipelineRunId AND downstream stage has received continuation signal

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
- **[reliability]** ENT gate must pass if and only if all four conditions hold: entityCount >= 1, provenanceIntact, allBlockersCleared, mappingIsTotal (`gate.passed === (gate.entityCount >= 1 && gate.provenanceIntact && gate.allBlockersCleared && gate.mappingIsTotal)`) — _verify: Unit test with truth-table coverage of all 16 boolean combinations of the four conditions_
- **[performance]** ENT stage execution should complete within the same order of magnitude as other pipeline stages — no blocking I/O or external calls — _verify: All operations are in-memory typed transformations; no network or filesystem I/O beyond source file reads_
- **[scalability]** Component and entity structures must not hardcode counts — the 10-component and 8-package constraints are validated at runtime, not baked into array indices — _verify: Code review confirming registry.totalComponentCount and mapping.assignmentCount are checked dynamically_

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
