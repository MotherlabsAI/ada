# A build orchestration system that compiles the ada pnpm monorepo from TypeScript source into runnable JavaScript artifacts across 8+ workspace packages, respecting inter-package dependency order via topological sorting of workspace protocol links and TypeScript project references, producing dist/ directories with JS, declaration files, and executable CLI bin entries
## Status: GHOST — new project

## Summary
A build orchestration system that compiles the ada pnpm monorepo from TypeScript source into runnable JavaScript artifacts across 8+ workspace packages, respecting inter-package dependency order via topological sorting of workspace protocol links and TypeScript project references, producing dist/ directories with JS, declaration files, and executable CLI bin entries.

## Working Principles
- Read this file fully before doing anything
- Read all agent files in `.claude/agents/` to understand bounded contexts
- Delegate work to specialist agents by bounded context
- Follow the build order below — each step depends on the previous
- Do NOT circumvent hook enforcement — hooks enforce entity invariants
- Verify postconditions after each step before proceeding
- When uncertain, investigate first rather than asking

## Architecture
**Pattern:** layered-pipeline-with-topological-dispatch
**Rationale:** The build must resolve workspace structure before computing dependency order, compute dependency order before dispatching compilation, and dispatch compilation before validating artifacts. This layered pipeline mirrors the two upstream workflows (full-monorepo-build, clean-and-rebuild) where each step depends on the prior step's output. Topological dispatch within the compilation layer ensures upstream packages (e.g. @ada/provenance) emit artifacts before downstream consumers (e.g. @ada/compiler) attempt to resolve their imports. The four bounded contexts map cleanly to layers: WorkspaceStructure and TypeScriptProjectGraph are infrastructure, BuildOrchestration is application, ArtifactEmission is domain output.

## Components
### WorkspaceResolver
**Responsibility:** Discovers and resolves all workspace packages from the pnpm workspace configuration, enumerating each package's name, source directory, dist directory, workspace:* protocol dependencies, and bin entries. Hydrates the PnpmWorkspace and WorkspacePackage entities and transitions WorkspacePackage from 'unresolved' to 'resolved'.
**Bounded Context:** WorkspaceStructure
**Interfaces:** resolveWorkspace(rootDir: string): PnpmWorkspace, listPackages(workspace: PnpmWorkspace): WorkspacePackage[], resolveWorkspaceProtocolDeps(pkg: WorkspacePackage): WorkspaceProtocolDependency[], resolveBinEntries(pkg: WorkspacePackage): BinEntry[]

### DependencyGraphResolver
**Responsibility:** Computes the topological build order from workspace protocol dependencies and TypeScript project references. Detects cycles and produces an ordered list of packages for sequential or parallelizable compilation dispatch. Manages the TopologicalBuildOrder state machine (uncomputed → computing → valid | cycle-detected).
**Bounded Context:** TypeScriptProjectGraph
**Interfaces:** computeTopologicalOrder(packages: WorkspacePackage[], deps: WorkspaceProtocolDependency[]): TopologicalBuildOrder, detectCycles(deps: WorkspaceProtocolDependency[]): boolean, classifyUpstreamDownstream(order: TopologicalBuildOrder): { upstream: UpstreamPackage[], downstream: DownstreamPackage[] }, resolveProjectReferences(rootTsConfig: RootTsConfig): ProjectReference[]
**Dependencies:** WorkspaceResolver

### TsConfigValidator
**Responsibility:** Validates that TypeScript project configurations are consistent with the workspace dependency graph: each package's tsconfig has a valid outDir, composite mode is enabled where project references are used, and project references match workspace protocol dependencies. Ensures RootTsConfig references all package tsconfigs.
**Bounded Context:** TypeScriptProjectGraph
**Interfaces:** validateProjectReferences(refs: ProjectReference[], deps: WorkspaceProtocolDependency[]): ValidationResult, validateTsConfig(config: TsConfig): ValidationResult, validateRootConfig(rootConfig: RootTsConfig, packageConfigs: TsConfig[]): ValidationResult, validateCompositeConsistency(configs: TsConfig[]): ValidationResult
**Dependencies:** WorkspaceResolver, DependencyGraphResolver

