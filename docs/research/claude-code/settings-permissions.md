# Claude Code — Settings & Permissions

**Researched:** 2026-03-24
**Sources:** code.claude.com/docs/en/settings, code.claude.com/docs/en/permissions, code.claude.com/docs/en/hooks-guide, code.claude.com/docs/en/mcp, json.schemastore.org/claude-code-settings.json

---

## File Locations & Hierarchy [CONFIRMED]

| Scope   | Location                                                                | Shared?  | Committed?      |
| ------- | ----------------------------------------------------------------------- | -------- | --------------- |
| Managed | `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS) | Org-wide | N/A             |
| User    | `~/.claude/settings.json`                                               | No       | N/A             |
| Project | `.claude/settings.json`                                                 | Team     | Yes             |
| Local   | `.claude/settings.local.json`                                           | No       | No (gitignored) |

**Precedence (highest → lowest):** Managed > CLI flags > Local > Project > User

**Array merge behavior:** Array fields from multiple scopes are **concatenated and deduplicated** — not replaced. Deny rules at any level take precedence over allow rules at any other level.

Claude Code auto-adds `.claude/settings.local.json` to git ignore rules on creation.

---

## Core settings.json Fields [CONFIRMED]

| Field                    | Type     | Purpose                                                   |
| ------------------------ | -------- | --------------------------------------------------------- |
| `permissions`            | object   | allow/ask/deny arrays + defaultMode                       |
| `hooks`                  | object   | hook configurations by event type                         |
| `env`                    | object   | environment variables for all sessions                    |
| `model`                  | string   | override default model                                    |
| `mcpServers`             | object   | MCP server configurations                                 |
| `effortLevel`            | string   | persist effort level (low/medium/high)                    |
| `additionalDirectories`  | string[] | additional working directories                            |
| `agent`                  | string   | run main thread as named subagent                         |
| `autoMemoryDirectory`    | string   | custom memory storage location (user/local only)          |
| `cleanupPeriodDays`      | number   | delete inactive sessions after N days (default: 30)       |
| `disableAllHooks`        | boolean  | disable all hooks                                         |
| `includeGitInstructions` | boolean  | include built-in git workflow (default: true)             |
| `language`               | string   | preferred response language                               |
| `respectGitignore`       | boolean  | exclude .gitignore patterns from @ picker (default: true) |

**Managed-only fields** (ignored in project/user/local settings):
`disableBypassPermissionsMode`, `allowManagedPermissionRulesOnly`, `allowManagedHooksOnly`, `allowManagedMcpServersOnly`, `allowedMcpServers`, `deniedMcpServers`

**Not valid in project settings:** `autoMemoryDirectory` (security: prevents repos from redirecting memory writes to sensitive paths)

---

## Permissions Object [CONFIRMED]

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Read(./.env)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Bash(curl *)", "Read(./secrets/**)"],
    "defaultMode": "default"
  }
}
```

**Evaluation order:** deny → ask → allow. First match wins.

### Tool Specifier Syntax [CONFIRMED]

**Bash:**

- `Bash` — all commands
- `Bash(npm run build)` — exact match
- `Bash(npm run *)` — wildcard (word boundary)
- `Bash(git * main)` — mid-string wildcard

**Read/Edit:**

- `Read(./.env)` — relative to cwd
- `Read(/path/to/file)` — relative to project root
- `Read(~/path)` — relative to home
- `Read(path/**)` — recursive glob

**WebFetch:**

- `WebFetch(domain:example.com)` — domain scope

**MCP:**

- `mcp__servername` — all tools from server
- `mcp__servername__toolname` — specific tool

**Agent:**

- `Agent(Explore)` — specific subagent type

### Permission Modes [CONFIRMED]

| Mode                | Behavior                                                        |
| ------------------- | --------------------------------------------------------------- |
| `default`           | Prompt on first use of each tool                                |
| `acceptEdits`       | Auto-accept file edit permissions                               |
| `plan`              | Read-only — no modifications or commands                        |
| `dontAsk`           | Auto-deny unless pre-approved                                   |
| `bypassPermissions` | Skip all prompts (except `.git`, `.claude`, `.vscode`, `.idea`) |

