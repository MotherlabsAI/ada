# Claude Code — Session & Memory Model

**Researched:** 2026-03-24
**Sources:** code.claude.com/docs/en/memory.md, code.claude.com/docs/en/how-claude-code-works.md, milvus.io/blog (local storage deep-dive), kentgigger.com (conversation history), stevekinney.com/courses/ai-development (compaction guide), GitHub issues #15776 #27156

---

## MEMORY.md [CONFIRMED]

### Location

Each project gets its own memory directory, keyed to the git repository root:

```
~/.claude/projects/<project-hash>/memory/
├── MEMORY.md          ← index file (first 200 lines loaded at session start)
├── debugging.md       ← topic files (loaded on-demand by Claude)
├── api-conventions.md
└── ...
```

`<project-hash>` is derived from the absolute path to the git root. All worktrees and subdirectories within the same repo share one memory directory.

Outside git: project root is cwd; memory stored relative to that path.

### Loading Behavior [CONFIRMED]

- Only the **first 200 lines of MEMORY.md** are loaded at session start
- Content beyond line 200 is NOT loaded automatically
- Topic files load on-demand — Claude reads them when relevant
- This keeps session start-up overhead low while preserving large knowledge stores

### Auto-Memory [CONFIRMED]

- Claude selectively writes learnings to memory files during sessions
- NOT every session writes to memory — Claude judges what's worth persisting
- Requires Claude Code v2.1.59+
- You can direct it: "Always use pnpm, not npm" → Claude saves to auto memory
- "Add to CLAUDE.md" directs to permanent instructions instead

Disable: `autoMemoryEnabled: false` in settings.json or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`

---

## Session Identity [CONFIRMED]

- Each session gets a **UUID session ID** at creation
- Sessions are **git-repository scoped** — tied to the git root, not cwd
- Stored as append-only JSONL: `~/.claude/projects/<hash>/sessions/<uuid>.jsonl`

### Resume

```bash
claude --continue          # resumes most recent session
claude --resume <uuid>     # resumes specific session
```

Full conversation history restored. Session-scoped permissions are **NOT** re-inherited — must re-approve.

### Fork

```bash
claude --continue --fork-session
```

Creates a new UUID preserving history up to that point. Original session unchanged.

---

## Conversation History [CONFIRMED]

JSONL format — each line is one event (message, tool use, result). Append-only — new events added without reading existing data. Crash-resistant: only the unfinished message is lost on crash.

Full transcripts stored at:

```
~/.claude/projects/<project-hash>/sessions/<session-uuid>.jsonl
```

All worktrees within the same git repo share this session store. Multiple terminals on the same session interleave messages (not corrupted, but jumbled) [UNVERIFIED exact behavior].

---

## Context Window Management [CONFIRMED]

### Auto-compaction

- Triggers at approximately **95% context window capacity**
- Hard limit enforced by the agentic loop

### `/compact` command

- Produces condensed summary, replaces conversation with it
- Achieves **60–70% token reduction** on average
- Best run at **60% capacity** — better quality than 90%
- Accepts: `/compact focus on [topic]`

### What survives compaction [CONFIRMED]

**Survives:**

- CLAUDE.md — re-read from disk and re-injected fresh
- Active task state, files being worked on
- Key decisions and code snippets

**Lost or degraded:**

- Detailed early instructions (if only in conversation, not CLAUDE.md)
- Precise variable names and numbers
- Carefully worded constraints given mid-session
- Nuanced reasoning chains

**Implication:** Critical rules belong in CLAUDE.md (survives compaction) or hooks (outside context window entirely). Never rely on mid-session instruction-giving for anything permanent.

### `/context` command [CONFIRMED]

Shows what's consuming context window: conversations, files, skills, MCP tools. Use to decide when to compact.

---

## Session Start Sequence [INFERRED]

Order at session start:

1. Generate or retrieve session UUID
2. Detect git project root (walk up from cwd)
3. Load settings hierarchy (managed → project → local → user)
4. Load CLAUDE.md files in full from all ancestor directories
5. Load MEMORY.md first 200 lines
6. Load skill descriptions
7. Load MCP server definitions and tool list
8. Initialize context window
9. Ready for input

---

## What Persists Between Sessions [CONFIRMED]

**Persists:**

- Full conversation history (JSONL on disk, loaded on `--continue`)
- CLAUDE.md (loaded fresh each session)
- Auto memory — first 200 lines of MEMORY.md
- Project settings (`.claude/` directory, git-tracked)

**Does NOT persist:**

- Session-scoped tool permissions (re-approve each new session)
- Model selection (reverts to default unless set in settings.json)
- Mid-session instruction changes (gone unless written to CLAUDE.md)

---

## Project Detection [CONFIRMED]

- Primary signal: `.git` directory — walks up from cwd
- All worktrees share project identity (recent enhancement in v2.x)
- Submodules have documented resume bugs (GitHub #27156)
- Outside git repos: cwd is the project root

---

## Observability [CONFIRMED]

What external tools can read during/after a session:

- Session JSONL files: `~/.claude/projects/*/sessions/*.jsonl`
- Memory files: `~/.claude/projects/*/memory/`
- Settings: `.claude/settings.json`
- "Writing memory" / "Recalled memory" messages visible in UI

**No built-in webhook or event system** — Claude Code does not emit external signals. External tools must read files or use hooks.

---

## Gaps

- Exact JSONL event schema not publicly documented
- Memory eviction policy (when does Claude delete old files?) not documented
- Whether `/compact` creates a new session UUID or reuses current [UNVERIFIED]
- Exact 95% threshold varies by model [UNVERIFIED]
- Whether background tool results get compacted [UNVERIFIED]

---

## Implications for Ada

1. **Ada's output must be in `.claude/`** — for git tracking and cross-worktree access. Machine-local config won't sync to other developers.

2. **CLAUDE.md is the only thing that survives compaction** — Ada's critical invariants belong in CLAUDE.md or hooks, never in conversation instructions.

3. **Auto memory is a signal channel** — Ada could write learnings to `~/.claude/projects/<hash>/memory/` directly. Claude Code picks it up next session. Requires knowing the project hash.

4. **Session files are observable** — Ada can audit what Claude Code has done by reading session JSONL files. This is the foundation for a drift detection feedback loop.

5. **No built-in feedback** — Ada must write to files Claude Code reads (CLAUDE.md, MEMORY.md, settings.json), use hooks to intercept events, or spawn Claude Code as subprocess and parse output.

6. **200-line MEMORY.md limit** — Ada should treat MEMORY.md as an index. Write pointers to topic files, not full content. Claude will pull topic files on-demand.
