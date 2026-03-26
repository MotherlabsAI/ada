# Ada Output Spec — Gap Analysis

## Researched: 2026-03-24

---

## Methodology

This document compares what Ada's `config-writer` and `mcp-server` packages actually produce against what Claude Code's documented behavior requires. Sources: six research files in `docs/research/claude-code/`, Ada source files in `packages/config-writer/src/` and `packages/mcp-server/src/`.

---

## Artifact 1: CLAUDE.md

### What Ada currently produces

Source: `packages/config-writer/src/claude-md.ts`

Ada generates a single CLAUDE.md at the project root via `blueprintToCLAUDEMD()`. Structure (lines 21–121):

1. Warning banner (if partial compilation)
2. Title (`# <summary split on first period>`) + `## Status: GHOST`
3. `## Summary` — full `blueprint.summary` string
4. `## Working Principles` — 7 fixed bullet directives
5. `## Architecture` — pattern + rationale
6. `## Components` — one `###` block per component: name, responsibility, bounded context, dependencies
7. Build order via topological sort
8. `## Done` — nonFunctional requirements as `- [ ]` checkboxes
9. `## Ada MCP` — references to three MCP tool calls by name
10. `## This Session` — 5-step protocol for the lead agent

The actual compiled CLAUDE.md for this project (the bootstrap project) is **355 lines** (`wc -l CLAUDE.md`).

### What Claude Code actually needs

- **Hard line limit: 200 lines.** Research file `context-loading.md` line 26: "Target: Keep each CLAUDE.md under 200 lines." Line 97: "Bloated CLAUDE.md (> 200 lines — adherence degrades significantly)."
- **No comment syntax.** Line 49: "All content is read as instructions." The `## Status: GHOST` header and `> Invariants...` blockquote lines at lines 67–69 of claude-md.ts are read as directives.
- **Injected as user message in `<system-reminder>` tag**, not system prompt. Displaceable during context compaction.
- **@ import syntax available.** Line 57: "`@README.md`, `@docs/git-instructions.md`" — Ada can split large content into referenced files rather than inlining everything.
- **Content works best:** specific build/test commands, architectural decisions with file locations, gotchas unique to the project, workflow requirements. Lines 83–98.
- **Content that does not work:** detailed API docs, frequently changing information, conflicting rules, bloated content.

### The gap

1. **CRITICAL — Size violation.** Ada produces 355 lines; Claude Code's adherence degrades past 200. The generated CLAUDE.md for this project is 77% over budget. This is not hypothetical: the CLAUDE.md in this repo is the compiled output and it is loaded in every session.

2. **HIGH — No @ import splitting.** Ada inlines all component blocks, build order, done criteria, MCP instructions, and session protocol directly. The @ import mechanism would allow Ada to emit a lean CLAUDE.md (~80 lines) that references `.claude/agents/`, `.claude/skills/`, and `.ada/artifacts/` via @ imports, keeping always-on context minimal.

3. **MEDIUM — Ada-internal status fields read as directives.** `## Status: GHOST — new project` (claude-md.ts line 22) and the `> Invariants, workflow steps...` blockquotes (lines 66–69) are Ada governance markers, not Claude instructions. Claude Code reads them as instructions. They consume tokens and may confuse routing.

4. **LOW — "This Session" section is mid-session context, not persistent rules.** The 5-step session protocol at the bottom is reasonable content but adds ~8 lines per compilation. Correct design — it survives compaction because CLAUDE.md is re-read fresh. No action required beyond size discipline.

**Priority: CRITICAL** (size), **HIGH** (@ imports)

---

## Artifact 2: Agent Files (.claude/agents/\*.md)

### What Ada currently produces

Source: `packages/config-writer/src/agents.ts`

Ada generates one agent file per component via `componentsToAgents()`. Frontmatter (lines 178–187):

```
---
name: {boundedContext}-agent
description: Use when {comp.responsibility.toLowerCase()} tasks arise in the {comp.boundedContext} domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
```

Body sections: title, responsibility, Bounded Context, Domain Vocabulary, Invariants, Workflow Steps (with Hoare triples), State Machines, Acceptance Criteria, Prohibited Actions.

