# PLAN.md — Ada Implementation Plan

**Authority:** phased implementation plan derived from docs/DIRECTION.md and docs/STATE.md gap audit.
**Current date:** 2026-03-26
**Rule:** Each phase must be complete before the next begins. Phase 0 is a prerequisite for everything.

---

## Phase 0 — Foundation Repair

Fix what is broken in the current system. These are not enhancements — they are bugs that break existing functionality. Nothing built on top of a broken foundation holds.

| #   | File                                                               | What is broken                                                                          | Fix                                                                                    |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 0.1 | `packages/config-writer/src/settings.ts`                           | `mcpServers.command` is `"ada mcp"` (with space) — process spawn fails on all platforms | Change to `command: "ada", args: ["mcp"]`                                              |
| 0.2 | `packages/config-writer/src/writer.ts`                             | `.mcp.json` never written — MCP unavailable on new clones                               | Add `.mcp.json` write in `writeConfigGraph()`                                          |
| 0.3 | `packages/mcp-server/src/state.ts`                                 | `CLAUDE_PROJECT_DIR` not in fallback chain — wrong dir in non-standard launches         | Add as third fallback: `ADA_PROJECT_DIR → ADA_STATE_PATH → CLAUDE_PROJECT_DIR → cwd()` |
| 0.4 | `packages/config-writer/src/settings.ts` + `.claude/settings.json` | Hook timeout is 30s — causes silent bypass on slow machines                             | Remove timeout field (use 600s default)                                                |
| 0.5 | `packages/mcp-server/src/server.ts`                                | No server `instructions` field — Claude doesn't get server-level guidance               | Add `instructions` string to server capabilities                                       |
| 0.6 | `packages/config-writer/src/claude-md.ts`                          | CLAUDE.md output is 355 lines — 77% over 200-line budget where adherence degrades       | Slim template: move component blocks to @ imports referencing agent files              |

**Acceptance criteria:** After Phase 0, a fresh clone of any Ada-compiled project can connect to the MCP server without manual configuration, CLAUDE.md is under 200 lines, and no hook calls time out silently.

---

## Phase 1 — Feedback Loop

Close the circuit between Ada and Claude Code. Currently Ada → Claude Code is one-way. Claude Code builds, things change, Ada doesn't know. These changes create the return path.

| #   | What                                | Where                                                | Why                                                                                              |
| --- | ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1.1 | PostToolUse audit hook              | `hooks/post-tool-audit.sh` + settings registration   | Every tool call appended to `.ada/session-log.jsonl` — raw signal for all drift detection        |
| 1.2 | PreCompact checkpoint hook          | `hooks/pre-compact.sh` + settings registration       | Ada context survives context compaction — outputs summary to stdout before compaction runs       |
| 1.3 | `ada.propose_amendment` MCP tool    | `packages/mcp-server/src/tools/propose-amendment.ts` | Claude can signal Ada when blueprint needs updating — closes the most critical semantic gap      |
| 1.4 | SessionEnd summary hook             | `hooks/session-end.sh` + settings registration       | Structured session summary written to `.ada/sessions/{id}.json` — chronological execution record |
| 1.5 | `ada review-amendments` CLI command | `cli/src/commands/review-amendments.ts`              | Human reviews amendment queue, approves/rejects, triggers `ada compile --amend` if approved      |

**Acceptance criteria:** After Phase 1, Ada has a record of what Claude Code did in every session, Claude can propose blueprint amendments, and amendments can be reviewed and applied.

---

## Phase 2 — World-State Runtime

Ada currently compiles intent into a frozen artifact. This phase makes Ada a runtime: it tracks what is actually true as execution proceeds, not just what was planned.

| #   | What                    | Notes                                                                                                                                                                                              |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | World-state schema      | Versioned, action-conditioned. Fields: environment facts, predicted next states, uncertainty score, cost-of-acting, rollback checkpoints. Separate from compiled world model — different concerns. |
| 2.2 | Execution state tracker | Reads session log (Phase 1.1), updates world-state after each tool call. Tracks: files written, decisions made, components implemented vs planned.                                                 |
| 2.3 | Rollback checkpoints    | Written at each significant state transition. Format: git stash or snapshot to `.ada/checkpoints/{ts}.json`. Ada can revert to any checkpoint.                                                     |
| 2.4 | Runtime MCP tools       | `ada.get_runtime_state()` — current execution state. `ada.rollback_to(checkpoint)` — revert to checkpoint. Extend existing MCP server.                                                             |
| 2.5 | Uncertainty tracking    | Each state fact carries a confidence score. Facts sourced from verified tool outputs have high confidence. Facts inferred by LLM have lower confidence. Surfaces uncertainty to macro planner.     |

