# Claude Code — Agent Files Model

**Researched:** 2026-03-24
**Sources:** code.claude.com/docs/en/sub-agents.md, code.claude.com/docs/en/hooks-guide.md, code.claude.com/docs/en/permissions.md, code.claude.com/docs/en/memory.md, Ada's 78 active agent files examined directly

---

## Frontmatter Schema [CONFIRMED]

Agent files use YAML frontmatter (`---` delimiters) followed by Markdown body. All fields are flat key-value except `tools` (array).

| Field             | Required | Type         | Notes                                                                     |
| ----------------- | -------- | ------------ | ------------------------------------------------------------------------- |
| `name`            | YES      | string       | Lowercase + hyphens only. Must match filename (without .md).              |
| `description`     | YES      | string       | Claude's routing signal for automatic delegation. ~50–150 chars.          |
| `model`           | NO       | string       | `sonnet`, `opus`, `haiku`, full ID, or `inherit` (default).               |
| `tools`           | NO       | string[]     | Allowlist. If omitted, inherits all parent tools.                         |
| `disallowedTools` | NO       | string[]     | Denylist. Removes from inherited set.                                     |
| `permissionMode`  | NO       | string       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`.         |
| `maxTurns`        | NO       | integer      | Hard limit on agentic turns before agent stops.                           |
| `skills`          | NO       | string[]     | Skill content is fully injected into agent context at startup (not lazy). |
| `mcpServers`      | NO       | object/array | Inline definitions or references to configured servers.                   |
| `hooks`           | NO       | object       | Hook definitions scoped to this agent. Blocked in plugin agents.          |
| `memory`          | NO       | string       | `user`, `project`, or `local`. Persistent across sessions.                |
| `background`      | NO       | boolean      | If true, always runs in background.                                       |
| `effort`          | NO       | string       | `low`, `medium`, `high`, `max` (Opus 4.6 only).                           |
| `isolation`       | NO       | string       | `worktree` — runs in isolated git worktree.                               |
| `status`          | Ada-only | string       | `GHOST`, `DRAFT`, `SHAPED`, `ACCEPTED`. Not recognized by Claude Code.    |

---

## Invocation Mechanism [CONFIRMED]

**Four ways to invoke an agent, in order of reliability:**

1. **@-mention** (guaranteed) — `@agent-<name>` in the prompt; forces delegation
2. **CLI flag** — `claude --agent <name>` makes agent the session default
3. **Natural language** — "Have the code-reviewer agent look at this" — likely but not guaranteed
4. **Automatic semantic matching** — Claude matches task description against agent `description` field; most unreliable

There is NO programmatic `invoke_agent("name")` API. All routing is implicit except @-mention and CLI flag.

---

## Description Field — Routing Signal [CONFIRMED]

The `description` field is Claude's **sole automatic routing signal**. It determines when Claude delegates without being explicitly told.

**Template for effective descriptions:**

```
{Trigger condition}. {What the agent owns}. {What it does NOT do}.
```

**Three required components:**

1. **TRIGGER** — "Use when {specific event, file path, or code concern}"
2. **DOMAIN** — the bounded context or system concern
3. **CONSTRAINT** — "Owns X, not Y" or "Read-only — never modifies"

**Findings from Ada's 78 agents:** Ada agents are too specialized for automatic delegation via description. They require explicit @-mention or `--agent` flag. This is architecturally correct — Ada agents own tightly scoped bounded contexts, not general task categories.

---

## Context Isolation [CONFIRMED]

Each agent runs in its **own context window**, completely separate from the parent session:

```
Parent Session:              Agent Subprocess:
┌─────────────────────┐      ┌─────────────────────┐
│ Full history        │      │ Agent system prompt  │
│ CLAUDE.md           │      │ Task description     │
│ Parent skills       │      │ (Subset of tools)    │
│ Full context        │      │ Fresh state          │
└─────────────────────┘      └─────────────────────┘
```

Agent does NOT receive:

- Full conversation history from main session
- CLAUDE.md context (unless agent reads it via Read tool)
- Parent session's loaded skills (must be listed in agent's `skills` field)
- Parent session's memory

Implication: **Ada's agent bodies must be self-contained.** Agents that rely on "the user knows the context" will fail. Every invariant, every rule the agent must follow must be in its body.

---

## Output Routing [CONFIRMED]

When an agent completes:

1. Agent produces a summary in its own context
2. Summary returned to parent as a message (not full transcript)
3. Parent's context consumes only the summary (~500 tokens), not the full agent work (~20K tokens)
4. Full agent transcript stored at: `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`

---

## Nesting [CONFIRMED — hard limit]

**Agents cannot spawn other agents.** Hard design constraint.

Workaround: parent coordinates sequential agent chains. Parent invokes A, receives result, invokes B with A's result. This is Ada's correct orchestration model.

---

## Tools Field — Allowlist vs Denylist

**Allowlist** (`tools` field): agent gets ONLY listed tools. Parent denials still apply.

**Denylist** (`disallowedTools`): agent inherits all parent tools EXCEPT listed ones.

**Resolution when both present:** disallowedTools applied first, then tools allowlist against remaining set.

**Special syntax:** `Agent(worker, researcher)` restricts which subagents this agent can spawn.

---

## Discovery [CONFIRMED]

| Location            | Priority    | Scope                     |
| ------------------- | ----------- | ------------------------- |
| `--agents` CLI flag | 1 (highest) | Current session only      |
| `.claude/agents/`   | 2           | Current project           |
| `~/.claude/agents/` | 3           | All projects (user-level) |
| Plugin `agents/`    | 4 (lowest)  | Where plugin enabled      |

If agents share same name, higher-priority definition wins. Agents must be flat in `agents/` — subdirectory support unconfirmed.

---

## Plugin Agent Restrictions [CONFIRMED]

Plugin-provided agents CANNOT use: `hooks`, `mcpServers`, or `permissionMode` fields. Workaround: copy plugin agent to `.claude/agents/` to regain these fields.

---

## Memory Field [CONFIRMED]

When `memory: project` (Ada's pattern):

- Agent gets its own persistent memory at `.claude/agent-memory/{name}/`
- Survives across sessions
- System prompt auto-includes read/write memory instructions
- First 200 lines of `MEMORY.md` injected into agent context

This is an unusual pattern. Ada uses it more extensively than typical Claude Code agents.

---

## Gaps

- Exact semantic similarity threshold for automatic delegation — unmeasured
- Subdirectory support in `.claude/agents/subfolder/` — unconfirmed
- Model fallback behavior when specified model unavailable — unconfirmed
- Whether agent isolation boundary allows reading `.claude/settings.json` — untested

---

## Implications for Ada

1. **`status` field is Ada governance only** — Claude Code ignores it. Ada's orchestration layer is the sole enforcer of GHOST/DRAFT/SHAPED transitions.

2. **Ada agents require explicit invocation** — descriptions are too specialized for automatic routing. @-mention or `--agent` flag is the correct pattern. This is by design.

3. **Agent bodies must be self-contained** — agents don't inherit CLAUDE.md or parent context. Ada's current agent bodies (invariants, workflow steps, state machines) are architecturally correct.

4. **Unused fields with high value for Ada:**
   - `maxTurns` — prevents runaway compilation agents
   - `effort` — use `max` for governor/verify agents on Opus
   - `isolation: worktree` — safe for verify-agent and ada-verify (read-only analysis)
   - `memory: project` — already used, but could be more structured

5. **Agent description quality matters for @-mention UX** — even if auto-routing is unlikely, clear descriptions improve the typeahead when the user types `@`. Low-specificity descriptions produce confusing typeahead lists.