Missing frontmatter fields: `maxTurns`, `effort`, `isolation`, `memory`, `disallowedTools`, `skills`, `mcpServers`.

### What Claude Code actually needs

From `agent-files.md`:

- `name` must be lowercase + hyphens only, must match filename without `.md` (line 10). Ada uses `{boundedContext}-agent` — correct format.
- `description` is the **sole automatic routing signal** (line 47). Template: `{Trigger condition}. {What the agent owns}. {What it does NOT do}.` (line 50). Three required components: TRIGGER, DOMAIN, CONSTRAINT (lines 54–59).
- `status` field is **Ada governance only — Claude Code ignores it** (line 164). It is not in Claude Code's schema.
- `model: claude-sonnet-4-6` — valid; Claude Code accepts full model IDs (line 16).
- `tools: [Bash, Read, Write, Edit, Glob, Grep]` — valid allowlist syntax.
- **Agent context is isolated** (line 67). Agent does NOT receive: full conversation history, CLAUDE.md context, parent session's loaded skills, parent session's memory. Bodies must be self-contained.
- **Agents cannot spawn other agents** — hard constraint (line 103).
- **Available but unused fields with high value for Ada** (lines 170–176): `maxTurns`, `effort: max` for governor/verify agents, `isolation: worktree` for read-only analysis, `memory: project`.

### The gap

1. **HIGH — Description field does not follow routing signal template.** Current template (agents.ts line 181): `"Use when {comp.responsibility.toLowerCase()} tasks arise in the {comp.boundedContext} domain."` This produces descriptions like "Use when loads and validates the blueprintcomponentregistry containing exactly 10... tasks arise in the BlueprintRegistration domain." This is verbose, syntactically awkward (responsibility is a sentence not a noun), and missing the CONSTRAINT component. The description should be: `"Use when {domain} tasks arise. Owns {bounded context entities}. Does not modify files outside {boundedContext}."` — matching the three-component template.

2. **HIGH — `status: GHOST` is written to files Claude Code will load.** Claude Code parses agent frontmatter. The `status` field is not in Claude Code's schema — it will be ignored but it occupies space and indicates Ada's governance model bleeds into the deployed artifact. Ada governance state should be tracked in Ada's internal state (`.ada/`), not in the deployed agent files.

3. **MEDIUM — No `maxTurns` field.** Nothing prevents an agent from running indefinitely on a long task. For compilation agents that have a bounded workload, `maxTurns: 20` (or similar) prevents runaway loops.

4. **MEDIUM — No `effort` field on high-value agents.** The governor and verify agents do high-stakes evaluation. `effort: max` on Opus would be appropriate. Currently hardcoded to `claude-sonnet-4-6` for all agents regardless of role.

5. **MEDIUM — No `skills` field on agents.** Ada generates skill files (`.claude/skills/*/SKILL.md`) but does not list them in agent frontmatter `skills` field. Research file line 21: "Skill content is fully injected into agent context at startup (not lazy)." Agents that need workflow procedures won't get them unless the skill is listed.

6. **LOW — No `isolation: worktree` for read-only agents.** Verify and audit agents that perform analysis without writing could safely run in isolated worktrees. Currently unused.

**Priority: HIGH** (description template, status field leakage)

---

## Artifact 3: settings.json

### What Ada currently produces

