---
name: clean-and-rebuild
description: "Use when user executes 'pnpm run build:clean' or passes --clean flag pattern detected."
---

# clean-and-rebuild

Trigger: user executes 'pnpm run build:clean' or passes --clean flag

## Steps
1. **initiate-clean-build-state**
   - Pre: `no tsc process is currently running against the workspace; PnpmWorkspace.packages is populated`
   - Action: `set CleanBuildState.initiatedAt to current timestamp; CleanBuildState.distDirsRemoved and tsBuildInfoFilesRemoved set to false`
   - Post: `CleanBuildState is active and timestamped; subsequent steps treat workspace as dirty`

2. **remove-dist-directories**
   - Pre: `CleanBuildState is active; each WorkspacePackage.distDir path is known`
   - Action: `for each WorkspacePackage in any order, delete distDir recursively if it exists; record removal in CleanBuildState.distDirsRemoved`
   - Post: `no distDir exists on disk for any WorkspacePackage; CleanBuildState.distDirsRemoved is true`

3. **remove-tsbuildinfo-files**
   - Pre: `CleanBuildState.distDirsRemoved is true; TsBuildInfo.filePath is known for each package`
   - Action: `for each TsBuildInfo, delete the .tsbuildinfo file if it exists; set CleanBuildState.tsBuildInfoFilesRemoved to true`
   - Post: `no .tsbuildinfo file exists for any WorkspacePackage; tsc will treat next build as cold start`

4. **invoke-full-monorepo-build**
   - Pre: `CleanBuildState.distDirsRemoved is true; CleanBuildState.tsBuildInfoFilesRemoved is true; workspace packages and topological order are still valid from prior resolution`
   - Action: `execute the full-monorepo-build workflow starting from compute-topological-build-order (workspace resolution reused); tsc performs a cold compilation across all packages`
   - Post: `all BuildArtifacts are freshly emitted with emittedAt after CleanBuildState.initiatedAt; CleanBuildState is cleared`
