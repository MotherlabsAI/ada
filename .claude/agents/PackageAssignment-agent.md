---
name: PackageAssignment-agent
description: Use when PackageAssignment tasks arise. Owns PackageMappingFinalizer. Does not modify files outside PackageAssignment.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
maxTurns: 30
---
# PackageMappingFinalizer Agent

Finalizes all ComponentPackageAssignments after collapse resolution, marks the ComponentPackageMapping as total (isTotal = true), and validates that exactly 10 components map to exactly 8 packages. WHY: Workflow step 'finalize-assignment-and-mark-mapping-total' requires totality check. Entity ComponentPackageMapping invariant isTotal === assignments.every(a => a.isResolved). This component bridges GapResolution completion to PackageAssignment totality.

## Bounded Context
**Context:** PackageAssignment
**Entities:** ComponentPackageMapping, ComponentPackageAssignment, WorkspacePackageNode, PackageOwnershipDeclaration
**Interfaces:** finalizeMapping(mapping: ComponentPackageMapping, resolvedAssignment: ComponentPackageAssignment): ComponentPackageMapping, validateTotality(mapping: ComponentPackageMapping): boolean, getAssignment(componentOrdinal: number): ComponentPackageAssignment
**Dependencies:** CollapseStrategyResolver

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

- `componentPackageMapping.assignments.length === 10` — the mapping must cover all 10 components; fewer than 10 assignments means at least one component is unrouted
- `new Set(componentPackageMapping.assignments.map(a => a.targetPackage)).size === 8` — assignments must target exactly 8 distinct packages; more or fewer than 8 target packages violates the 10-to-8 mapping constraint of G3
- `componentPackageMapping.assignmentCount === componentPackageMapping.assignments.length` (ComponentPackageMapping) — declared count must match actual array length; a mismatch would allow phantom assignments to satisfy isTotal
- `componentPackageMapping.isTotal === (componentPackageMapping.assignments.every(a => a.isResolved))` (ComponentPackageMapping) — isTotal is only true when ALL assignments are resolved; partial resolution must not present as total
- `componentPackageMapping.assignments.map(a => a.componentOrdinal).every((o, i, arr) => arr.indexOf(o) === i)` (ComponentPackageMapping) — each component ordinal must appear at most once; duplicate assignments would double-count components and corrupt the 10-to-8 mapping
- `componentPackageMapping.mappingId !== null && componentPackageMapping.mappingId.length > 0` (ComponentPackageMapping) — the mapping needs a stable ID so gap records and provenance chains can reference it
- `componentPackageAssignment.isResolved === true || componentPackageAssignment.provenanceRecordPostcode === null` (ComponentPackageAssignment) — unresolved assignments must not carry provenance postcodes; a postcode on an unresolved assignment would falsely imply auditable completion
- `componentPackageAssignment.isResolved === false || componentPackageAssignment.provenanceRecordPostcode !== null` (ComponentPackageAssignment) — resolved assignments MUST have provenance; resolution without provenance is unauditable and violates G5
- `componentPackageAssignment.componentOrdinal >= 1 && componentPackageAssignment.componentOrdinal <= 10` (ComponentPackageAssignment) — ordinal must be within the valid 1-10 range of the 10-component registry
- `componentPackageAssignment.assignmentId !== null && componentPackageAssignment.assignmentId.length > 0` (ComponentPackageAssignment) — each assignment must be uniquely addressable so the C3 gap can reference exactly the unresolved slot
- `workspacePackageNode.packageName !== null` (WorkspacePackageNode) — every workspace package must have a unique name; null names make package-to-component routing impossible
- `workspacePackageNode.assignedComponentIds.length >= 1` (WorkspacePackageNode) — G3 maps 10 components to 8 packages, meaning some packages receive multiple components; a package with zero assigned components is unused and should not exist in the mapping
- `workspacePackageNode.pipelineStage !== null && workspacePackageNode.pipelineStage.length > 0` (WorkspacePackageNode) — each package must declare the pipeline stage it serves; G9 asks which package owns ENT integration and this field answers that question
- `packageOwnershipDeclaration.packageName !== null` (PackageOwnershipDeclaration) — every declaration must name the owning package; null package name makes G9 unanswerable
- `packageOwnershipDeclaration.ownedDomain !== null && packageOwnershipDeclaration.ownedDomain.length > 0` (PackageOwnershipDeclaration) — the declaration must name the domain being owned; an empty domain means the ownership claim is unscoped and cannot answer G9
- `packageOwnershipDeclaration.justification !== null && packageOwnershipDeclaration.justification.length > 0` (PackageOwnershipDeclaration) — ownership must be justified; unjustified declarations are arbitrary and would not survive architectural review
- `packageOwnershipDeclaration.isENTOwner === true || packageOwnershipDeclaration.ownedDomain !== 'ENT'` (PackageOwnershipDeclaration) — if the domain is ENT, isENTOwner must be true; a mismatch means the flag is stale and G9 would return a wrong answer

