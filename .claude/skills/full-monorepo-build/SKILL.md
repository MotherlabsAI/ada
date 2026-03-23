---
name: full-monorepo-build
description: "Use when user executes 'pnpm run build' at workspace root pattern detected."
---

# full-monorepo-build

Trigger: user executes 'pnpm run build' at workspace root

## Steps
1. **resolve-workspace-packages**
   - Pre: `pnpm-workspace.yaml exists at rootDir and all package.json files are parseable`
   - Action: `parse pnpm-workspace.yaml glob patterns, enumerate matching package directories, read each package.json to extract name/version/workspaceProtocolDependencies`
   - Post: `PnpmWorkspace.packages is populated with all WorkspacePackage instances having resolved name, srcDir, distDir, and workspaceProtocolDependencies`

2. **compute-topological-build-order**
   - Pre: `PnpmWorkspace.packages is fully populated; all workspaceProtocolDependencies reference packages present in the workspace`
   - Action: `build directed acyclic graph from WorkspaceProtocolDependency edges, run Kahn's algorithm to produce TopologicalBuildOrder.orderedPackages, detect cycles`
   - Post: `TopologicalBuildOrder.orderedPackages is a valid total ordering where every provider package precedes all consumer packages; TopologicalBuildOrder.cycleDetected is false`

3. **validate-tsconfig-project-references**
   - Pre: `each WorkspacePackage has a tsconfig.json with composite:true; TopologicalBuildOrder is available`
   - Action: `for each TsConfig, parse projectReferences array and verify each referencedTsConfigPath resolves to a TsConfig whose ownerPackage appears before the current package in TopologicalBuildOrder.orderedPackages`
   - Post: `every ProjectReference edge is consistent with TopologicalBuildOrder; all referenced tsconfig.json files have composite:true and declarationEmit:true`

4. **execute-incremental-tsc-build**
   - Pre: `TopologicalBuildOrder is valid; all TsConfig files have composite:true; prior BuildArtifacts may or may not exist (incremental case); CleanBuildState is not active`
   - Action: `invoke 'tsc --build' at workspace root, which compiles packages in dependency order using project references, writes .js and .d.ts files to each distDir, updates each .tsbuildinfo file`
   - Post: `for every WorkspacePackage: distDir contains emitted .js files and .d.ts files; TsBuildInfo.lastModified is updated; BuildArtifact.emittedAt is set to current timestamp`

5. **validate-bin-entries**
   - Pre: `BuildArtifact exists for the cli package with non-empty jsFiles; package.json bin field is declared`
   - Action: `for each BinEntry in the cli WorkspacePackage, resolve the declared entry point path relative to distDir, check file existence and executable permission bit`
   - Post: `every BinEntry.resolvedEntryPoint exists on disk as an emitted .js file; file has executable permission or shebang is present`
