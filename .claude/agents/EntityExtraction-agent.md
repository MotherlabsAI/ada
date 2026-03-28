---
name: EntityExtraction-agent
description: Use when EntityExtraction tasks arise. Owns CanonicalEntityExtractor. Does not modify files outside EntityExtraction.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
maxTurns: 30
---
# CanonicalEntityExtractor Agent

Extracts CanonicalEntity instances from blueprint components and registers them into an EntityMap via ENTEntityRegistration events. Transitions ENTEntityMap from 'empty' → 'accumulating' → 'populated'. WHY: Workflow step 'extract-and-register-canonical-entities' populates the EntityMap (G4). Entity ENTEntityRegistration defines the registration event shape. Entity CanonicalEntity defines the extracted entity shape. ENTEntityMap invariant entityCount >= 1 for populated state.

## Bounded Context
**Context:** EntityExtraction
**Entities:** ENTEntityMap, ENTEntityRegistration, CanonicalEntity
**Interfaces:** extractEntities(registry: BlueprintComponentRegistry): CanonicalEntity[], registerEntity(entity: CanonicalEntity, pipelineRunId: string): ENTEntityRegistration, populateEntityMap(registrations: ENTEntityRegistration[]): EntityMap, getEntityMapState(pipelineRunId: string): ENTEntityMap
**Dependencies:** BlueprintRegistryLoader

## Domain Vocabulary
Use these exact terms when naming variables, types, and functions.

- **Ada** — ISO/IEC 8652 programming language, designed for safety-critical and high-integrity systems
- **.ads** — Ada specification file — declares the public interface of a package or subprogram unit
- **.adb** — Ada body file — implements the subprogram or package body
- **GNAT** — GNU NYU Ada Translator — the dominant open-source Ada compiler, front-end to GCC
- **gprbuild** — Ada-specific build tool consuming .gpr project files, replacing gnatmake
- **gnatbind** — Ada binder that validates consistency of compiled units and determines elaboration order
- **gnatlink** — Ada linker driver that links object files and the binder-generated elaboration file
- **ALI file** — Ada Library Information file encoding unit fingerprints, dependencies, and compiler flags used
- **elaboration** — runtime initialization phase where package-level code executes before the main procedure
- **elaboration order** — the sequence in which packages are elaborated at startup; incorrect order causes Program_Error
- **compilation unit** — the atomic unit of Ada compilation — one spec or one body file
- **library unit** — a top-level compilation unit that can be withed by other units
- **child unit** — a hierarchically named package extending a parent (e.g., Ada.Text_IO is a child of Ada)
- **project file** — .gpr file defining source locations, compiler switches, target, and runtime for gprbuild
- **runtime profile** — selected Ada runtime library variant (full RTS, Ravenscar, Jorvik, zero-footprint)
- **with clause** — Ada's dependency declaration — makes another unit's spec visible and creates a compile dependency
- **pragma** — Ada compiler directive, e.g., pragma Elaborate_All, pragma Pure, pragma Preelaborate
- **Alire** — modern Ada/SPARK package manager using manifest files (alire.toml) and crate registry
- **SPARK** — formally verifiable subset of Ada with additional annotations for proof

## Stakeholders
- **Embedded/Safety-Critical Systems Programmer**
  - Knows: Ada spec/body separation (.ads/.adb file model), GNAT toolchain: gnatmake, gprbuild, gnatbind, gnatlink, Ada language standards: Ada 83, 95, 2005, 2012, 2022, Package elaboration order and its runtime implications, ALI file dependency tracking, .gpr project file syntax and semantics, Cross-compilation targets: ARM, SPARC, x86 bare-metal, Ravenscar and Jorvik tasking profiles for embedded, Strong typing, contracts, preconditions, postconditions, Separate compilation model and library units
  - Blind spots: Assumes elaboration order warnings are non-critical until they cause runtime failure, Assumes GNAT FSF and GNAT Pro are interchangeable for all features, Assumes .gpr project files are optional for small projects, Assumes all Ada runtimes include tasking support, Assumes compiler flags from one GNAT version transfer cleanly to another
  - Fears: Elaboration order errors that manifest only at runtime, not compile time, Circular dependency in package specs causing compilation failure, Missing body for a package spec causing linker errors, Wrong Ada language version flag producing silent incompatibilities, Toolchain version mismatch between gnatcompile, gnatbind, and gnatlink, Bare-metal target missing required runtime library units, ALI file staleness causing incorrect incremental builds
  - Vocabulary: "package" = Ada modular unit with a spec (.ads) and optional body (.adb) — NOT a package manager concept; "compilation unit" = a single Ada source file (.ads or .adb) submitted to the compiler as an independent unit; "elaboration" = runtime execution of package-level declarative code during program startup; "binding" = the gnatbind phase that computes a valid elaboration order and generates a C binder file; "ALI file" = Ada Library Information file — compiler-generated metadata encoding unit dependencies and version stamps; "project file" = .gpr file consumed by gprbuild describing source directories, switches, target, and runtime; "with clause" = Ada's import declaration, creating a compile-time dependency on another unit's spec; "use clause" = makes a package's public declarations directly visible without qualification; "body" = the .adb implementation file containing subprogram bodies and package body; "spec" = the .ads specification file declaring the public interface of a package or subprogram; "child unit" = a package declared as a hierarchical extension of a parent package (Parent.Child); "runtime profile" = a configured subset of the Ada runtime library (full, embedded, ravenscar, zero-footprint); "elaboration pragma" = pragma Elaborate, Elaborate_All, or Elaborate_Body — directives controlling elaboration order
