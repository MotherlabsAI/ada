# Ada Packages

Reference for the 9 workspace packages under `packages/*`. Exports, cross-package deps, and CLI wiring. No per-package READMEs exist.

## @ada/compiler

- **Purpose** — 7-stage semantic compilation engine (INT→PER→ENT→PRO→SYN→AUD→GOV) plus post-pipeline code verification.
- **Top exports** — `MotherCompiler`, `IntentAgent` / `PersonaAgent` / `EntityAgent` / `ProcessAgent` / `SynthesisAgent` / `VerifyAgent` / `GovernorAgent`, `verify`, `buildGate`, zod schemas (`intentGraphSchema`, `blueprintSchema`, etc.).
- **Depends on** — `@ada/provenance`.
- **Consumed by** — `@ada/elicitation`, `@ada/config-writer`, `@ada/mcp-server`, `@ada/orchestrator`, `@ada/governor`, `cli` (`commands/compile.ts`, `commands/init.ts`, `commands/verify.ts`, UI components).
- **Entry** — `import { MotherCompiler } from "@ada/compiler";`

## @ada/elicitation

- **Purpose** — Interactive pre-compilation dialogue: take raw intent, drive clarification turns until the draft IntentGraph is compile-ready, then hand off.
- **Top exports** — `createElicitationSessionManager`, `ElicitationSessionManager`, `DialogueEngine`, `GapAnalyzer`, `ReadinessAssessor`, `HandoffEmitter`.
- **Depends on** — `@ada/compiler`, `@ada/provenance`.
- **Consumed by** — `cli` (`commands/init.ts`).
- **Entry** — `import { createElicitationSessionManager } from "@ada/elicitation";`

## @ada/provenance

- **Purpose** — Base infrastructure for PostcodeAddresses and the provenance record store; every stage artifact is addressed here.
- **Top exports** — `generatePostcode`, `parsePostcode`, `isValidPostcode`, `ProvenanceStore`, types `PostcodeAddress` / `StageCode` / `ProvenanceRecord`.
- **Depends on** — none (leaf package; only `better-sqlite3`).
- **Consumed by** — `@ada/compiler`, `@ada/elicitation`, `@ada/config-writer`, `@ada/mcp-server`, `cli` (indirect).
- **Entry** — `import { generatePostcode, ProvenanceStore } from "@ada/provenance";`

## @ada/config-writer

- **Purpose** — Translate an accepted Blueprint into a Claude Code config graph on disk (CLAUDE.md, agents, skills, hooks, settings).
- **Top exports** — `writeConfigGraph`, `blueprintToCLAUDEMD`, `componentsToAgents`, `workflowsToSkills`, `invariantsToHooks`, `buildSettings`.
- **Depends on** — `@ada/compiler`, `@ada/provenance`.
- **Consumed by** — `@ada/orchestrator`, `cli` (`commands/init.ts`).
- **Entry** — `import { writeConfigGraph } from "@ada/config-writer";`

## @ada/mcp-server

- **Purpose** — MCP server exposing ada's verify / workflow-spec / agent-file-spec tools to other agents.
- **Top exports** — `startServer`, `loadBlueprint`, types `VerifyResult` / `WorkflowSpec` / `AgentFileSpec`.
- **Depends on** — `@ada/compiler`, `@ada/provenance`.
- **Consumed by** — `cli` (`commands/mcp.ts`).
- **Entry** — `import { startServer } from "@ada/mcp-server";`

## @ada/orchestrator

- **Purpose** — Spawns and drives Claude Code build subprocesses from a Blueprint (stream-json events, checkpoints, compile loop, correction injection).
- **Top exports** — `spawn`, `injectCorrection`, `runCompileLoop`, `parseStreamJsonLine`, `writeCheckpoint` / `readCheckpoint`.
- **Depends on** — `@ada/compiler`, `@ada/config-writer`.
- **Consumed by** — `@ada/governor`, `cli` (`commands/run.ts`, `commands/resume.ts`).
- **Entry** — `import { spawn, runCompileLoop } from "@ada/orchestrator";`

## @ada/governor

- **Purpose** — Post-build governance: watch orchestrator events, track confidence, and evaluate runtime drift against Blueprint invariants.
- **Top exports** — `watch`, `ConfidenceTracker`, `evaluateInvariants`, types `GovernorSignal` / `SuggestedAgent` / `DriftResult`.
- **Depends on** — `@ada/compiler`, `@ada/orchestrator`.
- **Consumed by** — **no current CLI import** — internal-only, not yet wired into the CLI.
- **Entry** — `import { watch, ConfidenceTracker } from "@ada/governor";`

## @ada/storage

- **Purpose** — Global project registry + run history in `~/.ada/storage.db` (SQLite, WAL). Tracks every compile across all projects.
- **Top exports** — `AdaStorage`, types `ProjectRecord` / `RunRecord`.
- **Depends on** — none (leaf package; only `better-sqlite3`).
- **Consumed by** — `cli` (`commands/init.ts`, `commands/history.ts`, `commands/list.ts`).
- **Entry** — `import { AdaStorage } from "@ada/storage";`

## @ada/int-rerun

- **Purpose** — Stateless INT-stage disambiguation rerun pipeline with downstream SYN gate re-evaluation. Built per CLAUDE.md build order.
- **Top exports** — `createINTRerunPipeline`, `executeINTRerun`, types `RunArtifact` / `SYNValidationResult` / `PipelineRun`, `PipelineError`.
- **Depends on** — none (standalone; no workspace deps in package.json).
- **Consumed by** — **no current importers** — internal-only, not imported by CLI or any other package. Referenced conceptually by `IterationManager` in the architecture.
- **Entry** — `import { executeINTRerun } from "@ada/int-rerun";`

## Dependency Diagram

Top-down; arrows point from consumer to provider.

```
                              cli
           ┌───────┬───────┬──┴──┬───────┬──────────┬──────────┐
           │       │       │     │       │          │          │
           ▼       ▼       ▼     ▼       ▼          ▼          ▼
       compiler elicitation mcp-server orchestrator storage  governor*
           │       │         │          │                       │
           │       │         │          │(uses orchestrator+compiler)
           │       │         │          │
           │       │         │          ▼
           │       │         │      config-writer
           │       │         │          │
           │       │         │          │
           ▼       ▼         ▼          ▼
                       provenance
                       (leaf; no @ada deps)

  storage:    leaf, no @ada deps
  int-rerun:  standalone — no deps, no consumers (internal-only)
  governor*:  built but not yet imported by the CLI (internal-only)
```

Leaf packages (no `@ada/*` deps): `provenance`, `storage`, `int-rerun`.
Not exported through the CLI yet: `governor`, `int-rerun`.