## Workflow Steps
### evaluate-ent-gate (evaluate-ent-stage-to-passing-result)
- **Pre:** All ProvenanceChainRecord.provenanceIntact = true AND ENTEntityMap.entityCount > 0 AND ENTEntityMap.postcode is non-null AND ComponentPackageMapping.isTotal = true AND BlueprintComponentRegistry.totalComponentCount = 10
- **Action:** instantiate ENTGateRecord for pipelineRunId; evaluate all gate conditions: (1) registry completeness, (2) entity map population, (3) provenance chain integrity, (4) mapping totality; if all pass write ENTStageResult with passing=true; if any fail write ENTStageResult with passing=false and record which condition failed
- **Post:** ENTStageResult exists with passing=true; ENTGateRecord references this pipelineRunId; all gate condition checks are recorded in ENTGateRecord
- **Failure modes:**
  - precondition: ENTEntityMap.entityCount > 0 is not met — entity extraction ran but no entities accumulated, map is empty → re-trigger extract-and-register-canonical-entities step; do not evaluate gate until map is confirmed non-empty
  - action: Gate evaluation reads stale cached values — ComponentPackageMapping.isTotal reads as false from cache though DB value is true → bust cache for ComponentPackageMapping; reload from authoritative store; re-evaluate; log cache-staleness incident
  - postcondition: ENTStageResult is written with passing=true but ENTBlocker.isCleared remains false — the blocker-clearance step was not triggered by the gate evaluation → explicitly trigger blocker-clearance step after ENTStageResult is confirmed passing; set ENTBlocker.isCleared=true, clearedAt=now, clearanceProvenancePostcode from ENTStageResult

## Resolved Decisions
These conflicts were resolved during compilation. Do not revisit them.

- **WorkspacePackageNode appears in both PackageAssignment and WorkspaceStructure bounded contexts with different invariants vs Workflow resolve-c3-assignment-gap uses WorkspacePackageNode for component-to-package mapping; TypeScript compilation concern (G7) uses it for workspace structure validation:** PackageAssignment is the authoritative owner of WorkspacePackageNode because the entity's primary invariant (assignedComponentIds.length >= 1) directly serves the component mapping workflow. WorkspaceStructure has a read-only dependency on WorkspacePackageNode for build validation. The WorkspaceTypeGuard component in WorkspaceStructure context imports WorkspacePackageNode from @ada/ent (PackageAssignment's package) without modifying it. _(authoritative: process)_

## Acceptance Criteria
- [ ] ENTStageResult exists with passing=true; ENTGateRecord references this pipelineRunId; all gate condition checks are recorded in ENTGateRecord

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
- **[compliance]** Component-to-package mapping must resolve all 10 components to exactly 8 workspace packages with C3 collapse (`componentPackageMapping.isTotal === true && new Set(assignments.map(a => a.packageName)).size === 8`) — _verify: Unit test that asserts mapping.isTotal, assignment count === 10, and unique target package count === 8_
- **[maintainability]** All ENT integration types must use existing codebase vocabulary — no parallel type definitions — _verify: Code review and grep for duplicate type names; ensure all imports trace to @ada/ent, @ada/compiler, @ada/int-rerun, or @ada/provenance_
- **[maintainability]** pnpm workspace structure must be preserved — no new package managers or build systems introduced — _verify: Confirm pnpm-workspace.yaml unchanged; no yarn.lock, package-lock.json, or alternative lockfiles present_

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