- **Ada Toolchain Integrator / Build Engineer**
  - Knows: gprbuild project file inheritance and aggregation, GNAT compilation switches: -gnat95, -gnat2012, -gnatp, -gnata, -O2, etc., Cross-compilation toolchain prefixes and target triples, Alire package manager for Ada/SPARK dependency management, Makefile and CI integration patterns for Ada builds, SPARK formal verification toolchain (gnatprove), Object directory and source directory separation in .gpr files
  - Blind spots: Assumes Alire crates are always available for all target platforms, Assumes gnatprove verification and compilation use identical flags, Assumes CI environments have GNAT in PATH without explicit setup
  - Fears: Toolchain not found or wrong version on CI runner, Project file misconfiguration silently compiling wrong source directories, Cross-compiler producing code for wrong target without error, SPARK proof regressions when switching compiler versions
  - Vocabulary: "crate" = Alire's term for an Ada/SPARK dependency package (analogous to npm package or Rust crate); "gprbuild" = the primary build tool for Ada projects using .gpr project files; "gnatmake" = older single-file-centric Ada build driver, largely superseded by gprbuild; "aggregate project" = a .gpr project type that composes multiple sub-projects into one build; "scenario variable" = a .gpr variable switchable at build time to select between configurations; "target triple" = architecture-vendor-os string identifying the cross-compilation target; "gnatprove" = SPARK formal verification tool that also performs flow analysis and proof

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `entEntityMap.entities.every(r => r.targetRegistryType === 'EntityMap')` — every registration in the EntityMap context must target the EntityMap; misrouted registrations would corrupt the populated entity count
- `entEntityMap.entityCount >= 1` — G4 requires a populated EntityMap; zero registrations in this context means G4 is not met
- `entEntityRegistration.registrationId !== null && entEntityRegistration.registrationId.length > 0` (ENTEntityRegistration) — each registration must be uniquely addressable so duplicate entity extraction can be detected
- `entEntityRegistration.sourceComponentId !== null && entEntityRegistration.sourceComponentId.length > 0` (ENTEntityRegistration) — every entity in the EntityMap must trace to a source component; orphaned registrations break G5 provenance chains
- `entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0` (ENTEntityRegistration) — G5 requires three-hop provenance; the registration itself is a hop node and must carry its own postcode
- `entEntityRegistration.targetRegistryType === 'EntityMap'` (ENTEntityRegistration) — G4 specifically targets the EntityMap; registrations pointing elsewhere do not satisfy G4
- `entEntityRegistration.extractedEntityName !== null && entEntityRegistration.extractedEntityName.length > 0` (ENTEntityRegistration) — a registration with no entity name cannot populate the EntityMap with a meaningful CanonicalEntity entry
- `entEntityMap.entityCount === entEntityMap.entities.length` (ENTEntityMap) — declared count must match actual array length; a mismatch would allow a falsely populated count to pass the gate
- `entEntityMap.entityCount >= 1` (ENTEntityMap) — G4 requires the EntityMap to be populated; zero entities means extraction failed and G4 is not satisfied
- `entEntityMap.postcode !== null && entEntityMap.postcode.length > 0` (ENTEntityMap) — the EntityMap needs a postcode so ENTGateRecord can reference it during provenance verification
- `entEntityMap.entities.every(e => e.pipelineRunId === entEntityMap.pipelineRunId)` (ENTEntityMap) — all registrations must belong to the same pipeline run; cross-run entity registrations corrupt the ENT stage boundary
- `canonicalEntity.entityId !== null && canonicalEntity.entityId.length > 0` (CanonicalEntity) — canonical entities must have stable IDs so ENTEntityRegistration can reference them without ambiguity across pipeline runs
- `canonicalEntity.label !== null && canonicalEntity.label.length > 0` (CanonicalEntity) — a canonical entity with no label cannot be matched to a component name or registered in the EntityMap meaningfully