Source: `packages/config-writer/src/settings.ts`, and confirmed by reading `.claude/settings.json` directly.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "...",
        "hooks": [{ "type": "command", "command": "hooks/pre-tool/X.sh" }]
      }
    ],
    "PostToolUse": [],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "hooks/session-start.sh" }] }
    ]
  },
  "mcpServers": {
    "ada": { "command": "ada mcp", "args": [] }
  },
  "model": "claude-sonnet-4-6",
  "largeContextModel": "claude-opus-4-6"
}
```

Actual `.claude/settings.json` (line 9): `"command": "hooks/pre-tool-dispatch.sh"` with `"timeout": 30`. The generated settings from `buildSettings()` writes individual hook paths per invariant; the live settings.json uses the dispatcher pattern instead. This is a discrepancy between the generator and the deployed artifact.

### What Claude Code actually needs

From `settings-permissions.md`:

- `$schema` reference for editor validation (implied by schema store reference on line 4).
- `permissions` field (`allow`/`ask`/`deny` arrays + `defaultMode`) for pre-approving common Ada tool patterns.
- `env` field for environment variable propagation (e.g., `ADA_PROJECT_DIR: "${CLAUDE_PROJECT_DIR}"`).
- `additionalDirectories` for multi-package monorepo access.
- `mcpServers` in `settings.json` is valid but the canonical per-project location is `.mcp.json` at repo root (settings-permissions.md line 197, mcp-integration.md line 15).
- Hook `timeout` field: default 600s for `command` type (hooks-system.md line 12). Ada's deployed settings.json uses `timeout: 30` — this is dangerously low for compilation invariant checks.
- `PostToolUse` is present but empty (settings.ts line 46). No audit trail.

### The gap

1. **CRITICAL — `mcpServers` declaration is broken.** `settings.ts` line 59–61 produces `"command": "ada mcp"` with `"args": []`. This is wrong: `command` must be the executable name only (`"ada"`), and `"mcp"` must be in `"args"`. The correct form is `{ "command": "ada", "args": ["mcp"] }`. As written, Claude Code will attempt to spawn a process named `"ada mcp"` (with the space), which will fail on all platforms. Confirmed in the live `.claude/settings.json` at line 29.

2. **HIGH — No `.mcp.json` file is written.** The canonical per-project MCP configuration location is `.mcp.json` at the repo root (mcp-integration.md line 15, settings-permissions.md lines 196–200). Ada writes MCP config only into `.claude/settings.json`. Projects that share the repo with teammates need `.mcp.json` to be team-shared. Ada's `writeConfigGraph()` in writer.ts (lines 84–88) does not write `.mcp.json`.

3. **HIGH — Hook timeout of 30s is too low.** The live `.claude/settings.json` has `"timeout": 30`. The default for `command` hooks is 600s (hooks-system.md line 12). Ada's pre-tool hooks run invariant checks; a slow machine or a complex grep could exceed 30s and silently proceed (timeout = non-blocking error per hooks-system.md line 191). Should be at minimum 60s, ideally removed to use the 600s default.

4. **HIGH — `PostToolUse` is empty — no audit trail.** Ada currently has zero PostToolUse hooks (settings.ts line 46, confirmed in live settings.json line 15). The research file hooks-system.md lines 252–253 identifies this as a missed capability: "Ada has no visibility into what Claude Code does after ACCEPT. A PostToolUse hook writing tool calls + results to `.ada/session-log.jsonl` would feed Ada's drift detection." An audit PostToolUse hook should write every Write/Edit/Bash tool result to a session log.

5. **MEDIUM — No `permissions` field.** Ada does not pre-approve any tool patterns. Every new session will prompt the user before Claude Code can run `pnpm`, `tsc`, etc. Pre-approving `Bash(pnpm *)`, `Bash(tsc *)`, and `mcp__ada__*` would eliminate friction on every session start.

6. **MEDIUM — No `env` field.** `ADA_PROJECT_DIR` is not propagated via settings. The MCP server resolves project dir via `process.env.ADA_PROJECT_DIR` (state.ts line 27) with cwd fallback. Setting `"env": { "ADA_PROJECT_DIR": "${CLAUDE_PROJECT_DIR}" }` in settings.json ensures the server always finds the right project without relying on the cwd fallback.

7. **LOW — `largeContextModel` field is not in Claude Code's schema.** The `largeContextModel` field (settings.ts line 63) is not documented in Claude Code's settings schema (settings-permissions.md lines 26–43). It will be silently ignored. This is an Ada-internal concept leaking into the deployed config.

8. **LOW — No `$schema` field.** Editor validation requires a `$schema` pointer to `json.schemastore.org/claude-code-settings.json`.

**Priority: CRITICAL** (broken mcpServers command), **HIGH** (missing .mcp.json, timeout, PostToolUse)

---

## Artifact 4: Hook Scripts (hooks/pre-tool/\*.sh)

### What Ada currently produces

Source: `packages/config-writer/src/hooks.ts`

Ada generates one bash script per entity invariant via `invariantsToHooks()`. Each script:

1. Reads stdin as JSON via `INPUT=$(cat)`
2. Extracts `tool_input.content // tool_input.new_string // tool_input.command` via jq (line 67)
3. Applies one of three enforcement strategies: `grep-block` (exit 2 if pattern found), `grep-require` (exit 2 if pattern absent), `comment-only` (exit 0, no enforcement)
4. Matcher is set to `"Bash|Write|Edit"` for block patterns, `"Write|Edit"` for require patterns, `"Bash"` for comment-only (hooks.ts lines 119–124)