### BuildExecutor
**Responsibility:** Executes the TypeScript compilation across all workspace packages in topological order. Invokes the build command (pnpm recursive run or tsc --build) for each package, managing WorkspacePackage state transitions through queued → compiling → compiled | failed. Tracks UpstreamPackage.artifactReady and DownstreamPackage.allUpstreamArtifactsReady to gate downstream compilation. Supports both incremental builds (leveraging TsBuildInfo) and full rebuilds.
**Bounded Context:** BuildOrchestration
**Interfaces:** executeBuild(order: TopologicalBuildOrder, scripts: BuildScript[]): BuildResult, executePackageBuild(pkg: WorkspacePackage, script: BuildScript): BuildArtifact, runPnpmRecursive(run: PnpmRecursiveRun): BuildResult, checkUpstreamReadiness(pkg: DownstreamPackage): boolean
**Dependencies:** DependencyGraphResolver, TsConfigValidator

### ArtifactValidator
**Responsibility:** Validates that build output is correct and complete: dist/ directories contain emitted JS files, declaration files (.d.ts) exist for packages that export types, bin entries resolve to existing files in dist/, and BuildArtifact invariants hold. Transitions BuildArtifact state from absent → fresh.
**Bounded Context:** ArtifactEmission
**Interfaces:** validateArtifacts(packages: WorkspacePackage[], artifacts: BuildArtifact[]): ValidationResult, validateBinEntries(entries: BinEntry[]): ValidationResult, validateDeclarationEmits(emits: DeclarationEmit[]): ValidationResult, checkArtifactFreshness(artifact: BuildArtifact, buildInfo: TsBuildInfo): ArtifactFreshness
**Dependencies:** BuildExecutor

### CleanStateManager
**Responsibility:** Manages the clean-and-rebuild workflow by removing dist/ directories and .tsbuildinfo cache files before delegating to the full build. Drives the CleanBuildState state machine through inactive → initiated → dirs-removed → cache-removed → complete. Ensures BuildArtifact transitions to 'absent' and TsBuildInfo to 'deleted' before rebuild begins.
**Bounded Context:** ArtifactEmission
**Interfaces:** initiateClean(workspace: PnpmWorkspace): CleanBuildState, removeDistDirectories(packages: WorkspacePackage[]): CleanBuildState, removeTsBuildInfoFiles(packages: WorkspacePackage[]): CleanBuildState, invokeFullBuild(executor: BuildExecutor): BuildResult
**Dependencies:** WorkspaceResolver, BuildExecutor

## Invariants
Hooks enforce these at tool boundaries. Do not violate them.

### WorkspacePackage
- `workspacePackage.name !== null && workspacePackage.name.length > 0` — package must have a non-empty name
- `workspacePackage.distDir !== null && workspacePackage.distDir.length > 0` — package must declare a dist output directory
- `workspacePackage.srcDir !== null` — package must declare a source directory
- `workspacePackage.workspaceProtocolDependencies !== null` — workspace dependencies array must be defined (may be empty)

### PnpmWorkspace
- `pnpmWorkspace.packages.length > 0` — workspace must contain at least one package
- `pnpmWorkspace.rootDir !== null && pnpmWorkspace.rootDir.length > 0` — workspace must have a root directory
- `pnpmWorkspace.workspaceYamlPath !== null` — workspace must have a pnpm-workspace.yaml path

### TsConfig
- `tsConfig.path !== null && tsConfig.path.endsWith('.json')` — tsconfig must be a JSON file
- `tsConfig.composite === true || tsConfig.projectReferences.length === 0` — a tsconfig with project references must have composite enabled
- `tsConfig.outDir !== null && tsConfig.outDir.length > 0` — tsconfig must declare an output directory
- `tsConfig.ownerPackage !== null` — tsconfig must be owned by a named package