**Acceptance criteria:** After Phase 2, Ada knows what has been built in the current session, can answer "what is the current state?" with evidence, and can roll back to any checkpoint.

---

## Phase 3 — Hierarchical Execution

Replace flat execution (one agent loops indefinitely) with explicit macro/micro split. This is the architectural change that makes long-horizon tasks tractable.

| #   | What                   | Notes                                                                                                                                                                        |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Macro planner          | Decomposes compiled blueprint into bounded execution units. Governs sequencing. Decides escalation. Reads world-state runtime (Phase 2) to know current progress.            |
| 3.2 | Micro executor         | Bounded task per component or workflow step. Receives a delegation contract (Phase 4) defining its scope, permissions, stop conditions. Reports back with required evidence. |
| 3.3 | Local repair           | Handles micro-level failures without escalating. Has a defined retry budget. If repair budget exhausted, escalates to macro planner.                                         |
| 3.4 | Independent verifier   | Separated from executor — cannot self-report success. Evaluates micro executor output against acceptance criteria from compiled blueprint.                                   |
| 3.5 | Execution orchestrator | Coordinates macro/micro cycle. Reads blueprint, initializes macro plan, spawns micro executors with contracts, collects evidence, routes to verifier, updates world-state.   |

**Acceptance criteria:** After Phase 3, Ada can take a compiled blueprint and execute it without the user managing individual Claude Code sessions. Failures at the micro level are handled locally or escalated cleanly.

---

## Phase 4 — Delegation Contracts

Ada compiles delegation contracts alongside CLAUDE.md. Contracts bound what child agents can do. No unconstrained spawning.

| #   | What                 | Notes                                                                                                                                                                                                  |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1 | Contract schema      | TypeScript type: `DelegationContract` with fields: `inheritedPermissions`, `scope` (bounded context + file boundaries), `stopConditions`, `reportingCadence`, `requiredEvidence`, `maxRecursionDepth`. |
| 4.2 | Contract compiler    | New stage or SYN extension: compiles blueprint components into delegation contracts. One contract per bounded context.                                                                                 |
| 4.3 | Contract writer      | Extension to config-writer: writes contracts to `.claude/contracts/{context}.json`. Readable by spawned agents via MCP.                                                                                |
| 4.4 | Contract enforcement | MCP tool `ada.get_contract(context)` — spawned agent reads its contract at session start. Hooks enforce scope constraints (file boundary violations).                                                  |
| 4.5 | Depth tracking       | Ada tracks recursion depth. When max depth reached, agent must report up rather than spawning further. Prevents infinite delegation trees.                                                             |

**Acceptance criteria:** After Phase 4, every spawned agent operates under a typed contract. Ada can answer "what is this agent allowed to do?" for any active agent.

---

## Phase 5 — Verification Stack

Replace the single heuristic verifier with a heterogeneous stack. Each layer catches what the others miss.

| #   | Verifier            | What it checks                                                      | Implementation                                                                                                                     |
| --- | ------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Structural verifier | Plans and dependency graphs — are the pieces consistent?            | Graph analysis of blueprint component dependencies vs actual code structure. Static, no LLM.                                       |
| 5.2 | Execution verifier  | Tool outcomes — did tools do what was intended?                     | Reads session log (Phase 1.1). Matches tool calls against step preconditions/postconditions from PRO stage.                        |
| 5.3 | Policy verifier     | Allowedness — does this action violate a compiled constraint?       | Checks action against ENT invariants and delegation contract scope. Deterministic predicate evaluation where possible.             |
| 5.4 | Outcome verifier    | Task completion — does the result satisfy acceptance criteria?      | LLM-assisted comparison of implemented behavior against compiled Hoare triples. Expensive; runs at phase completion, not per-tool. |
| 5.5 | Provenance verifier | Trace completeness — can every output be traced to compiled intent? | Extends existing provenance chain. Checks that every written file has a traceable postcode parent.                                 |

