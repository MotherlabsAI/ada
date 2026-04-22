---
ada_postcode: "ML.SKL.execute-composite-typescript-build/v1"
ada_type: skill
ada_name: execute-composite-typescript-build
ada_compiled_at: 1776882827970
---
---
name: execute-composite-typescript-build
description: "Use when BuildOrder.hasCycle is false and BuildOrder.orderedPackages is settled pattern detected."
---

# execute-composite-typescript-build

Trigger: BuildOrder.hasCycle is false and BuildOrder.orderedPackages is settled

## Steps
1. **validate-tsconfig-composite-contracts**
   - Pre: `BuildOrder.orderedPackages is settled; each WorkspacePackage.tsConfigPath points to a readable file`
   - Action: `for each WorkspacePackage in BuildOrder.orderedPackages, parse tsconfig.json; assert composite is true, declaration is true, declarationMap is true, incremental is true, outDir is set to distDir, rootDir is set to srcDir; for each entry in WorkspacePackage.internalDependencies, assert a matching ProjectReference exists in TsConfig.projectReferences pointing to the dependency's tsConfigPath`
   - Post: `every WorkspacePackage.isComposite is true; every required ProjectReference exists and its referencedTsConfigPath resolves to a valid file; no TsConfig.projectReferences references a path outside the workspace`

2. **clean-stale-artifacts**
   - Pre: `CompositeBuild.forceClean is true OR TsBuildInfo state is stale OR TsBuildInfo state is corrupt; WorkspacePackage.distDir paths are known`
   - Action: `for each WorkspacePackage in BuildOrder.orderedPackages, delete distDir contents recursively; delete TsBuildInfo.filePath if it exists; reset DistArtifact to absent state`
   - Post: `no .js, .d.ts, or .tsbuildinfo files exist under any WorkspacePackage.distDir; DistArtifact state is absent for all packages`

3. **invoke-tsc-composite-build**
   - Pre: `all TsConfig composite contracts are valid; stale artifacts are cleaned if forceClean; CompositeBuild.rootTsConfigPath exists and references all WorkspacePackage tsConfigs in dependency order`
   - Action: `invoke tsc -b <rootTsConfigPath> --verbose; tsc internally walks ProjectReferences in dependency order; for each WorkspacePackage, transpiles srcDir TypeScript to distDir JavaScript, emits .d.ts declaration files, writes .tsbuildinfo; report per-package compile start and end events`
   - Post: `tsc process exits with code 0; for each WorkspacePackage, DistArtifact.jsFiles is non-empty, DistArtifact.declarationFiles is non-empty, TsBuildInfo.filePath exists with updated lastBuildTimestamp; DistArtifact state is complete for all packages`

4. **verify-primary-entrypoints**
   - Pre: `invoke-tsc-composite-build completed with exit code 0; DistArtifact state is complete for all packages`
   - Action: `for each Entrypoint entity (mcp-server kind and cli kind), resolve Entrypoint.compiledJsPath; assert file exists on disk; assert file size is non-zero; assert Entrypoint.mainFieldValue in owning package.json resolves to the same compiledJsPath; for cli kind, assert Entrypoint.executableBit is set`
   - Post: `all Entrypoint.compiledJsPath files exist and are non-empty; Entrypoint.mainFieldValue correctly points to compiled output; cli entrypoint has executable bit set; Entrypoint state is verified for mcp-server and cli packages`