### ProjectReference
- `projectReference.sourcePackage !== projectReference.referencedPackage` — a package cannot reference itself
- `projectReference.referencedTsConfigPath !== null && projectReference.referencedTsConfigPath.length > 0` — reference must point to a concrete tsconfig path

### BuildArtifact
- `buildArtifact.jsFiles.length > 0` — a build artifact must contain at least one compiled JS file
- `buildArtifact.distDir !== null && buildArtifact.distDir.length > 0` — artifact must reside in a named dist directory
- `buildArtifact.ownerPackage !== null` — artifact must be traceable to an owner package
- `buildArtifact.emittedAt > 0` — artifact must record a non-zero emission timestamp

### TsBuildInfo
- `tsBuildInfo.filePath.endsWith('.tsbuildinfo')` — incremental cache file must use .tsbuildinfo extension
- `tsBuildInfo.ownerPackage !== null` — tsbuildinfo must be associated with a package
- `tsBuildInfo.lastModified > 0` — modification timestamp must be positive

### TopologicalBuildOrder
- `topologicalBuildOrder.cycleDetected === false` — topological order must contain no cycles — a cycle makes build order undefined
- `topologicalBuildOrder.orderedPackages.length > 0` — at least one package must be present in the ordered list
- `topologicalBuildOrder.orderedPackages.length === new Set(topologicalBuildOrder.orderedPackages).size` — each package must appear exactly once in the ordered list

### WorkspaceProtocolDependency
- `workspaceProtocolDependency.specifier.startsWith('workspace:')` — specifier must use the pnpm workspace protocol prefix
- `workspaceProtocolDependency.consumerPackage !== workspaceProtocolDependency.providerPackage` — a package cannot declare itself as a workspace dependency

### CleanBuildState
- `cleanBuildState.initiatedAt > 0` — clean must record a valid initiation timestamp
- `cleanBuildState.distDirsRemoved !== null` — clean state must track which dist directories were removed

### BinEntry
- `binEntry.commandName !== null && binEntry.commandName.length > 0` — bin entry must declare a non-empty command name
- `binEntry.resolvedEntryPoint !== null && binEntry.resolvedEntryPoint.length > 0` — bin entry must point to a compiled entrypoint
- `binEntry.ownerPackage !== null` — bin entry must be owned by a package

### DeclarationEmit
- `declarationEmit.dtsFiles.length > 0` — declaration emit must produce at least one .d.ts file
- `declarationEmit.typesEntryPoint !== null && declarationEmit.typesEntryPoint.endsWith('.d.ts')` — the types entry point must be a .d.ts file
- `declarationEmit.ownerPackage !== null` — declaration emit must be associated with an owner package

### BuildScript
- `buildScript.scriptName !== null && buildScript.scriptName.length > 0` — build script must have a non-empty name
- `buildScript.command !== null && buildScript.command.length > 0` — build script must specify a non-empty command
- `buildScript.ownerPackage !== null` — build script must belong to a named package

### PnpmRecursiveRun
- `pnpmRecursiveRun.scriptName !== null && pnpmRecursiveRun.scriptName.length > 0` — recursive run must target a named script
- `pnpmRecursiveRun.workspaceRoot !== null` — recursive run must reference a workspace root

### RootTsConfig
- `rootTsConfig.path !== null && rootTsConfig.path.endsWith('.json')` — root tsconfig must be a JSON file
- `rootTsConfig.composite === true` — root tsconfig must enable composite for project-wide build orchestration
- `rootTsConfig.referencedPackageTsConfigs.length > 0` — root tsconfig must reference at least one package tsconfig

### UpstreamPackage
- `upstreamPackage.packageName !== null && upstreamPackage.packageName.length > 0` — upstream package must be named
- `upstreamPackage.downstreamConsumers.length > 0` — an upstream package must have at least one downstream consumer
- `upstreamPackage.artifactReady !== null` — upstream package must track whether its artifact is ready

### DownstreamPackage
- `downstreamPackage.packageName !== null && downstreamPackage.packageName.length > 0` — downstream package must be named
- `downstreamPackage.upstreamDependencies.length > 0` — a downstream package must declare at least one upstream dependency
- `downstreamPackage.allUpstreamArtifactsReady !== null` — downstream package must track readiness of its dependencies

