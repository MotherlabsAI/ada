---
name: WorkspaceStructure-agent
description: Use when discovers and resolves all workspace packages from the pnpm workspace configuration, enumerating each package's name, source directory, dist directory, workspace:* protocol dependencies, and bin entries. hydrates the pnpmworkspace and workspacepackage entities and transitions workspacepackage from 'unresolved' to 'resolved'. tasks arise in the WorkspaceStructure domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# WorkspaceResolver Agent

Discovers and resolves all workspace packages from the pnpm workspace configuration, enumerating each package's name, source directory, dist directory, workspace:* protocol dependencies, and bin entries. Hydrates the PnpmWorkspace and WorkspacePackage entities and transitions WorkspacePackage from 'unresolved' to 'resolved'.

## Bounded Context
**Context:** WorkspaceStructure
**Entities:** PnpmWorkspace, WorkspacePackage, WorkspaceProtocolDependency, BinEntry
**Interfaces:** resolveWorkspace(rootDir: string): PnpmWorkspace, listPackages(workspace: PnpmWorkspace): WorkspacePackage[], resolveWorkspaceProtocolDeps(pkg: WorkspacePackage): WorkspaceProtocolDependency[], resolveBinEntries(pkg: WorkspacePackage): BinEntry[]

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `pnpmWorkspace.packages.every(p => p.name !== null)` — every package in the workspace must be named
- `pnpmWorkspace.packages.map(p => p.name).length === new Set(pnpmWorkspace.packages.map(p => p.name)).size` — package names within the workspace must be unique
- `workspacePackage.name !== null && workspacePackage.name.length > 0` (WorkspacePackage) — package must have a non-empty name
- `workspacePackage.distDir !== null && workspacePackage.distDir.length > 0` (WorkspacePackage) — package must declare a dist output directory
- `workspacePackage.srcDir !== null` (WorkspacePackage) — package must declare a source directory
- `workspacePackage.workspaceProtocolDependencies !== null` (WorkspacePackage) — workspace dependencies array must be defined (may be empty)
- `pnpmWorkspace.packages.length > 0` (PnpmWorkspace) — workspace must contain at least one package
- `pnpmWorkspace.rootDir !== null && pnpmWorkspace.rootDir.length > 0` (PnpmWorkspace) — workspace must have a root directory
- `pnpmWorkspace.workspaceYamlPath !== null` (PnpmWorkspace) — workspace must have a pnpm-workspace.yaml path
- `workspaceProtocolDependency.specifier.startsWith('workspace:')` (WorkspaceProtocolDependency) — specifier must use the pnpm workspace protocol prefix
- `workspaceProtocolDependency.consumerPackage !== workspaceProtocolDependency.providerPackage` (WorkspaceProtocolDependency) — a package cannot declare itself as a workspace dependency
- `binEntry.commandName !== null && binEntry.commandName.length > 0` (BinEntry) — bin entry must declare a non-empty command name
- `binEntry.resolvedEntryPoint !== null && binEntry.resolvedEntryPoint.length > 0` (BinEntry) — bin entry must point to a compiled entrypoint
- `binEntry.ownerPackage !== null` (BinEntry) — bin entry must be owned by a package

## Workflow Steps
### resolve-workspace-packages (full-monorepo-build)
- **Pre:** pnpm-workspace.yaml exists at rootDir and all package.json files are parseable
- **Action:** parse pnpm-workspace.yaml glob patterns, enumerate matching package directories, read each package.json to extract name/version/workspaceProtocolDependencies
- **Post:** PnpmWorkspace.packages is populated with all WorkspacePackage instances having resolved name, srcDir, distDir, and workspaceProtocolDependencies
- **Failure modes:**
  - precondition: pnpm-workspace.yaml is missing or malformed YAML → abort build with parse error, report offending line
  - action: a package directory matched by glob has no package.json → skip package with warning, continue enumeration
  - postcondition: zero packages resolved despite valid workspace file → abort build, report glob patterns matched nothing