Hooks are individual per-invariant scripts, each registered separately in PreToolUse. The live settings.json uses a dispatcher (`hooks/pre-tool-dispatch.sh`) instead of individual registrations — this is a discrepancy: `buildSettings()` registers individual scripts, but the deployed settings uses a dispatcher.

### What Claude Code actually needs

From `hooks-system.md`:

- **Exit code 2** blocks the action; stderr shown to Claude as feedback (line 90). Ada uses this correctly.
- **`updatedInput` in structured JSON output** allows hooks to transform tool inputs rather than just blocking (lines 113–129). Ada uses only block/allow.
- **`PostToolUse` cannot undo** a completed action (line 201). Ada correctly uses PreToolUse for enforcement.
- **~250 sequential hooks per Bash call adds latency** (line 259). Research notes: "Consider batching all invariant checks into one dispatcher that runs them in parallel."
- **String matching is heuristic, not semantic** (line 261). A Bash command that violates an invariant without matching the expected grep pattern bypasses the hook. This is documented as a known limitation.
- **`SessionStart` stdout injection** (line 101): plain text stdout from SessionStart hooks is injected into Claude's context. Ada uses this for the session-start.sh echo output.
- **Hook scripts run in non-interactive shell** (line 170). `~/.bashrc` echoes that aren't guarded by `[[ $- == *i* ]]` will corrupt JSON parsing.
- **`PreCompact` hook** exists but Ada does not use it (hooks-system.md line 255): Ada could re-inject critical context before compaction summarizes it away.

### The gap

1. **HIGH — Generator/deployed artifact discrepancy.** `buildSettings()` in settings.ts registers each hook script individually. The live `.claude/settings.json` uses `hooks/pre-tool-dispatch.sh` as a single dispatcher. These are two different architectures. The generator produces one settings structure; the deployed file is another. It's unclear which is canonical. Either the generator needs to emit the dispatcher pattern, or the live settings.json needs to match what the generator produces.

