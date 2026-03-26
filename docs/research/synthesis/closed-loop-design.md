# Ada ↔ Claude Code Closed Loop — Design Spec

## Researched: 2026-03-24

---

## Overview

A closed loop between Ada and Claude Code means Ada's authority over intent does not end at ACCEPT. Ada compiles intent into a governing artifact — CLAUDE.md, agent files, hooks, world model — and Claude Code executes against that artifact. The loop closes when execution deviations (drift, scope extension, invariant violations, implementation decisions that diverge from blueprint) feed back into Ada's governing state so the world model reflects what was actually built, not just what was planned. Without the return path, the world model goes stale as code grows, hooks enforce against an increasingly fictional blueprint, and `ada verify` measures conformance to an artifact that no longer describes the system. The feedback direction — Claude Code signals Ada about what happened, Ada updates its governing state and re-emits corrected constraints — is the missing half of the current architecture.

---

## Signal Map

| Direction    | Signal                                                                                         | Mechanism                                                                                                                           | When                                                           | Status           |
| ------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| Ada → Claude | Full blueprint (summary, architecture, components, build order)                                | CLAUDE.md written to repo root at ACCEPT, loaded as `<system-reminder>` at session start                                            | Every new session                                              | LIVE             |
| Ada → Claude | Bounded-context invariants, workflow steps, Hoare triples, state machines, acceptance criteria | `.claude/agents/*.md` written at ACCEPT, loaded on-demand when Claude invokes an agent                                              | When Claude works in a specific bounded context                | LIVE             |
| Ada → Claude | Entity invariant enforcement — block tool calls that violate predicates                        | `hooks/pre-tool/*.sh` registered in `.claude/settings.json`, dispatched via `hooks/pre-tool-dispatch.sh` on every `PreToolUse:Bash` | Before every Bash tool call during pipeline run                | LIVE (heuristic) |
| Ada → Claude | Session orientation — re-inject Ada invariants at session start                                | `hooks/session-start.sh` writing JSON to stdout (injected into Claude context via `SessionStart` hook)                              | Session start and resume                                       | LIVE             |
| Ada → Claude | Blueprint read access                                                                          | `ada.get_blueprint` MCP tool — returns full blueprint from `.ada/state.json`                                                        | On Claude's demand                                             | LIVE             |
| Ada → Claude | Entity invariant query                                                                         | `ada.get_invariants(entityName)` MCP tool — returns predicates for named entity                                                     | On Claude's demand, before modifying an entity                 | LIVE             |
| Ada → Claude | Workflow step query                                                                            | `ada.get_workflow(workflowName)` MCP tool — returns steps with preconditions and postconditions                                     | On Claude's demand                                             | LIVE             |
| Ada → Claude | Pre-change constraint check                                                                    | `ada.query_constraints(scope)` MCP tool — keyword-matches entities and workflows against scope string                               | On Claude's demand, before modifying a domain                  | LIVE (heuristic) |
| Ada → Claude | Pre-change intent alignment check                                                              | `ada.check_drift(description)` MCP tool — keyword-matches proposed action against intent graph goals                                | On Claude's demand, before significant changes                 | LIVE (heuristic) |
| Ada → Claude | Full world model / stage artifact read                                                         | `ada.get_world_model(stage?)` MCP tool — returns manifest or any stage artifact from `.ada/`                                        | On Claude's demand                                             | LIVE             |
| Ada → Claude | Code-against-entity verification                                                               | `ada.verify(code, entityName)` MCP tool — checks code string against entity invariant predicates                                    | On Claude's demand                                             | LIVE (heuristic) |
| Ada → Claude | Context re-injection after compaction                                                          | No hook registered for `PreCompact` or `PostCompact`                                                                                | Before/after context compaction                                | MISSING          |
| Ada → Claude | `.mcp.json` auto-written at ACCEPT                                                             | MCP server config written to repo root so Claude Code auto-connects on every session                                                | At ACCEPT, before first developer session                      | MISSING          |
| Ada → Claude | Server-level usage instructions                                                                | MCP `instructions` field in server declaration                                                                                      | At session start, tool list fetch                              | MISSING          |
| Claude → Ada | Semantic drift logged to provenance store                                                      | `ada.log_drift(location, original, actual, severity)` MCP tool — writes to `provenance.db`                                          | When Claude detects its implementation deviates from blueprint | LIVE (voluntary) |
| Claude → Ada | New agent proposal                                                                             | `ada.propose_agent(name, description, tools, trigger)` MCP tool — writes `.md` to `.claude/agents/`                                 | When Claude determines a new bounded context needs an agent    | LIVE (voluntary) |
| Claude → Ada | Post-tool audit trail                                                                          | No `PostToolUse` hook writing tool calls and results to a log file                                                                  | After every tool execution                                     | MISSING          |
| Claude → Ada | Implementation decision record                                                                 | No mechanism for Claude to write "I chose approach X because Y" back to Ada's world model                                           | During active development                                      | MISSING          |
| Claude → Ada | Blueprint amendment signal                                                                     | No `ada.amend_intent` or `ada.extend_blueprint` tool; Claude cannot propose additions to the compiled intent                        | When Claude discovers scope during implementation              | MISSING          |
| Claude → Ada | Invariant violation acknowledgment                                                             | No structured way for Claude to record "I was blocked by hook X, I resolved it by Y"                                                | When a hook blocks a tool call                                 | MISSING          |
| Claude → Ada | Session summary / checkpoint                                                                   | No `SessionEnd` hook writing a structured summary of what changed to `.ada/`                                                        | At session end                                                 | MISSING          |