**Acceptance criteria:** After Phase 5, `ada verify` produces meaningful scores (not inflated by token presence). Each verifier layer runs independently. Failures identify which layer caught the issue.

---

## Phase 6 — Safe Self-Improvement

Ada gets better at helping you build. Improvements are offline, benchmarked, and human-approved.

| #   | What                      | Notes                                                                                                                                                                                               |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Skill extraction          | Analyzes session logs (Phase 1.1) and session summaries (Phase 1.4) to identify reusable patterns. Patterns that appear in multiple successful sessions become skill candidates.                    |
| 6.2 | Experiment branches       | Proposed skill improvements are tested in isolated git branches against a benchmark suite before promotion is considered.                                                                           |
| 6.3 | Promotion gates           | Human reviews skill candidates via `ada review-skills`. Approved skills are written to `.claude/skills/` and referenced in agent frontmatter. Governance approval required — no self-authorization. |
| 6.4 | Rollbackable upgrades     | All skill changes are versioned. `ada rollback-skill <name>` reverts to prior version. Git-backed.                                                                                                  |
| 6.5 | Immutable governance core | Compiled intent (`.ada/`), entity invariants, and delegation policies are not touched by self-improvement. Agents improve workflows and skills. They do not rewrite the constitution.               |

**Acceptance criteria:** After Phase 6, Ada's skills improve from session evidence without requiring manual curation. Every improvement is auditable, reversible, and human-approved before deployment.

---

## Sequencing Rules

1. Phase 0 must be complete before any other phase begins. Broken output artifacts undermine everything.
2. Phase 1 (feedback loop) must precede Phase 2 (world-state runtime). The runtime depends on session logs Phase 1 creates.
3. Phase 2 must precede Phase 3 (hierarchical execution). The macro planner reads runtime state.
4. Phase 3 and Phase 4 (delegation contracts) can proceed in parallel — they are independent.
5. Phase 5 (verification stack) depends on Phase 1 (session logs for execution verifier) and Phase 4 (contracts for policy verifier).
6. Phase 6 (self-improvement) depends on Phase 1 (session logs) and Phase 5 (verification to benchmark experiments).

---

## Current Status

| Phase                      | Status                 | Notes                                                                                                                                                      |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation Repair      | **COMPLETE**           | All 6 bugs fixed. Hook timeouts removed.                                                                                                                   |
| 1 — Feedback Loop          | **COMPLETE**           | All 5 items built and wired: session log, pre-compact, propose_amendment, session-end, review-amendments CLI.                                              |
| 2 — World-State Runtime    | **PARTIALLY COMPLETE** | `get_runtime_state`, `checkpoint`, `rollback_to` exist. Missing: uncertainty tracking (2.5).                                                               |
| 3 — Hierarchical Execution | **PARTIALLY COMPLETE** | `get_macro_plan` exists. Missing: micro executor (3.2), local repair (3.3), execution orchestrator (3.5).                                                  |
| 4 — Delegation Contracts   | **COMPLETE**           | `get_contract`, `enter_delegation`, `exit_delegation` exist. `blueprintToContracts()` in config-writer writes one contract per bounded context on compile. |
| 5 — Verification Stack     | **PARTIALLY COMPLETE** | 5-layer `ada.verify` exists. Needs real-world validation against live sessions.                                                                            |
| 6 — Safe Self-Improvement  | **PARTIALLY COMPLETE** | `extract_skills`, `propose_skill`, `review-skills` exist. Missing: experiment branches (6.2), rollbackable upgrades (6.4).                                 |

---

## True Gaps — What Is Not Yet Built

These items do not exist in any form and represent the remaining implementation work:

| Item                   | Phase | Description                                                                          |
| ---------------------- | ----- | ------------------------------------------------------------------------------------ |
| Micro executor         | 3.2   | Bounded task execution per component/workflow step under a delegation contract       |
| Local repair           | 3.3   | Micro-level failure handling with defined retry budget before escalation             |
| Execution orchestrator | 3.5   | Coordinates macro/micro cycle: reads blueprint, spawns executors, routes to verifier |
| Uncertainty tracking   | 2.5   | Per-fact confidence scores in world-state; sourced facts vs inferred facts           |
| Experiment branches    | 6.2   | Isolated git branches for testing skill improvements before promotion                |
| Rollbackable upgrades  | 6.4   | `ada rollback-skill <name>` — versioned, git-backed skill reverts                    |