## Workflows
### full-monorepo-build
**Trigger:** user executes 'pnpm run build' at workspace root

**resolve-workspace-packages** (enables)
- Pre: pnpm-workspace.yaml exists at rootDir and all package.json files are parseable
- Action: parse pnpm-workspace.yaml glob patterns, enumerate matching package directories, read each package.json to extract name/version/workspaceProtocolDependencies
- Post: PnpmWorkspace.packages is populated with all WorkspacePackage instances having resolved name, srcDir, distDir, and workspaceProtocolDependencies
- Failure (precondition): pnpm-workspace.yaml is missing or malformed YAML → abort build with parse error, report offending line
- Failure (action): a package directory matched by glob has no package.json → skip package with warning, continue enumeration
- Failure (postcondition): zero packages resolved despite valid workspace file → abort build, report glob patterns matched nothing

**compute-topological-build-order** (requires)
- Pre: PnpmWorkspace.packages is fully populated; all workspaceProtocolDependencies reference packages present in the workspace
- Action: build directed acyclic graph from WorkspaceProtocolDependency edges, run Kahn's algorithm to produce TopologicalBuildOrder.orderedPackages, detect cycles
- Post: TopologicalBuildOrder.orderedPackages is a valid total ordering where every provider package precedes all consumer packages; TopologicalBuildOrder.cycleDetected is false
- Failure (precondition): a workspaceProtocolDependency references a package name not present in PnpmWorkspace.packages → abort with unresolved dependency error listing the missing package name
- Failure (action): cycle detected among workspace packages (e.g. orchestrator -> compiler -> orchestrator) → set TopologicalBuildOrder.cycleDetected true, abort build, emit cycle path
- Failure (postcondition): ordered list omits one or more packages that should have been included → abort build, log discrepancy between workspace package count and ordered list length

**validate-tsconfig-project-references** (guards)
- Pre: each WorkspacePackage has a tsconfig.json with composite:true; TopologicalBuildOrder is available
- Action: for each TsConfig, parse projectReferences array and verify each referencedTsConfigPath resolves to a TsConfig whose ownerPackage appears before the current package in TopologicalBuildOrder.orderedPackages
- Post: every ProjectReference edge is consistent with TopologicalBuildOrder; all referenced tsconfig.json files have composite:true and declarationEmit:true
- Failure (precondition): a package tsconfig.json is missing composite:true → emit configuration error for that package, abort build
- Failure (action): a projectReference path does not resolve to an existing tsconfig.json on disk → abort build with missing reference path error
- Failure (postcondition): a ProjectReference edge contradicts TopologicalBuildOrder (referenced package appears later in order) → abort build, report the offending package pair and suggest tsconfig fix

**execute-incremental-tsc-build** (requires)
- Pre: TopologicalBuildOrder is valid; all TsConfig files have composite:true; prior BuildArtifacts may or may not exist (incremental case); CleanBuildState is not active
- Action: invoke 'tsc --build' at workspace root, which compiles packages in dependency order using project references, writes .js and .d.ts files to each distDir, updates each .tsbuildinfo file
- Post: for every WorkspacePackage: distDir contains emitted .js files and .d.ts files; TsBuildInfo.lastModified is updated; BuildArtifact.emittedAt is set to current timestamp
- Failure (precondition): CleanBuildState is active (clean is still in progress) when tsc is invoked → wait for clean to complete or abort with concurrency error
- Failure (action): TypeScript compiler reports type errors in one or more packages → abort build, surface tsc diagnostics with file/line/column, do not emit partial artifacts for erroring packages
- Failure (action): tsc process exits non-zero due to out-of-memory or OS signal → capture exit code and stderr, abort build, suggest increasing Node.js heap
- Failure (postcondition): distDir for a package is empty or missing expected .js entry point after tsc exits zero → abort with artifact validation error, suspect tsconfig outDir misconfiguration

