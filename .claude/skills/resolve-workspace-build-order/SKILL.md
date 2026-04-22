---
ada_postcode: "ML.SKL.resolve-workspace-build-order/v1"
ada_type: skill
ada_name: resolve-workspace-build-order
ada_compiled_at: 1776882827970
---
---
name: resolve-workspace-build-order
description: "Use when build command invoked at WorkspaceRoot; pnpm-workspace.yaml is present pattern detected."
---

# resolve-workspace-build-order

Trigger: build command invoked at WorkspaceRoot; pnpm-workspace.yaml is present

## Steps
1. **discover-workspace-packages**
   - Pre: `WorkspaceRoot.pnpmWorkspaceFile exists and is readable; WorkspaceRoot.rootPath is a valid directory`
   - Action: `parse pnpm-workspace.yaml glob patterns; expand globs against filesystem; read each matched package.json to instantiate WorkspacePackage entities with name, packageJsonPath, tsConfigPath, srcDir, distDir`
   - Post: `WorkspaceRoot.packageNames is populated; a WorkspacePackage entity exists for every matched directory containing a valid package.json; each WorkspacePackage.name matches its package.json name field`

2. **extract-internal-dependency-edges**
   - Pre: `all WorkspacePackage entities exist with valid packageJsonPath; WorkspaceRoot.packageNames is non-empty`
   - Action: `for each WorkspacePackage, read dependencies and devDependencies from package.json; for each dependency name that matches a name in WorkspaceRoot.packageNames, create a PackageDependencyEdge with fromPackage, toPackage, protocol (workspace:), and versionSpec; populate WorkspacePackage.internalDependencies`
   - Post: `PackageDependencyEdge set is complete; every edge references two valid WorkspacePackage entities; WorkspacePackage.internalDependencies lists resolved package references`

3. **compute-topological-build-order**
   - Pre: `PackageDependencyEdge set is complete and all edges reference valid WorkspacePackage entities`
   - Action: `run Kahn's algorithm over PackageDependencyEdge set; detect cycles; produce ordered list of WorkspacePackage names from leaves (no deps) to dependents; populate BuildOrder.orderedPackages, BuildOrder.edgeCount, BuildOrder.hasCycle`
   - Post: `BuildOrder.hasCycle is false; BuildOrder.orderedPackages contains all WorkspacePackage names exactly once; for every PackageDependencyEdge (A→B), B appears before A in BuildOrder.orderedPackages`
