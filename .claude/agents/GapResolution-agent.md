---
name: GapResolution-agent
description: Use when GapResolution tasks arise. Owns CollapseStrategyResolver. Does not modify files outside GapResolution.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
maxTurns: 30
---
# CollapseStrategyResolver Agent

Selects and applies the collapse resolution strategy for the C3 ordinal-3 gap. Identifies the target package from candidatePackages, records the priorOccupantComponentIds, and transitions C3AssignmentGap from 'open' → 'resolving' → 'resolved'. WHY: Workflow steps 'select-collapse-resolution-strategy' and 'apply-collapse-strategy' require a component that implements the collapse semantics mandated by C6. Entity CollapseResolutionStrategy defines the strategy shape with targetComponentOrdinal === 3.

## Bounded Context
**Context:** GapResolution
**Entities:** C3AssignmentGap, CollapseResolutionStrategy
**Interfaces:** selectStrategy(gap: C3AssignmentGap): CollapseResolutionStrategy, applyCollapse(strategy: CollapseResolutionStrategy, gap: C3AssignmentGap): ComponentPackageAssignment, getStrategyState(strategyId: string): CollapseResolutionStrategy
**Dependencies:** C3GapDetector

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

- `c3AssignmentGap.isResolved === collapseResolutionStrategy.isApplied` — the gap resolved state must align with the strategy applied state; a strategy applied without a resolved gap is an inconsistent context state
- `c3AssignmentGap.resolvedPackage === null || collapseResolutionStrategy.collapseIntoPackage === c3AssignmentGap.resolvedPackage` — when resolved, the gap's resolved package must match the strategy's target package; a mismatch means a different mechanism resolved the gap outside the declared strategy
- `c3AssignmentGap.componentOrdinal === 3` (C3AssignmentGap) — this entity represents exactly the ordinal-3 gap; any other ordinal is a different gap and should not use this type
- `c3AssignmentGap.candidatePackages.length >= 1` (C3AssignmentGap) — the gap must have at least one candidate package for the collapse strategy to have a valid target; zero candidates means the gap is irresolvable
- `c3AssignmentGap.isResolved === false || c3AssignmentGap.resolvedPackage !== null` (C3AssignmentGap) — a resolved gap must name the package it resolved to; null resolvedPackage on a resolved gap is a contradiction
- `c3AssignmentGap.isResolved === false || c3AssignmentGap.resolutionProvenancePostcode !== null` (C3AssignmentGap) — gap resolution must carry provenance; without this, G5 three-hop chain validation cannot include the C3 resolution hop
- `c3AssignmentGap.isResolved === true || c3AssignmentGap.resolvedPackage === null` (C3AssignmentGap) — an unresolved gap must not name a resolved package; premature resolution claims corrupt the blocking state
- `c3AssignmentGap.isResolved === false || c3AssignmentGap.candidatePackages.includes(c3AssignmentGap.resolvedPackage as WorkspacePackageName)` (C3AssignmentGap) — the resolved package must be one of the declared candidates; resolving to a non-candidate package bypasses the collapse strategy constraints
- `collapseResolutionStrategy.targetComponentOrdinal === 3` (CollapseResolutionStrategy) — this strategy resolves specifically the C3 gap; a strategy targeting another ordinal is a different entity
- `collapseResolutionStrategy.strategyId !== null && collapseResolutionStrategy.strategyId.length > 0` (CollapseResolutionStrategy) — the strategy must be uniquely identified so the C3AssignmentGap can reference exactly which strategy resolved it
- `collapseResolutionStrategy.selectionRationale !== null && collapseResolutionStrategy.selectionRationale.length > 0` (CollapseResolutionStrategy) — collapse into an existing package must be justified; an empty rationale makes the resolution arbitrary and unauditable
- `collapseResolutionStrategy.priorOccupantComponentIds.length >= 1` (CollapseResolutionStrategy) — collapse means joining an already-occupied package; zero prior occupants means this is not a collapse but a fresh assignment
- `collapseResolutionStrategy.isApplied === false || collapseResolutionStrategy.targetGapId !== null` (CollapseResolutionStrategy) — an applied strategy must reference the gap it resolved; without this the C3AssignmentGap cannot trace its resolution

## State Machines
### C3AssignmentGap
**States:** open → resolving → resolved → failed
**Transitions:**
- open → resolving (trigger: CollapseResolutionStrategy.isApplied transitions to true; guard: CollapseResolutionStrategy.collapseIntoPackage references a valid WorkspacePackageNode AND ComponentPackageAssignment for ordinal-3 write has been initiated)
- resolving → resolved (trigger: ComponentPackageAssignment.isResolved = true confirmed AND resolutionProvenancePostcode is non-null; guard: ComponentPackageMapping.isTotal = true AND C3AssignmentGap.resolvedPackage is non-null)
- resolving → failed (trigger: CollapseResolutionStrategy application throws unrecoverable error OR collapseIntoPackage becomes invalid; guard: retry count exceeds maximum OR WorkspacePackageNode for collapseIntoPackage no longer exists)
- failed → open (trigger: operator manually resets gap for re-resolution; guard: StalledPipelineRun.resumable = false AND new candidatePackages list is non-empty)

### CollapseResolutionStrategy
**States:** draft → applied → committed → invalidated
**Transitions:**
- draft → applied (trigger: apply-collapse-strategy step executes successfully; guard: isApplied transitions from false to true AND C3AssignmentGap.state transitions to resolving)
- applied → committed (trigger: ComponentPackageMapping.isTotal = true is confirmed; guard: C3AssignmentGap.state = resolved AND resolutionProvenancePostcode is non-null)
- applied → invalidated (trigger: collapseIntoPackage WorkspacePackageNode is removed or renamed after strategy application; guard: WorkspacePackageNode lookup by collapseIntoPackage returns not-found)
- invalidated → draft (trigger: operator triggers strategy re-selection with updated candidatePackages; guard: C3AssignmentGap.state reset to open AND new candidatePackages list excludes invalidated package)

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

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