**validate-bin-entries** (enables)
- Pre: BuildArtifact exists for the cli package with non-empty jsFiles; package.json bin field is declared
- Action: for each BinEntry in the cli WorkspacePackage, resolve the declared entry point path relative to distDir, check file existence and executable permission bit
- Post: every BinEntry.resolvedEntryPoint exists on disk as an emitted .js file; file has executable permission or shebang is present
- Failure (precondition): cli package BuildArtifact was not produced (compile step failed silently for cli) → abort with missing artifact error, do not validate stale prior build
- Failure (action): resolvedEntryPoint path does not exist in distDir → emit error listing expected path, suggest checking tsconfig outDir and bin field alignment
- Failure (postcondition): entry point file exists but lacks executable permission on POSIX systems → chmod +x the file and emit a warning that build script should set this

### clean-and-rebuild
**Trigger:** user executes 'pnpm run build:clean' or passes --clean flag

**initiate-clean-build-state** (enables)
- Pre: no tsc process is currently running against the workspace; PnpmWorkspace.packages is populated
- Action: set CleanBuildState.initiatedAt to current timestamp; CleanBuildState.distDirsRemoved and tsBuildInfoFilesRemoved set to false
- Post: CleanBuildState is active and timestamped; subsequent steps treat workspace as dirty
- Failure (precondition): a tsc --watch or tsc --build process is detected as running against the workspace → abort clean, emit error asking user to stop watch processes first
- Failure (action): CleanBuildState cannot be persisted due to filesystem error → abort clean with IO error

**remove-dist-directories** (enables)
- Pre: CleanBuildState is active; each WorkspacePackage.distDir path is known
- Action: for each WorkspacePackage in any order, delete distDir recursively if it exists; record removal in CleanBuildState.distDirsRemoved
- Post: no distDir exists on disk for any WorkspacePackage; CleanBuildState.distDirsRemoved is true
- Failure (precondition): CleanBuildState is not active (clean was not initiated) → abort step, require initiate-clean-build-state to run first
- Failure (action): distDir deletion fails due to permission denied or locked file (Windows) → emit warning for that package, continue removing other distDirs, mark that package as partially cleaned
- Failure (postcondition): one or more distDirs still exist after deletion attempts → abort rebuild, report which packages failed to clean, suggest manual removal

**remove-tsbuildinfo-files** (enables)
- Pre: CleanBuildState.distDirsRemoved is true; TsBuildInfo.filePath is known for each package
- Action: for each TsBuildInfo, delete the .tsbuildinfo file if it exists; set CleanBuildState.tsBuildInfoFilesRemoved to true
- Post: no .tsbuildinfo file exists for any WorkspacePackage; tsc will treat next build as cold start
- Failure (precondition): distDirs were not removed before tsbuildinfo removal (ordering violated) → abort, enforce that dist removal precedes tsbuildinfo removal to avoid stale incremental cache
- Failure (action): .tsbuildinfo file is locked by another process → emit warning, retry once after 500ms, then skip and warn that incremental cache may be stale
- Failure (postcondition): a .tsbuildinfo file was not found at expected path (package may not have been built before) → treat as success, file absence is acceptable on first build

**invoke-full-monorepo-build** (requires)
- Pre: CleanBuildState.distDirsRemoved is true; CleanBuildState.tsBuildInfoFilesRemoved is true; workspace packages and topological order are still valid from prior resolution
- Action: execute the full-monorepo-build workflow starting from compute-topological-build-order (workspace resolution reused); tsc performs a cold compilation across all packages
- Post: all BuildArtifacts are freshly emitted with emittedAt after CleanBuildState.initiatedAt; CleanBuildState is cleared
- Failure (precondition): workspace package list is stale (package was added after resolve-workspace-packages ran) → re-run resolve-workspace-packages before invoking build
- Failure (action): tsc cold build fails with type errors exposed only when incremental cache is absent → surface all diagnostics, abort build, do not restore deleted artifacts
- Failure (postcondition): BuildArtifact.emittedAt is before CleanBuildState.initiatedAt indicating stale artifacts were not overwritten → abort with artifact freshness error, suspect filesystem clock skew or tsc short-circuit bug

