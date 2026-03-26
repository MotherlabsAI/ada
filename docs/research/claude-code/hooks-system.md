# Claude Code — Hooks System

**Researched:** 2026-03-24
**Sources:** code.claude.com/docs/en/hooks-guide.md, code.claude.com/docs/en/hooks.md, code.claude.com/docs/en/settings.md, Ada codebase: `.claude/settings.json`, `hooks/pre-tool-dispatch.sh`

---

## Hook Types [CONFIRMED]

| Type      | Use Case                               | Timeout default |
| --------- | -------------------------------------- | --------------- |
| `command` | Shell script                           | 600s            |
| `http`    | POST to HTTP endpoint                  | 30s             |
| `prompt`  | Single-turn LLM decision (Haiku)       | 30s             |
| `agent`   | Multi-turn agent with full tool access | 60s             |

All types support a `timeout` field to override defaults.

---

## Hook Events [CONFIRMED]

| Event                | When it fires                     | Matcher field matches on                                |
| -------------------- | --------------------------------- | ------------------------------------------------------- |
| `PreToolUse`         | Before any tool executes          | Tool name (regex)                                       |
| `PostToolUse`        | After tool completes              | Tool name (regex)                                       |
| `PermissionRequest`  | When Claude requests a permission | Tool name (regex)                                       |
| `SessionStart`       | Session begins or resumes         | Session source: `startup`, `resume`, `clear`, `compact` |
| `SessionEnd`         | Session ends                      | End reason: `clear`, `resume`, `logout`                 |
| `Stop`               | Claude stops a turn               | (no matcher)                                            |
| `Notification`       | UI notification                   | Notification type                                       |
| `PreCompact`         | Before context compaction         | Trigger: `manual`, `auto`                               |
| `PostCompact`        | After context compaction          | Trigger: `manual`, `auto`                               |
| `UserPromptSubmit`   | User submits a prompt             | (no matcher)                                            |
| `SubagentStart`      | Agent invoked                     | Agent type                                              |
| `SubagentStop`       | Agent completes                   | Agent type                                              |
| `ConfigChange`       | Settings file changes             | Config source                                           |
| `InstructionsLoaded` | CLAUDE.md or memory loaded        | Load reason                                             |

---

## stdin Format [CONFIRMED]

All hooks receive JSON on stdin. Common fields present in all events:

```json
{
  "session_id": "uuid-of-current-session",
  "transcript_path": "~/.claude/projects/.../sessions/uuid.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

**PreToolUse / PostToolUse additional fields:**

```json
{
  "tool_name": "Bash",
  "tool_use_id": "toolu_...",
  "tool_input": { "command": "git status" }
}
```

**PostToolUse additional fields:**

```json
{
  "tool_response": { "output": "...", "exit_code": 0 }
}
```

**SessionStart additional fields:**

```json
{
  "session_source": "startup" | "resume" | "clear" | "compact"
}
```

Parse with: `jq`, Python `json.loads(sys.stdin.read())`, or any JSON parser.

---

## Exit Code Semantics [CONFIRMED]

| Code  | Meaning            | Effect                                                                                                                          |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Success            | Action proceeds. stdout parsed as JSON if valid. For SessionStart/UserPromptSubmit, text stdout injected into Claude's context. |
| 2     | Block              | Action blocked. stderr shown to Claude as feedback. Claude can self-correct.                                                    |
| Other | Non-blocking error | Action proceeds. stderr logged in verbose mode only.                                                                            |

---

## stdout / stderr Handling [CONFIRMED]

**stdout (exit 0 only):**

- Parsed as JSON for structured hook decisions
- For `SessionStart` and `UserPromptSubmit`: plain text stdout is **injected into Claude's context** as additional information

**stderr:**

- Exit 2: shown to Claude as the block reason
- Exit 1+: logged in verbose mode only, not shown to Claude

**Hooks cannot call tools directly.** They can only: allow/deny/modify tool inputs/provide text context.

---

## Structured JSON Output [CONFIRMED]

Exit 0 with JSON stdout enables structured decisions:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow" | "deny" | "ask",
    "permissionDecisionReason": "Use rg instead of grep",
    "updatedInput": {
      "command": "rg --color=never pattern ."
    }
  }
}
```

**`updatedInput`** — rewrites the tool's input before execution. Hooks can **correct tool calls**, not just block them. This is currently unused in Ada's hooks.