### compute-topological-build-order (full-monorepo-build)
- **Pre:** PnpmWorkspace.packages is fully populated; all workspaceProtocolDependencies reference packages present in the workspace
- **Action:** build directed acyclic graph from WorkspaceProtocolDependency edges, run Kahn's algorithm to produce TopologicalBuildOrder.orderedPackages, detect cycles
- **Post:** TopologicalBuildOrder.orderedPackages is a valid total ordering where every provider package precedes all consumer packages; TopologicalBuildOrder.cycleDetected is false
- **Failure modes:**
  - precondition: a workspaceProtocolDependency references a package name not present in PnpmWorkspace.packages → abort with unresolved dependency error listing the missing package name
  - action: cycle detected among workspace packages (e.g. orchestrator -> compiler -> orchestrator) → set TopologicalBuildOrder.cycleDetected true, abort build, emit cycle path
  - postcondition: ordered list omits one or more packages that should have been included → abort build, log discrepancy between workspace package count and ordered list length

### validate-tsconfig-project-references (full-monorepo-build)
- **Pre:** each WorkspacePackage has a tsconfig.json with composite:true; TopologicalBuildOrder is available
- **Action:** for each TsConfig, parse projectReferences array and verify each referencedTsConfigPath resolves to a TsConfig whose ownerPackage appears before the current package in TopologicalBuildOrder.orderedPackages
- **Post:** every ProjectReference edge is consistent with TopologicalBuildOrder; all referenced tsconfig.json files have composite:true and declarationEmit:true
- **Failure modes:**
  - precondition: a package tsconfig.json is missing composite:true → emit configuration error for that package, abort build
  - action: a projectReference path does not resolve to an existing tsconfig.json on disk → abort build with missing reference path error
  - postcondition: a ProjectReference edge contradicts TopologicalBuildOrder (referenced package appears later in order) → abort build, report the offending package pair and suggest tsconfig fix

### execute-incremental-tsc-build (full-monorepo-build)
- **Pre:** TopologicalBuildOrder is valid; all TsConfig files have composite:true; prior BuildArtifacts may or may not exist (incremental case); CleanBuildState is not active
- **Action:** invoke 'tsc --build' at workspace root, which compiles packages in dependency order using project references, writes .js and .d.ts files to each distDir, updates each .tsbuildinfo file
- **Post:** for every WorkspacePackage: distDir contains emitted .js files and .d.ts files; TsBuildInfo.lastModified is updated; BuildArtifact.emittedAt is set to current timestamp
- **Failure modes:**
  - precondition: CleanBuildState is active (clean is still in progress) when tsc is invoked → wait for clean to complete or abort with concurrency error
  - action: TypeScript compiler reports type errors in one or more packages → abort build, surface tsc diagnostics with file/line/column, do not emit partial artifacts for erroring packages
  - action: tsc process exits non-zero due to out-of-memory or OS signal → capture exit code and stderr, abort build, suggest increasing Node.js heap
  - postcondition: distDir for a package is empty or missing expected .js entry point after tsc exits zero → abort with artifact validation error, suspect tsconfig outDir misconfiguration

### validate-bin-entries (full-monorepo-build)
- **Pre:** BuildArtifact exists for the cli package with non-empty jsFiles; package.json bin field is declared
- **Action:** for each BinEntry in the cli WorkspacePackage, resolve the declared entry point path relative to distDir, check file existence and executable permission bit
- **Post:** every BinEntry.resolvedEntryPoint exists on disk as an emitted .js file; file has executable permission or shebang is present
- **Failure modes:**
  - precondition: cli package BuildArtifact was not produced (compile step failed silently for cli) → abort with missing artifact error, do not validate stale prior build
  - action: resolvedEntryPoint path does not exist in distDir → emit error listing expected path, suggest checking tsconfig outDir and bin field alignment
  - postcondition: entry point file exists but lacks executable permission on POSIX systems → chmod +x the file and emit a warning that build script should set this

### initiate-clean-build-state (clean-and-rebuild)
- **Pre:** no tsc process is currently running against the workspace; PnpmWorkspace.packages is populated
- **Action:** set CleanBuildState.initiatedAt to current timestamp; CleanBuildState.distDirsRemoved and tsBuildInfoFilesRemoved set to false
- **Post:** CleanBuildState is active and timestamped; subsequent steps treat workspace as dirty
- **Failure modes:**
  - precondition: a tsc --watch or tsc --build process is detected as running against the workspace → abort clean, emit error asking user to stop watch processes first
  - action: CleanBuildState cannot be persisted due to filesystem error → abort clean with IO error