---

## Hooks Declaration [CONFIRMED]

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "hooks/pre-tool-dispatch.sh",
            "timeout": 600
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "hooks/session-start.sh"
          }
        ]
      }
    ]
  }
}
```

### All Hook Events [CONFIRMED]

`PreToolUse`, `PostToolUse`, `PermissionRequest`, `SessionStart`, `SessionEnd`, `Stop`, `Notification`, `ConfigChange`, `SubagentStart`, `SubagentStop`, `PostToolUseFailure`, `PreCompact`, `PostCompact`, `InstructionsLoaded`, `UserPromptSubmit`

### Hook Types [CONFIRMED]

| Type      | Use Case                    | Timeout |
| --------- | --------------------------- | ------- |
| `command` | Shell script                | 600s    |
| `http`    | POST to endpoint            | 30s     |
| `prompt`  | Single-turn LLM decision    | 30s     |
| `agent`   | Multi-turn agent with tools | 60s     |

### Exit Codes [CONFIRMED]

- **0** — action proceeds; JSON stdout is parsed for structured decisions
- **2** — action blocked; stderr is shown to Claude as feedback
- **other** — non-blocking error; stderr logged in verbose mode only

### Structured JSON Output (exit 0) [CONFIRMED]

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow" | "deny" | "ask",
    "permissionDecisionReason": "Use rg not grep",
    "updatedInput": { "modified": "tool input" }
  }
}
```

`updatedInput` allows hooks to **transform tool arguments** before execution.

---

## MCP Server Declaration [CONFIRMED]

### In settings.json (`mcpServers` field)

```json
{
  "mcpServers": {
    "ada": {
      "command": "ada",
      "args": ["mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

### Scope choices

- **User** (`~/.claude.json`) — personal tools, cross-project
- **Project** (`.mcp.json` at repo root) — team-shared, version-controlled
- **Local** (`~/.claude.json` per-project) — private per-project

### Precedence: Local > Project > User

---

## Environment Variables [CONFIRMED]

```json
{
  "env": {
    "DEBUG": "1",
    "ADA_PROJECT_DIR": "${CLAUDE_PROJECT_DIR}"
  }
}
```

Special vars Claude Code provides to hooks:

- `$CLAUDE_PROJECT_DIR` — project root directory
- `$CLAUDE_PLUGIN_ROOT` — plugin root (for plugin hooks)
- `$CLAUDE_ENV_FILE` — file to write env exports during SessionStart
- `$CLAUDE_CODE_REMOTE` — whether running remotely

---

## Gaps

- Exact behavior when same MCP server defined at multiple scopes [INFERRED: highest scope wins]
- Whether hooks can be defined at managed level [UNVERIFIED]
- Max size limits for settings files [UNVERIFIED]
- `timeout` field for individual MCP server entries not confirmed in official schema [UNVERIFIED]

---

## Implications for Ada

1. **Ada's settings.json is currently incomplete.** It wires hooks and session-start but is missing:
   - `$schema` reference (editor validation)
   - `mcpServers` declaration for `ada mcp` (requires user to add manually)
   - Permission allow-rules for Ada-specific patterns (e.g., always allow `ada verify`)

2. **`updatedInput` hook output is unused by Ada.** Hooks can rewrite tool arguments before execution — Ada's invariant hooks only block or allow, never transform. This is a missed optimization for correction rather than rejection.

3. **`PreCompact` and `PostCompact` hooks exist.** Ada could hook into compaction to re-inject critical context after compaction clears it. Currently unused.

4. **`PostToolUse` hooks could build an audit trail.** Ada currently has no record of what Claude Code does after ACCEPT. A PostToolUse hook writing to a log file would feed the drift detection loop.

5. **Ada should generate `mcpServers` in its output.** Currently the user must manually add `ada mcp` to their settings. Ada's ACCEPT flow should write `.mcp.json` at the project root so the MCP server is auto-configured.