2. **HIGH — `updatedInput` never used.** Hooks only block or allow. For cases where a tool call can be corrected (e.g., redirecting a `grep` to `rg`, or rewriting a command that would violate a path invariant to one that won't), `updatedInput` would improve ergonomics significantly over rejecting the action. hooks.ts has no path to emit structured JSON output.

3. **MEDIUM — No `PreCompact` hook.** When context compaction fires, hook-enforced invariants survive (they're outside the context window), but any session-injected context from SessionStart is lost. A `PreCompact` hook that re-writes a summary checkpoint to a file — and a corresponding `PostCompact` that re-injects it via SessionStart-style stdout — would make the session more robust across compaction events.

4. **MEDIUM — `comment-only` strategy produces hooks that always exit 0.** hooks.ts line 70: predicates that don't match block or require patterns produce a script that exits 0 with a comment "Manual review required." These scripts are still registered in settings.json and called on every tool use. They add latency with zero enforcement value. Comment-only predicates should either be omitted from hook generation entirely or batched into a single no-op.

5. **LOW — No guard for interactive shell echoes.** The session-start.sh script in writer.ts (lines 68–76) uses bare `echo` statements. If `~/.bashrc` also has bare echoes, the hooks-system.md line 178 warns this breaks JSON parsing. The session-start.sh should guard its output, though since it is expected to emit text (for context injection) this is lower risk than the invariant scripts.

**Priority: HIGH** (generator/deployed discrepancy, updatedInput unused)

---

## Artifact 5: .mcp.json

### What Ada currently produces

Ada does **not** generate a `.mcp.json` file. Confirmed: `Glob("**/.mcp.json")` returns no results. The MCP server is configured only via `.claude/settings.json` `mcpServers` key, and that entry has a broken `command` field (see settings.json gap 1 above).

### What Claude Code actually needs

From `mcp-integration.md` line 15 and `settings-permissions.md` line 197:

- `.mcp.json` at the **repo root** is the canonical per-project, version-controlled location for MCP server config.
- `.claude/settings.json` `mcpServers` works but is the secondary location.
- Format: `{ "mcpServers": { "ada": { "type": "stdio", "command": "ada", "args": ["mcp"], "env": { "ADA_PROJECT_DIR": "${CLAUDE_PROJECT_DIR:-}" } } } }`
- `type: "stdio"` field should be explicit (mcp-integration.md line 23).
- `env` object should pass `ADA_PROJECT_DIR` using `${CLAUDE_PROJECT_DIR:-}` expansion so the MCP server always finds the correct project root.
- The server `instructions` field (mcp-integration.md line 241): "servers can declare an `instructions` field that Claude reads to understand how to use the tools. Currently Ada's server doesn't use this."

### The gap

1. **CRITICAL — `.mcp.json` is never written.** `writeConfigGraph()` in writer.ts writes CLAUDE.md, agents, skills, hooks, and settings.json — but no `.mcp.json`. Without this file, the MCP server is not configured for new team members or anyone who clones the repo. The MCP tools (`ada.query_constraints`, `ada.check_drift`) referenced in CLAUDE.md's `## Ada MCP` section will be unavailable.

2. **HIGH — No server `instructions` field in the MCP server declaration.** The MCP spec and Claude Code both support a server-level `instructions` string. Ada's `server.ts` passes `{ capabilities: { tools: {} } }` with no instructions (line 21). Adding: `"instructions": "Ada semantic compiler tools. Call ada.query_constraints(scope) before modifying any entity. Call ada.check_drift(description) before implementing any significant change."` would guide Claude to use these tools proactively without relying on CLAUDE.md directives.

**Priority: CRITICAL** (.mcp.json not written)

---

## Artifact 6: MCP Server Tools

### What Ada currently produces

Source: `packages/mcp-server/src/server.ts`

Ada exposes 9 tools: `ada.get_blueprint`, `ada.get_invariants`, `ada.verify`, `ada.get_workflow`, `ada.log_drift`, `ada.propose_agent`, `ada.query_constraints`, `ada.check_drift`, `ada.get_world_model`.

Error handling: all tools return `{ content: [{ type: "text", text: r.content }], isError: r.isError }` — using the correct `isError` pattern (server.ts lines 152–235).

Project dir resolution (state.ts lines 26–32): `ADA_PROJECT_DIR` → `ADA_STATE_PATH` dirname → `cwd()`. This is correct for Claude Code sessions where the server is spawned from the project root.

Tool descriptions: generally precise and actionable. `ada.query_constraints` (line 99) and `ada.check_drift` (line 115) have the most complete descriptions including when to use them.

### What Claude Code actually needs

From `mcp-integration.md`:

- `isError: true` for business logic errors, not JSON-RPC errors (line 210). Ada does this correctly.
- Tool descriptions should be short and precise — each adds to session token cost (line 265). Ada's descriptions are appropriate length.
- **Tool Search** (line 195): if session has >10% context in tools, Claude Code switches to on-demand search. Ada's CLAUDE.md should tell Claude to call Ada tools by name, not wait for discovery.
- `listChanged` capability allows mid-session tool list updates (line 101). Ada declares `{ capabilities: { tools: {} } }` — this does not declare `listChanged`. If Ada adds tools mid-run, client won't re-fetch.
- Tool name format: `{server-name}.{tool-name}` (line 157). Ada uses this correctly (`ada.get_blueprint` etc).
- `CLAUDE_PROJECT_DIR` env var (line 261): Ada reads `ADA_PROJECT_DIR`, not `CLAUDE_PROJECT_DIR`. Claude Code sets `CLAUDE_PROJECT_DIR` automatically. Ada's fallback chain (`ADA_PROJECT_DIR` → `ADA_STATE_PATH` → cwd) never reads `CLAUDE_PROJECT_DIR` directly.

### The gap

1. **HIGH — `CLAUDE_PROJECT_DIR` not in fallback chain.** Claude Code sets `$CLAUDE_PROJECT_DIR` for all child processes including MCP servers (settings-permissions.md line 215). Ada's state.ts line 27 checks `ADA_PROJECT_DIR` and `ADA_STATE_PATH` but not `CLAUDE_PROJECT_DIR`. If neither Ada-specific var is set (e.g., a fresh clone where user hasn't configured env), the server falls back to `cwd()` which may be wrong in non-standard launch contexts. The fallback chain should be: `ADA_PROJECT_DIR` → `ADA_STATE_PATH` dirname → `CLAUDE_PROJECT_DIR` → `cwd()`.

2. **MEDIUM — No server `instructions` declared.** MCP servers can declare an `instructions` string in their initialization response. Ada's server declares `{ capabilities: { tools: {} } }` with no instructions (server.ts line 21). Adding instructions at the server level means Claude receives guidance on when to use Ada tools even before reading CLAUDE.md, reducing reliance on CLAUDE.md size budget.

3. **MEDIUM — `ada.propose_agent` tool writes to the codebase.** Tool writes a new agent `.md` to `.claude/agents/`. This is a write operation on a file Claude Code itself reads. Side effects on agent files during a live session could cause unexpected behavior if Claude Code re-reads agents mid-session. This tool's risk profile is higher than the other tools. [UNVERIFIED whether Claude Code re-reads agent files mid-session — if it doesn't, risk is lower.]