### remove-dist-directories (clean-and-rebuild)
- **Pre:** CleanBuildState is active; each WorkspacePackage.distDir path is known
- **Action:** for each WorkspacePackage in any order, delete distDir recursively if it exists; record removal in CleanBuildState.distDirsRemoved
- **Post:** no distDir exists on disk for any WorkspacePackage; CleanBuildState.distDirsRemoved is true
- **Failure modes:**
  - precondition: CleanBuildState is not active (clean was not initiated) → abort step, require initiate-clean-build-state to run first
  - action: distDir deletion fails due to permission denied or locked file (Windows) → emit warning for that package, continue removing other distDirs, mark that package as partially cleaned
  - postcondition: one or more distDirs still exist after deletion attempts → abort rebuild, report which packages failed to clean, suggest manual removal

### remove-tsbuildinfo-files (clean-and-rebuild)
- **Pre:** CleanBuildState.distDirsRemoved is true; TsBuildInfo.filePath is known for each package
- **Action:** for each TsBuildInfo, delete the .tsbuildinfo file if it exists; set CleanBuildState.tsBuildInfoFilesRemoved to true
- **Post:** no .tsbuildinfo file exists for any WorkspacePackage; tsc will treat next build as cold start
- **Failure modes:**
  - precondition: distDirs were not removed before tsbuildinfo removal (ordering violated) → abort, enforce that dist removal precedes tsbuildinfo removal to avoid stale incremental cache
  - action: .tsbuildinfo file is locked by another process → emit warning, retry once after 500ms, then skip and warn that incremental cache may be stale
  - postcondition: a .tsbuildinfo file was not found at expected path (package may not have been built before) → treat as success, file absence is acceptable on first build

### invoke-full-monorepo-build (clean-and-rebuild)
- **Pre:** CleanBuildState.distDirsRemoved is true; CleanBuildState.tsBuildInfoFilesRemoved is true; workspace packages and topological order are still valid from prior resolution
- **Action:** execute the full-monorepo-build workflow starting from compute-topological-build-order (workspace resolution reused); tsc performs a cold compilation across all packages
- **Post:** all BuildArtifacts are freshly emitted with emittedAt after CleanBuildState.initiatedAt; CleanBuildState is cleared
- **Failure modes:**
  - precondition: workspace package list is stale (package was added after resolve-workspace-packages ran) → re-run resolve-workspace-packages before invoking build
  - action: tsc cold build fails with type errors exposed only when incremental cache is absent → surface all diagnostics, abort build, do not restore deleted artifacts
  - postcondition: BuildArtifact.emittedAt is before CleanBuildState.initiatedAt indicating stale artifacts were not overwritten → abort with artifact freshness error, suspect filesystem clock skew or tsc short-circuit bug

## Acceptance Criteria
- [ ] PnpmWorkspace.packages is populated with all WorkspacePackage instances having resolved name, srcDir, distDir, and workspaceProtocolDependencies
- [ ] TopologicalBuildOrder.orderedPackages is a valid total ordering where every provider package precedes all consumer packages; TopologicalBuildOrder.cycleDetected is false
- [ ] every ProjectReference edge is consistent with TopologicalBuildOrder; all referenced tsconfig.json files have composite:true and declarationEmit:true
- [ ] for every WorkspacePackage: distDir contains emitted .js files and .d.ts files; TsBuildInfo.lastModified is updated; BuildArtifact.emittedAt is set to current timestamp
- [ ] every BinEntry.resolvedEntryPoint exists on disk as an emitted .js file; file has executable permission or shebang is present
- [ ] CleanBuildState is active and timestamped; subsequent steps treat workspace as dirty
- [ ] no distDir exists on disk for any WorkspacePackage; CleanBuildState.distDirsRemoved is true
- [ ] no .tsbuildinfo file exists for any WorkspacePackage; tsc will treat next build as cold start
- [ ] all BuildArtifacts are freshly emitted with emittedAt after CleanBuildState.initiatedAt; CleanBuildState is cleared

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