## State Machines
### WorkspacePackage
**States:** unresolved → resolved → queued → compiling → compiled → failed
- unresolved → resolved (trigger: package.json parsed and workspaceProtocolDependencies extracted, guard: package.json exists and is valid JSON with a name field)
- resolved → queued (trigger: topological order computed and package added to build queue, guard: all WorkspaceProtocolDependency providers are in 'compiled' state or package has no providers)
- queued → compiling (trigger: tsc begins processing this package as part of --build project graph, guard: all upstream ProjectReference targets have emitted BuildArtifacts)
- compiling → compiled (trigger: tsc emits .js and .d.ts files to distDir and updates .tsbuildinfo, guard: zero type errors for this package; distDir non-empty)
- compiling → failed (trigger: tsc reports type errors or IO failure for this package, guard: error count > 0 or tsc exits non-zero)
- compiled → unresolved (trigger: clean-build-state initiated and distDir removed, guard: CleanBuildState is active)
- failed → queued (trigger: user fixes source and re-triggers build without full clean, guard: upstream dependencies are still in 'compiled' state)

### BuildArtifact
**States:** absent → stale → fresh → invalidated
- absent → fresh (trigger: tsc emits files to distDir for the first time, guard: ownerPackage transitioned to 'compiled'; distDir contains at least one .js file)
- fresh → stale (trigger: source file in srcDir is modified after emittedAt, guard: TsBuildInfo.lastModified < mtime of any source file in srcDir)
- stale → fresh (trigger: incremental tsc build recompiles and re-emits updated artifacts, guard: tsc detects staleness via .tsbuildinfo and successfully recompiles)
- fresh → invalidated (trigger: clean-build-state removes distDir, guard: CleanBuildState.distDirsRemoved transitions to true)
- stale → invalidated (trigger: clean-build-state removes distDir, guard: CleanBuildState.distDirsRemoved transitions to true)
- invalidated → absent (trigger: filesystem confirms distDir no longer exists, guard: stat(distDir) returns ENOENT)
- absent → stale (trigger: partial prior build left some files but .tsbuildinfo is missing, guard: distDir exists but tsBuildInfoPath does not exist)

### TsBuildInfo
**States:** nonexistent → current → outdated → deleted
- nonexistent → current (trigger: tsc writes .tsbuildinfo after successful cold or incremental compile, guard: ownerPackage BuildArtifact transitions to 'fresh')
- current → outdated (trigger: source or dependency artifact changes after .tsbuildinfo was written, guard: mtime of any srcDir file or upstream distDir file exceeds lastModified)
- outdated → current (trigger: tsc performs incremental rebuild and rewrites .tsbuildinfo, guard: tsc exits zero and .tsbuildinfo lastModified is updated)
- current → deleted (trigger: clean-build-state removes .tsbuildinfo file, guard: CleanBuildState.tsBuildInfoFilesRemoved transitions to true)
- outdated → deleted (trigger: clean-build-state removes .tsbuildinfo file, guard: CleanBuildState.tsBuildInfoFilesRemoved transitions to true)
- deleted → nonexistent (trigger: filesystem confirms file is gone, guard: stat(filePath) returns ENOENT)
- nonexistent → current (trigger: tsc cold build completes and writes fresh .tsbuildinfo, guard: ownerPackage was in 'absent' BuildArtifact state before build)

### CleanBuildState
**States:** inactive → initiated → dirs-removed → cache-removed → complete
- inactive → initiated (trigger: user triggers clean-and-rebuild workflow, guard: no tsc process running; PnpmWorkspace.packages is populated)
- initiated → dirs-removed (trigger: all distDirs deleted from disk, guard: distDirsRemoved is true for all WorkspacePackages)
- dirs-removed → cache-removed (trigger: all .tsbuildinfo files deleted from disk, guard: tsBuildInfoFilesRemoved is true)
- cache-removed → complete (trigger: full-monorepo-build workflow completes successfully, guard: all WorkspacePackage BuildArtifacts are in 'fresh' state with emittedAt after initiatedAt)
- initiated → inactive (trigger: clean aborted due to locked files or permission errors, guard: any distDir removal fails terminally)
- complete → inactive (trigger: build session ends; state is cleared from memory, guard: always)

