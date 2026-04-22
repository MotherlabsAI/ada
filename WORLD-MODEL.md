---
ada_postcode: "ML.L4A.CFG.GLO.HOW.SFT.68d21719/v1"
ada_type: world-model
ada_blueprint: "ML.L2I.REL.GLO.WHT.SFT.c427a515/v1"
ada_nodes: 10
ada_compiled_at: 1776882827971
---

# World Model

This is the navigable graph of all compiled artifacts. Every node has a postcode. Every edge is a typed relationship. Load any node and traverse to its neighbors.

## Nodes (10)

### A TypeScript monorepo build system that discovers Ada worksp
- **Type:** blueprint
- **Postcode:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`
- **Path:** `CLAUDE.md`
- **Implements:** WorkspacePackageScanner, validateDependencyGraph, topoOrder, topoWaves, deriveBuildContract, CompositeBuildExecutor, verify

### WorkspacePackageScanner
- **Type:** agent
- **Postcode:** `ML.AGT.workspacepackagescanner/v1`
- **Path:** `AGENTS/workspacepackagescanner.md`
- **Bounded context:** Workspace
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.validatedependencygraph/v1`, `ML.AGT.topoorder/v1`, `ML.AGT.topowaves/v1`, `ML.AGT.derivebuildcontract/v1`

### validateDependencyGraph
- **Type:** agent
- **Postcode:** `ML.AGT.validatedependencygraph/v1`
- **Path:** `AGENTS/validatedependencygraph.md`
- **Bounded context:** Workspace
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.workspacepackagescanner/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.topoorder/v1`, `ML.AGT.topowaves/v1`

### topoOrder
- **Type:** agent
- **Postcode:** `ML.AGT.topoorder/v1`
- **Path:** `AGENTS/topoorder.md`
- **Bounded context:** Workspace
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.workspacepackagescanner/v1`, `ML.AGT.validatedependencygraph/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.compositebuildexecutor/v1`

### topoWaves
- **Type:** agent
- **Postcode:** `ML.AGT.topowaves/v1`
- **Path:** `AGENTS/topowaves.md`
- **Bounded context:** Workspace
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.workspacepackagescanner/v1`, `ML.AGT.validatedependencygraph/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`

### deriveBuildContract
- **Type:** agent
- **Postcode:** `ML.AGT.derivebuildcontract/v1`
- **Path:** `AGENTS/derivebuildcontract.md`
- **Bounded context:** CompilationConfiguration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.workspacepackagescanner/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.compositebuildexecutor/v1`

### CompositeBuildExecutor
- **Type:** agent
- **Postcode:** `ML.AGT.compositebuildexecutor/v1`
- **Path:** `AGENTS/compositebuildexecutor.md`
- **Bounded context:** CompilationConfiguration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.derivebuildcontract/v1`, `ML.AGT.topoorder/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.verify/v1`

### verify
- **Type:** agent
- **Postcode:** `ML.AGT.verify/v1`
- **Path:** `AGENTS/verify.md`
- **Bounded context:** Artifact
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`, `ML.AGT.compositebuildexecutor/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`

### resolve-workspace-build-order
- **Type:** skill
- **Postcode:** `ML.SKL.resolve-workspace-build-order/v1`
- **Path:** `SKILLS/resolve-workspace-build-order.md`
- **Implements:** resolve-workspace-build-order
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`

### execute-composite-typescript-build
- **Type:** skill
- **Postcode:** `ML.SKL.execute-composite-typescript-build/v1`
- **Path:** `SKILLS/execute-composite-typescript-build.md`
- **Implements:** execute-composite-typescript-build
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1`

## Edge List

- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.workspacepackagescanner/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.validatedependencygraph/v1` *(produces)*
- `ML.AGT.validatedependencygraph/v1` → `ML.AGT.workspacepackagescanner/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.topoorder/v1` *(produces)*
- `ML.AGT.topoorder/v1` → `ML.AGT.workspacepackagescanner/v1` *(depends_on)*
- `ML.AGT.topoorder/v1` → `ML.AGT.validatedependencygraph/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.topowaves/v1` *(produces)*
- `ML.AGT.topowaves/v1` → `ML.AGT.workspacepackagescanner/v1` *(depends_on)*
- `ML.AGT.topowaves/v1` → `ML.AGT.validatedependencygraph/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.derivebuildcontract/v1` *(produces)*
- `ML.AGT.derivebuildcontract/v1` → `ML.AGT.workspacepackagescanner/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.compositebuildexecutor/v1` *(produces)*
- `ML.AGT.compositebuildexecutor/v1` → `ML.AGT.derivebuildcontract/v1` *(depends_on)*
- `ML.AGT.compositebuildexecutor/v1` → `ML.AGT.topoorder/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.AGT.verify/v1` *(produces)*
- `ML.AGT.verify/v1` → `ML.AGT.compositebuildexecutor/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.SKL.resolve-workspace-build-order/v1` *(defines)*
- `ML.L2I.REL.GLO.WHT.SFT.c427a515/v1` → `ML.SKL.execute-composite-typescript-build/v1` *(defines)*