## State Machines
### ENTEntityMap
**States:** empty → accumulating → populated → postcode-confirmed
**Transitions:**
- empty → accumulating (trigger: first ENTEntityRegistration event fires for this pipelineRunId; guard: BlueprintComponentRegistry is fully loaded AND ENTEntityMap record exists with entityCount = 0)
- accumulating → populated (trigger: entityCount equals expected entity count derived from BlueprintComponentRegistry.totalComponentCount; guard: no ENTEntityRegistration events are pending for this pipelineRunId)
- populated → postcode-confirmed (trigger: ENTEntityMap.postcode is written and verified non-null; guard: all CanonicalEntity records referenced in entities array have non-null entityId and label)
- accumulating → empty (trigger: rollback triggered due to registration failure — all ENTEntityRegistration events for this run are voided; guard: unrecoverable error in provenance write-path affects all registrations)

## Resolved Decisions
These conflicts were resolved during compilation. Do not revisit them.

- **EntityMap is defined as ENTEntityMap (substance) in Entity analysis with ENT-specific invariants (entityCount >= 1, pipelineRunId-scoped entities) vs Workflow step extract-and-register-canonical-entities targets 'EntityMap' type which is exported from both @ada/compiler and @ada/ent:** @ada/ent's EntityMap is the ENT-stage-specific projection that satisfies ENTEntityMap invariants. @ada/compiler's EntityMap is the general-purpose base type. @ada/ent either re-exports @ada/compiler's EntityMap with additional runtime validation or defines a compatible subtype. The CanonicalEntityExtractor component uses @ada/ent's EntityMap export. Entity analysis is authoritative for the type shape; process is authoritative for which export to consume. _(authoritative: entity)_
- **CanonicalEntity is placed in EntityExtraction bounded context (root: ENTEntityMap) by entity analysis vs CanonicalEntity is exported from @ada/int-rerun package, not @ada/ent where all other EntityExtraction context types reside. Workflow extract-and-register-canonical-entities needs CanonicalEntity in the same operational scope as ENTEntityRegistration and EntityMap:** CanonicalEntity remains defined in @ada/int-rerun as the source-of-truth type. @ada/ent must add @ada/int-rerun as a pnpm dependency and import CanonicalEntity for use in the CanonicalEntityExtractor component. The bounded context boundary is logical, not physical — a bounded context can span packages when there is a clear dependency direction (int-rerun is upstream infrastructure, ent is downstream domain). Process is authoritative because the workflow dictates the integration point. _(authoritative: process)_

## Acceptance Criteria
- [ ] Component builds without errors

## Out of Scope
These were explicitly excluded during compilation:
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

## Non-Functional Requirements
- **[maintainability]** TypeScript strict mode compilation with zero errors across all 8 target workspace packages (`tsc --noEmit --composite exits with code 0 for all packages`) — _verify: Run `pnpm -r exec tsc --noEmit` and confirm exit code 0 with zero diagnostic output_
- **[reliability]** Node.js runtime version >= 18 enforced via engines field (`process.versions.node >= '18.0.0'`) — _verify: Check engines field in root package.json and each workspace package.json; run `node -v` in CI_
- **[reliability]** Zero test regressions — all previously passing tests must continue to pass after integration changes (`testSuite.previouslyPassingTestIds.every(id => currentResults[id].passed === true)`) — _verify: Run full test suite via `pnpm test` and diff against baseline snapshot; regression count must be 0_
- **[maintainability]** All ENT integration types must use existing codebase vocabulary — no parallel type definitions — _verify: Code review and grep for duplicate type names; ensure all imports trace to @ada/ent, @ada/compiler, @ada/int-rerun, or @ada/provenance_
- **[maintainability]** pnpm workspace structure must be preserved — no new package managers or build systems introduced — _verify: Confirm pnpm-workspace.yaml unchanged; no yarn.lock, package-lock.json, or alternative lockfiles present_
- **[scalability]** EntityMap population must handle at minimum the 23 entities defined upstream without structural changes — _verify: Load test with 23+ CanonicalEntity instances; confirm EntityMap accepts and indexes all_

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