### TopologicalBuildOrder
**States:** uncomputed → computing → valid → cycle-detected → stale
- uncomputed → computing (trigger: compute-topological-build-order step begins, guard: PnpmWorkspace.packages is non-empty)
- computing → valid (trigger: Kahn's algorithm completes with all packages ordered and no cycle, guard: orderedPackages.length equals PnpmWorkspace.packages.length and cycleDetected is false)
- computing → cycle-detected (trigger: Kahn's algorithm terminates with unprocessed nodes remaining, guard: cycleDetected is true)
- valid → stale (trigger: a WorkspacePackage is added or removed from PnpmWorkspace after order was computed, guard: PnpmWorkspace.packages count differs from orderedPackages.length)
- stale → computing (trigger: recompute triggered before next build step, guard: PnpmWorkspace.packages re-resolved)
- cycle-detected → uncomputed (trigger: user fixes package.json dependencies to break the cycle, guard: always; requires manual intervention)

## Build Order
1. WorkspaceResolver (WorkspaceStructure)
2. DependencyGraphResolver (TypeScriptProjectGraph)
3. TsConfigValidator (TypeScriptProjectGraph)
4. BuildExecutor (BuildOrchestration)
5. ArtifactValidator (ArtifactEmission)
6. CleanStateManager (ArtifactEmission)

## Done
- [ ] Node.js >= 18 required per engines field (C1)
- [ ] pnpm workspace protocol must be used for all inter-package references — no npm or yarn (C2)
- [ ] TypeScript strict compilation — source is .ts, emitted artifacts are .js + .d.ts (C3)
- [ ] Build must be idempotent: running build twice with no source changes must produce identical dist/ output
- [ ] Incremental builds must leverage .tsbuildinfo files to skip unchanged packages (TsBuildInfo entity state: current → current, no recompilation)
- [ ] Topological ordering must be cycle-free — cycle detection must fail the build before any compilation begins (TopologicalBuildOrder invariant: cycleDetected === false)
- [ ] All 8 workspace packages must emit artifacts: compiler, config-writer, governor, int-rerun, mcp-server, orchestrator, provenance, cli
- [ ] Build failure in any package must halt downstream dependents but not unrelated packages in the same topological tier
- [ ] Clean build must remove all prior dist/ and .tsbuildinfo before compiling — no stale artifact contamination
- [ ] PnpmWorkspace.packages is populated with all WorkspacePackage instances having resolved name, srcDir, distDir, and workspaceProtocolDependencies
- [ ] TopologicalBuildOrder.orderedPackages is a valid total ordering where every provider package precedes all consumer packages; TopologicalBuildOrder.cycleDetected is false
- [ ] every ProjectReference edge is consistent with TopologicalBuildOrder; all referenced tsconfig.json files have composite:true and declarationEmit:true
- [ ] for every WorkspacePackage: distDir contains emitted .js files and .d.ts files; TsBuildInfo.lastModified is updated; BuildArtifact.emittedAt is set to current timestamp
- [ ] every BinEntry.resolvedEntryPoint exists on disk as an emitted .js file; file has executable permission or shebang is present
- [ ] CleanBuildState is active and timestamped; subsequent steps treat workspace as dirty
- [ ] no distDir exists on disk for any WorkspacePackage; CleanBuildState.distDirsRemoved is true
- [ ] no .tsbuildinfo file exists for any WorkspacePackage; tsc will treat next build as cold start
- [ ] all BuildArtifacts are freshly emitted with emittedAt after CleanBuildState.initiatedAt; CleanBuildState is cleared

## This Session
You are the lead agent. Follow this protocol:
1. Read this file fully
2. Read all agent files in `.claude/agents/`
3. Delegate to specialist agents by bounded context, in build order
4. After each agent completes, verify its postconditions
5. Do not proceed to the next step until postconditions are met