---

## Current Loop Gaps

### GAP 1: No PostToolUse audit trail (MISSING)

Ada has no record of what Claude Code does after ACCEPT. The hooks only fire pre-tool and only during pipeline runs (`ADA_PIPELINE_RUN_ID` guard). Outside that guard — which is the normal developer session — zero tool calls are observed. Ada cannot know which files were written, which commands were run, or whether the session diverged from the blueprint.

What needs to be built: A `PostToolUse` hook registered for `Bash|Edit|Write|Read` that appends a compact JSON record to `.ada/session-log.jsonl`. Each record: `{ ts, tool, input_summary, exit_code }`. This log is the raw signal for Ada's drift detection. The hook must be unconditional (no `ADA_PIPELINE_RUN_ID` guard) to observe developer sessions.

### GAP 2: No `ada.log_drift` call path in practice (PARTIAL)

`ada.log_drift` exists and writes to `provenance.db`. But it is voluntary — Claude must choose to call it. Claude has no standing instruction to call it, no hook nudges it to call it, and no session-end mechanism prompts a drift reconciliation. The tool is live but the signal path is unused.

What needs to be built: CLAUDE.md must instruct Claude to call `ada.log_drift` whenever it consciously deviates from a blueprint specification. The `Stop` hook or `SessionEnd` hook should prompt a structured drift reconciliation: "Review this session's changes against `.ada/state.json`. Call `ada.log_drift` for any divergence."

### GAP 3: No blueprint amendment path from Claude to Ada (MISSING)

When Claude discovers during implementation that the blueprint is incomplete, wrong, or needs extension, there is no tool to signal this back. Claude can call `ada.log_drift` (writes a drift record) but cannot propose a blueprint amendment. The world model stays frozen at compile time.

What needs to be built: An `ada.propose_amendment(stage, field, original, proposed, rationale)` MCP tool that writes a structured amendment proposal to `.ada/amendments/`. Ada's CLI then processes the queue: `ada review-amendments`. This closes the most important gap — the loop from discovered implementation reality back into Ada's governing state.

### GAP 4: No PreCompact / PostCompact hook (MISSING)

Ada's most critical invariants are in CLAUDE.md and agent files. CLAUDE.md is re-read from disk after compaction (confirmed behavior). But mid-session instructions given as conversation content are lost. Ada has no hook registered for `PreCompact` to write a checkpoint or for `PostCompact` to re-inject critical state.

