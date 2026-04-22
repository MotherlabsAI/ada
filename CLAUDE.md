---
ada_postcode: "ML.L2I.REL.GLO.WHT.SFT.c427a515/v1"
ada_type: blueprint
ada_name: A TypeScript monorepo build system that discovers Ada worksp
ada_edges:
  implements:
    - "WorkspacePackageScanner"
    - "validateDependencyGraph"
    - "topoOrder"
    - "topoWaves"
    - "deriveBuildContract"
    - "CompositeBuildExecutor"
    - "verify"
ada_compiled_at: 1776882827943
---
# A TypeScript monorepo build system that discovers Ada workspace packages via pnpm workspace configuration, resolves their internal dependency graph into a topological build order, executes composite TypeScript compilation respecting tsconfig project references, and verifies that all primary entrypoints (MCP server, CLI) produce valid JavaScript and declaration artifacts — compiled by Ada

> A TypeScript monorepo build system that discovers Ada workspace packages via pnpm workspace configuration, resolves their internal dependency graph into a topological build order, executes composite TypeScript compilation respecting tsconfig project references, and verifies that all primary entrypoints (MCP server, CLI) produce valid JavaScript and declaration artifacts.

## Compilation
- Decision: ACCEPT  Confidence: 88%  Compiled: 2026-04-22 18:33
- Blueprint: `.ada/state.json`  World model: `.ada/manifest.json`

## Bounded Contexts
- Workspace — root: WorkspacePackageScanner
- CompilationConfiguration — root: deriveBuildContract
- Artifact — root: verify

## Agents
- WorkspacePackageScanner `Workspace`
- validateDependencyGraph `Workspace`
- topoOrder `Workspace`
- topoWaves `Workspace`
- deriveBuildContract `CompilationConfiguration`
- CompositeBuildExecutor `CompilationConfiguration`
- verify `Artifact`

## Out of Scope
Ada explicitly excluded these. Do not build them:
- Deploying compiled artifacts to any cloud, server, or container registry
- Running the MCP server or any Ada process at runtime
- Executing tests, test compilation, or test artifact generation
- Linting, formatting, or static analysis of source files
- Bundling or minifying output for browser or edge environments
- Docker image construction or containerization of any package
- Installing or updating npm/pnpm dependencies (pnpm install is a prerequisite, not part of compile)
- Publishing packages to npm or any package registry
- Environment variable configuration or runtime secrets management
- CI/CD pipeline orchestration beyond the local build command
- Database migrations, seeding, or any data-layer initialization
- Code generation from schemas, OpenAPI, or other non-TypeScript sources

## Constraints
Ada's PreToolUse hook is active — loads `.ada/state.json` and gates every tool call.
See `hooks/pre-tool/ada-gate.sh` for enforcement logic.

Critical constraints (violation = HALT):
- `buildResult.exitCode !== 0 → buildResult.errors[0].filePath !== null`: Build must fail fast and report the first compilation error with file path and line number rather than continuing to compile downstream packages
- `process.versions.node.split('.')[0] >= 18`: Node.js >= 18 must be the active runtime, enforced via engines field in root package.json
- `tsConfig.composite === true && tsConfig.declarationEnabled === true`: All packages must use TypeScript composite mode with declaration emit to support incremental builds and cross-package type checking
- `tsBuildInfo.state !== 'absent' → compilationScope < totalFiles`: Incremental compilation must be the default mode — only changed files and their dependents are recompiled using .tsbuildinfo cache
- `buildOrder.hasCycle === false`: Build order must be cycle-free — a detected cycle must abort the build with a diagnostic listing the cycle path

## Open Questions
- U1 remains partially open: this integration assumes 'compile ada' means building the TypeScript monorepo (option a). If it means invoking Ada's semantic pipeline (option b), the entire component structure changes. A root-level 'build' script in package.json would confirm option (a).
- U2: Does a root-level 'pnpm build' script exist that invokes 'tsc -b', or must CompositeBuildExecutor be implemented to call tsc directly? The root package.json scripts field was not provided.
- U3: The full internal dependency graph is partially known from PACKAGE STRUCTURE but leaf vs. entry distinction for all packages needs confirmation — e.g., is @ada/storage a leaf or does it have internal deps?
- Should CompositeBuildExecutor invoke 'tsc -b' directly via child_process, or delegate to 'pnpm -r run build' which lets each package define its own build script?
- Are there any packages that require a non-tsc build step (e.g., code generation, asset copying) that must run before or after TypeScript compilation?
- What is the expected behavior when a single package fails compilation — should remaining independent packages still attempt to build, or is it a hard stop?

## Orchestration Map
Ada builds this project by bounded context. Each context is one Claude Code session:

**Workspace**
Build the workspace discovery subsystem that scans pnpm-workspace.yaml to find all workspace packages, extracts their internal workspace: protocol dependency edges, validates the dependency graph is acyclic, and computes a topological build order.

**CompilationConfiguration** <- after: Workspace
Build the compilation configuration subsystem that reads and validates tsconfig.json files across all workspace packages, enforces composite mode and declaration emit contracts, resolves project references between packages, and orchestrates the tsc composite build invocation including stale artifact cleanup.

**Artifact** <- after: CompilationConfiguration
Build the artifact verification subsystem that checks compiled output directories for JavaScript files, TypeScript declaration files, and tsbuildinfo caches, and validates that primary entrypoints (MCP server, CLI) resolve to existing compiled JavaScript in dist/.

## Orchestration Protocol
When ADA_SUBGOAL env is set, you are in an orchestrated session:
1. Call `ada.advance_execution("<sessionId>")` to get your component-level task brief
2. Implement all components in your bounded context
3. Call `ada.set_task_status("<component>", "complete", [<evidence>])` per component
4. Call `ada.complete_subgoal("<subGoalName>", [<evidence>])` when ALL components are done
5. Exit — the Ada orchestrator will spawn the next session

## Ada MCP
The MCP server is the spec authority. Pull context on demand — never assume from memory.

**Start of every task:** call `ada.advance_execution(agentId)` to get your task brief.
**Before modifying any entity:** call `ada.query_constraints(entityName)`.
**Before significant changes:** call `ada.check_drift(description)`.

## This Session
You are the lead agent. Call `ada.advance_execution(agentId)` to get your first task. Follow the execution brief. Verify postconditions before marking complete.