4. **LOW — `ada.log_drift` has no feedback loop.** The tool logs semantic drift to provenance store (server.ts line 64) but the logged drift is not surfaced back to Claude in a form that changes behavior. The drift record goes to `.ada/` but nothing uses it to block or warn about future actions. A PostToolUse hook that reads the drift log and injects a warning on the next tool call would close the loop.

5. **LOW — `ada.get_blueprint` has no `scope` parameter.** Tool returns the full active blueprint with no filtering. For large projects, this could approach or exceed the 25,000 token MCP output limit (mcp-integration.md line 192). `ada.query_constraints` with a scope parameter is the correct narrow tool — CLAUDE.md should direct Claude to prefer `query_constraints` over `get_blueprint`.

**Priority: HIGH** (CLAUDE_PROJECT_DIR fallback missing)

---

## Consolidated Priority Table

| Priority | Gap                                                                                                     | File to Change                                                                    | Estimated Complexity                                                      |
| -------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| CRITICAL | CLAUDE.md exceeds 200-line budget (currently 355 lines)                                                 | `packages/config-writer/src/claude-md.ts`                                         | Medium — requires splitting component blocks into @ imports or truncating |
| CRITICAL | `mcpServers.command` is `"ada mcp"` (with space) — must be `command: "ada", args: ["mcp"]`              | `packages/config-writer/src/settings.ts` line 59                                  | Low — one-line fix                                                        |
| CRITICAL | `.mcp.json` never written — MCP server not configured for new clones                                    | `packages/config-writer/src/writer.ts`                                            | Low — add one write call in `writeConfigGraph()`                          |
| HIGH     | No `.mcp.json` at repo root (team-shared canonical location)                                            | `packages/config-writer/src/writer.ts`                                            | Low — write `.mcp.json` with correct `type: "stdio"` and env              |
| HIGH     | Hook timeout is 30s; default is 600s; 30s causes silent bypass on slow machines                         | `.claude/settings.json` (live) + `packages/config-writer/src/settings.ts`         | Low — remove or raise timeout field                                       |
| HIGH     | `PostToolUse` is empty — no audit trail for what Claude Code does after ACCEPT                          | `packages/config-writer/src/settings.ts` + new hook script                        | Medium — write audit hook script; register in settings                    |
| HIGH     | Agent description field doesn't follow routing-signal template (no TRIGGER, CONSTRAINT)                 | `packages/config-writer/src/agents.ts` line 181                                   | Low — rewrite description template                                        |
| HIGH     | `status: GHOST` written to agent frontmatter — Ada governance bleeds into deployed artifact             | `packages/config-writer/src/agents.ts` lines 178–187                              | Low — remove `status` field from frontmatter                              |
| HIGH     | Generator/deployed discrepancy: `buildSettings()` emits per-script hooks; live settings uses dispatcher | `packages/config-writer/src/settings.ts` + `packages/config-writer/src/writer.ts` | Medium — align generator to emit dispatcher pattern                       |
| HIGH     | `updatedInput` never used in hooks — blocks instead of correcting fixable tool calls                    | `packages/config-writer/src/hooks.ts`                                             | Medium — add structured JSON output path for correctable predicates       |
| HIGH     | No server `instructions` in MCP server init — Claude doesn't get server-level guidance                  | `packages/mcp-server/src/server.ts` line 21                                       | Low — add `instructions` string to server capabilities                    |
| HIGH     | `CLAUDE_PROJECT_DIR` not in MCP server fallback chain — may resolve wrong dir in non-standard launches  | `packages/mcp-server/src/state.ts` line 27                                        | Low — insert `CLAUDE_PROJECT_DIR` as third fallback                       |
| MEDIUM   | No `maxTurns` on agent frontmatter — agents can run indefinitely                                        | `packages/config-writer/src/agents.ts`                                            | Low — add `maxTurns` field per agent role                                 |
| MEDIUM   | No `effort` field on high-stakes agents (governor, verify)                                              | `packages/config-writer/src/agents.ts`                                            | Low — set `effort: max` on governor/verify agents                         |
| MEDIUM   | No `skills` field in agent frontmatter — generated skill files not injected into agents                 | `packages/config-writer/src/agents.ts`                                            | Low-Medium — map workflow names to agent skill paths                      |
| MEDIUM   | No `permissions` allow-rules in settings.json — every session prompts for pnpm, tsc, etc.               | `packages/config-writer/src/settings.ts`                                          | Low — add permissions.allow array with common patterns                    |
| MEDIUM   | No `env` field in settings.json — `ADA_PROJECT_DIR` not set from `CLAUDE_PROJECT_DIR`                   | `packages/config-writer/src/settings.ts`                                          | Low — add env field                                                       |
| MEDIUM   | `comment-only` hooks are registered but always exit 0 — latency with no enforcement                     | `packages/config-writer/src/hooks.ts`                                             | Low — skip registering comment-only hooks                                 |
| MEDIUM   | No `PreCompact` hook — session context lost on compaction, no checkpoint written                        | `packages/config-writer/src/settings.ts` + new hook script                        | Medium — add PreCompact hook that writes checkpoint                       |
| MEDIUM   | No server `instructions` forces CLAUDE.md to carry Ada tool usage guidance (increases CLAUDE.md size)   | `packages/mcp-server/src/server.ts`                                               | Low — add instructions to server init                                     |
| LOW      | `largeContextModel` field not in Claude Code schema — silently ignored                                  | `packages/config-writer/src/settings.ts` line 63                                  | Low — remove field                                                        |
| LOW      | No `$schema` field in settings.json — no editor validation                                              | `packages/config-writer/src/settings.ts`                                          | Low — add schema pointer                                                  |
| LOW      | Ada-internal `## Status: GHOST` header read as Claude directive                                         | `packages/config-writer/src/claude-md.ts` line 22                                 | Low — remove or move to Ada's internal state                              |
| LOW      | `ada.get_blueprint` returns full blueprint with no scope — risks token limit on large projects          | `packages/mcp-server/src/server.ts`                                               | Medium — add optional scope parameter                                     |
| LOW      | No `isolation: worktree` for read-only agents (verify, audit)                                           | `packages/config-writer/src/agents.ts`                                            | Low — add `isolation: worktree` to read-only agent types                  |