What needs to be built: A `PreCompact` hook that: (1) writes current pipeline state to `.ada/session-checkpoint.json`, and (2) outputs a text summary to stdout that gets included in the compaction context. A `PostCompact` hook that verifies CLAUDE.md was re-injected (it will be, by Claude Code's design) and emits a context reminder about active pipeline state.

### GAP 5: No `.mcp.json` written at ACCEPT (MISSING)

Users must manually configure the Ada MCP server. Ada's ACCEPT flow does not write `.mcp.json`. Every new project requires manual setup. The MCP server — Ada's primary bidirectional signal channel — requires user intervention to activate.

What needs to be built: At ACCEPT, the compiler's config-writer stage writes `.mcp.json` at the repo root with the `ada` server entry. This makes the MCP server auto-connect on every Claude Code session in that repo without user configuration.

### GAP 6: No MCP server `instructions` field (MISSING)

The MCP server declares tools but not a server-level instructions string. Claude Code reads this string to understand how to use the tools. Without it, Claude must infer when to call Ada tools. Ada's tools are called reactively (when Claude remembers) rather than proactively (when the server instructs it to).

What needs to be built: Add an `instructions` field to the server declaration in `server.ts`: "Ada semantic compiler. Call `ada.query_constraints` before modifying any entity. Call `ada.check_drift` before implementing any significant change. Call `ada.log_drift` when your implementation diverges from the blueprint specification. The blueprint is the authority — the code must trace to it."

### GAP 7: No structured session-end signal (MISSING)

When a development session ends, Ada receives no signal. The world model does not update to reflect what was built. The provenance chain does not extend. The next session starts from the same compile-time snapshot.

What needs to be built: A `SessionEnd` hook that reads `.ada/session-log.jsonl` (the audit trail from GAP 1) and writes a structured session summary to `.ada/sessions/{session_id}.json`: files changed, tools called, drift entries logged, blueprint sections referenced. This gives Ada a chronological record of execution history against the blueprint.

---

## Phase 5 Design

Phase 5 closes the loop with the minimum viable set of changes. All mechanisms below are confirmed in the research files.

### 5.1 PostToolUse Audit Hook

**Files changed:** `.claude/settings.json` — add a `PostToolUse` hook entry.

**New file:** `hooks/post-tool-audit.sh`

Hook registration (added to `settings.json` `hooks` object):

```json
"PostToolUse": [
  {
    "matcher": "Bash|Edit|Write|Read|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "hooks/post-tool-audit.sh",
        "timeout": 5
      }
    ]
  }
]
```

Hook reads stdin (JSON with `tool_name`, `tool_input`, `tool_response`), appends one line to `.ada/session-log.jsonl`:

```json
{
  "ts": 1234567890,
  "session": "uuid",
  "tool": "Edit",
  "path": "src/payment.ts",
  "exit_code": 0
}
```

The hook does not block (always exits 0). It is a pure observer. It fires on every session unconditionally — no `ADA_PIPELINE_RUN_ID` guard.

The `session_id` and `transcript_path` are available in the hook's stdin. `cwd` is available. The log file is `$CLAUDE_PROJECT_DIR/.ada/session-log.jsonl`.

### 5.2 MCP Tool: `ada.propose_amendment`

**Files changed:** `packages/mcp-server/src/server.ts` — add tool to `ListTools` and `CallTool` handler. New file: `packages/mcp-server/src/tools/propose-amendment.ts`.

Tool schema:

```json
{
  "name": "ada.propose_amendment",
  "description": "Proposes a change to the compiled blueprint when implementation reveals the blueprint is incomplete or incorrect. Ada processes the queue via 'ada review-amendments'. Use when you discover during implementation that a goal is missing, an entity needs a new invariant, or a workflow step is wrong.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "stage": {
        "type": "string",
        "description": "Pipeline stage: INT, ENT, PRO, SYN"
      },
      "field": {
        "type": "string",
        "description": "The specific field being amended (e.g. 'goals', 'entities', 'workflows')"
      },
      "original": {
        "type": "string",
        "description": "Current blueprint value"
      },
      "proposed": {
        "type": "string",
        "description": "Proposed replacement or addition"
      },
      "rationale": {
        "type": "string",
        "description": "Why implementation revealed this amendment is needed"
      }
    },
    "required": ["stage", "field", "proposed", "rationale"]
  }
}
```

Implementation writes to `.ada/amendments/{timestamp}-{stage}.json`. The file is a plain JSON record. Ada's CLI adds `ada review-amendments` command that reads the queue, presents each for human review, and on approval runs `ada compile --amend` with the proposed change injected. This is the closure mechanism: Claude discovers reality during build, proposes the correction, Ada re-compiles with the corrected intent.

### 5.3 MCP Server Instructions Field

**Files changed:** `packages/mcp-server/src/server.ts` — add `instructions` to the `Server` constructor capabilities.

The MCP `initialize` response can include an `instructions` string [CONFIRMED in modelcontextprotocol.io spec — servers declare instructions in the `initialize` response under `serverInfo`]. The `@modelcontextprotocol/sdk` Server class accepts this in its constructor options.

Instructions text:

```
Ada semantic compiler — intent authority for this codebase.

Rules for using Ada tools:
1. Before modifying any entity or data model: call ada.query_constraints with the entity name.
2. Before any significant implementation decision: call ada.check_drift with a description of the change.
3. When your implementation deviates from the blueprint specification: call ada.log_drift.
4. When implementation reveals the blueprint is incomplete or wrong: call ada.propose_amendment.
5. The blueprint in ada.get_blueprint is the authority. Code must trace to it. When in conflict, surface the conflict via ada.log_drift rather than silently choosing.
```

### 5.4 PreCompact Context Checkpoint

**Files changed:** `.claude/settings.json` — add `PreCompact` hook entry. New file: `hooks/pre-compact.sh`.

The `PreCompact` hook fires before context compaction [CONFIRMED]. The hook's stdout text is injected into the compaction context, meaning it influences what the compaction summary preserves.

Hook outputs a plain text summary to stdout:

```
ADA CHECKPOINT — read before compacting.
Active blueprint: [reads .ada/manifest.json for runId and intent summary]
Last session log entry: [reads last line of .ada/session-log.jsonl]
Critical: After compaction, re-read CLAUDE.md. Ada invariants must survive compaction.
```

This ensures the compaction LLM preserves Ada context in its summary. CLAUDE.md is re-read from disk automatically after compaction (confirmed behavior), so the double-injection reinforces it.

### 5.5 `.mcp.json` Written at ACCEPT

**Files changed:** `packages/compiler/src/agents/` (config-writer stage) — add `.mcp.json` write step.

At ACCEPT, the config-writer writes `.mcp.json` to the project root:

```json
{
  "mcpServers": {
    "ada": {
      "type": "stdio",
      "command": "ada",
      "args": ["mcp"],
      "env": {
        "ADA_PROJECT_DIR": "${CLAUDE_PROJECT_DIR:-}"
      }
    }
  }
}
```

This is a project-scoped MCP config [CONFIRMED — `.mcp.json` at repo root is the project scope]. It is version-controlled and applies to all developers on the project. No manual configuration required after `ada compile`.

### 5.6 SessionEnd Summary Hook

**Files changed:** `.claude/settings.json` — add `SessionEnd` hook entry. New file: `hooks/session-end.sh`.

The `SessionEnd` hook fires when the session ends [CONFIRMED — `SessionEnd` event with `end_reason: clear|resume|logout`]. The hook reads `.ada/session-log.jsonl` (filtered to current session ID from stdin), counts file writes, tool calls, and any drift log entries, then writes a session summary to `.ada/sessions/{session_id}.json`.

This gives Ada a chronological execution record. The `ada verify` command can cross-reference these summaries against the blueprint to compute real drift over time (not just point-in-time string matching).

---

## Implementation Order

1. **Write `.mcp.json` at ACCEPT** — one file write in config-writer. Zero dependencies. Closes the manual setup gap immediately. Every project compiled after this change gets a working MCP connection automatically.

2. **Add MCP server `instructions` field** — one-line change in `server.ts`. Zero dependencies. Immediately changes Claude's default behavior from reactive to proactive Ada tool use. Highest leverage per line of code.

3. **PostToolUse audit hook** — new `hooks/post-tool-audit.sh` + settings entry. Depends on nothing. Creates the raw signal (`.ada/session-log.jsonl`) that all subsequent drift detection builds on. Must be unconditional (no pipeline run guard).

4. **`ada.propose_amendment` MCP tool** — new tool in MCP server + new `propose-amendment.ts`. Depends on the MCP server being connected (step 1). Closes the most important semantic gap: Claude can now signal Ada that the blueprint needs updating. The amendment queue file format is trivial. The `ada review-amendments` CLI command is the harder part — implement the file format first, CLI second.

5. **PreCompact checkpoint hook** — new `hooks/pre-compact.sh` + settings entry. Depends on the session log (step 3) to read the last entry. Low complexity. Protects Ada context from compaction loss.

6. **Enforce `ada.log_drift` via CLAUDE.md instruction** — add an explicit instruction to the generated CLAUDE.md: "When your implementation deviates from the blueprint, call ada.log_drift before proceeding." Zero new code. Activates the existing `ada.log_drift` tool that is live but unused. Depends on CLAUDE.md generation being under Ada's control (it is).

7. **SessionEnd summary hook** — new `hooks/session-end.sh` + settings entry. Depends on the session log (step 3). The summary schema can start simple (file list, tool count, drift count) and grow as the amendment review workflow matures.

8. **Semantic drift detection in `ada verify`** — read `.ada/sessions/*.json` and cross-reference against the blueprint using LLM comparison of file contents against Hoare triple specifications. This is the hardest step: it requires LLM calls in the verify path and a defined comparison rubric. All prior steps feed into this one — the session logs, drift records, and amendment proposals are the inputs. Build last, after the signal infrastructure is proven.