**PermissionRequest structured output:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedPermissions": [
        { "type": "setMode", "mode": "acceptEdits", "destination": "session" }
      ]
    }
  }
}
```

---

## Matcher Syntax [CONFIRMED]

Matchers are **case-sensitive regex strings**. Empty string matches all events.

```json
"matcher": "Bash"                    // exact tool name
"matcher": "Edit|Write"              // pipe = OR
"matcher": "mcp__ada__.*"            // regex wildcard for MCP tools
"matcher": "Bash|Edit|Write|Glob"    // multiple tools
```

**Different events match on different fields:**

- `PreToolUse` / `PostToolUse` → tool name (`Bash`, `Edit`, `mcp__ada__get_blueprint`)
- `SessionStart` → session source (`startup`, `resume`, `compact`)
- `PreCompact` → trigger type (`manual`, `auto`)

---

## Execution Environment [CONFIRMED]

- **Shell:** Non-interactive (sources ~/.bashrc / ~/.zshrc but won't get interactive-only config)
- **Working directory:** Available via `cwd` in stdin JSON; hook process itself runs from Claude Code's cwd
- **Environment variables available to hooks:**
  - `$CLAUDE_PROJECT_DIR` — project root
  - `$CLAUDE_PLUGIN_ROOT` — plugin root (for plugin hooks)
  - `$CLAUDE_ENV_FILE` — file to write `export VAR=val` lines during SessionStart (they persist in session)
  - `$CLAUDE_CODE_REMOTE` — whether running remotely

**Critical:** Unconditional `echo` in `~/.bashrc` or `~/.zshrc` breaks JSON parsing. Guard with:

```bash
if [[ $- == *i* ]]; then
  echo "interactive message"
fi
```

---

## Timeout Behavior [CONFIRMED]

On timeout: treated as non-blocking error. Action proceeds. stderr logged. Does NOT block.

Override per hook:

```json
{ "type": "command", "command": "script.sh", "timeout": 30 }
```

---

## PostToolUse Limitations [CONFIRMED]

PostToolUse **cannot undo** a tool call — the tool has already executed. Exit code 2 does NOT block retroactively.

PostToolUse can: post-process, format, lint, log, trigger side effects, write audit records.

Use `PreToolUse` for enforcement. Use `PostToolUse` for observability and cleanup.

---

## Ada's Current Hook Architecture

Ada generates approximately 250 hooks per compilation. Structure:

**PreToolUse (all Bash commands):**

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "hooks/pre-tool-dispatch.sh"
        }
      ]
    }
  ]
}
```

**Dispatcher:** Checks `ADA_PIPELINE_RUN_ID` env var. If set, runs all invariant scripts sequentially. If unset, exits 0 (silent during normal Claude Code use).

**Individual invariant scripts** (`hooks/pre-tool/`): ~250 bash scripts, each enforcing one entity predicate by pattern-matching against `tool_input.command`.

**SessionStart:** Writes Ada project context to stdout (injected into Claude's context at session start).

---

## Gaps

- Whether hooks defined in agent frontmatter (`hooks` field) interact with project-level hooks [UNVERIFIED]
- Whether `PostCompact` can inject context back after compaction [CONFIRMED the hook fires; injection via stdout depends on event type]
- Exact behavior of `InstructionsLoaded` hook for CLAUDE.md [UNVERIFIED]
- Whether multiple hooks in one event array are independent or sequential (order matters?) [INFERRED: sequential]

---

## Implications for Ada

1. **`updatedInput` is unused by Ada** — hooks currently only allow/deny. For correction-over-rejection (e.g., rewriting a `grep` to `rg`), hooks can transform the command. High value for ergonomics.

2. **`PostToolUse` audit trail is missing** — Ada has no visibility into what Claude Code does after ACCEPT. A PostToolUse hook writing tool calls + results to `.ada/session-log.jsonl` would feed Ada's drift detection without requiring session JSONL access.

3. **`PreCompact` hook is unused** — Ada could hook into compaction to write a summary or re-inject critical context instructions before they get summarized away. Use `updatedInput` or stdout context injection.

4. **`SessionStart` with `session_source: "resume"` filter** — Ada's current SessionStart hook fires on every session source. A resume-specific hook could re-inject different context (e.g., "continuing from where we left off, last checkpoint: X").

5. **~250 sequential hooks per Bash call adds latency** — on Ada's compilation pipeline this is intentional (correctness over speed). For the deployed developer session, this may be too slow. Consider batching all invariant checks into one dispatcher that runs them in parallel.

6. **Hooks effectiveness is `[HEURISTIC]`** — Ada's hooks use bash pattern matching against `tool_input.command`. This is not semantic enforcement — it's string matching. A Bash command that renames a file without using the expected command pattern bypasses the hook. This is documented in STATE.md as the known limitation.
