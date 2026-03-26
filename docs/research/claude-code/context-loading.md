# Claude Code — CLAUDE.md Context Loading

**Researched:** 2026-03-24
**Sources:** docs.anthropic.com, claude.ai/blog, claudecodecamp.com, humanlayer.dev, builder.io, github.com/anthropics/claude-code issues, stevekinney.com/courses/ai-development

---

## Loading Hierarchy [CONFIRMED]

Claude Code loads CLAUDE.md files in strict precedence order:

1. **Managed policy** (organization-wide, cannot be excluded by project or user)
2. **User global** (`~/.claude/CLAUDE.md` — personal, applies to all projects)
3. **Project** (`./CLAUDE.md` or `./.claude/CLAUDE.md` — team-shared, checked into git)
4. **Local project** (`.claude/CLAUDE.local.md` — personal overrides, gitignored)

Additionally, Claude walks **up the directory tree** from cwd, loading CLAUDE.md from each parent directory. Subdirectory CLAUDE.md files load **on-demand** when Claude reads files in those directories.

All levels coexist; higher precedence wins on conflicts.

---

## Token / Character Budget [CONFIRMED]

- **Target:** Keep each CLAUDE.md under **200 lines**
- **Token cost:** ~100 lines ≈ 4,000 tokens
- **Total memory budget recommendation:** CLAUDE.md + rules under ~10,000 tokens
- **MEMORY.md:** Only first **200 lines** load at session start
- **Effect of exceeding:** Claude loses track of rules in the noise; adherence degrades

---

## Session Timing [CONFIRMED]

- Loaded at **session start only** (fresh read from disk)
- Every new session reloads CLAUDE.md
- During **context compaction**, CLAUDE.md is re-read fresh and re-injected
- **No mid-session hot-reload** — changes during a session are NOT picked up unless session restarts
- Exception: skills support hot-reload as of v2.1.0+

---

## Format Parsing [CONFIRMED]

CLAUDE.md is treated as **plain markdown** with two special features:

- **@ import syntax** — `@path/to/file` expands external files into context at launch (max 5 hops of nesting)
- **Markdown structure** — headers, bullets, code blocks all parsed and transmitted as-is
- **No comment syntax** — there is NO way to hide lines from Claude. All content is read as instructions.

GitHub Issue #18119 requests comment syntax; it does not exist as of 2026-03-24.

---

## @ Imports [CONFIRMED]

- Syntax: `@README.md`, `@docs/git-instructions.md`, `@~/.claude/my-overrides.md`
- Relative paths resolve from the **file containing the import**, not cwd
- Absolute paths work (starting with `/` or `~/`)
- Symlinks resolved normally
- Max recursive depth: **5 hops**
- First use shows an approval dialog; can be declined

---

## Operator vs Project vs User [CONFIRMED]

- **Managed (operator)** cannot be excluded; applies to all users in the org
- **Project** takes precedence over user
- **User** can be excluded by project via `claudeMdExcludes` setting in `.claude/settings.local.json`
- Settings enforce hard blocks; CLAUDE.md provides soft behavioral guidance

---

## Comment Lines [CONFIRMED — no comment syntax exists]

Standard Markdown comments (`<!-- -->`) are included in context. There is NO special syntax to hide lines from Claude. Claude reads everything in CLAUDE.md as instructions, including what humans intend as comments.

---

## What Works vs What Doesn't [CONFIRMED]

**Works:**

- Specific build/test commands (`pnpm run test`, `pnpm build`)
- Architectural decisions with file locations ("State via Zustand; see src/stores")
- Common gotchas unique to the project ("This uses ES modules, not CommonJS")
- Workflow requirements ("Always run typecheck after changes")
- Modular organization via `.claude/rules/` for topic-specific files

**Does not work:**

- Code style enforcement (use linters instead)
- Detailed API docs (link to them instead)
- Frequently changing information
- Conflicting rules (Claude picks arbitrarily)
- Bloated CLAUDE.md (> 200 lines — adherence degrades significantly)

---

## Injection Mechanism [CONFIRMED]

CLAUDE.md is **NOT** injected as a system prompt. Instead:

- Content is wrapped in a `<system-reminder>` XML tag
- Inserted as a **user message** in the messages array (not the system prompt field)
- Tagged as high-priority but can be displaced during context compaction
- This design preserves cache reuse while allowing per-user customization

---

## File Discovery [CONFIRMED]

Claude Code finds CLAUDE.md by:

1. Walking **up** from cwd to filesystem/git root — loads all CLAUDE.md files found
2. Checking **subdirectories on-demand** as Claude reads files in them
3. Always checking **user global** `~/.claude/CLAUDE.md`
4. Always checking **managed policy** if it exists

In monorepos: use `claudeMdExcludes` in `.claude/settings.local.json` to skip irrelevant parent CLAUDE.md files.

---

## Gaps

- Exact token calculation varies by model and compression — treat 200 lines as a hard limit
- Precise XML format of the `<system-reminder>` wrapper tag (structure confirmed, exact schema not)
- Context compaction algorithm — what exactly survives vs is summarized
- Behavior when import depth exceeds 5 hops (silent truncation or error — unverified)

---

## Implications for Ada

1. **Size discipline is critical.** Ada's generated CLAUDE.md must stay under 200 lines. If the compiled blueprint would exceed that, Ada should split into lean main CLAUDE.md + `.claude/rules/` files + `@imports` to external artifacts.

2. **@ import syntax enables modular composition.** Ada can generate a lean CLAUDE.md that references (via `@path`) detailed compiled artifacts — agent files, workflow specs, entity definitions — without injecting them into the always-on context. This is the correct architecture: hot context (CLAUDE.md) → cold context (agents, hooks) → on-demand (MCP).

3. **Ada's CLAUDE.md comments are read as instructions.** Any human-facing explanatory text in Ada's generated CLAUDE.md is read by Claude as directives. Keep only what Claude should follow. Separate explanations belong elsewhere.

4. **Content is in messages, not system prompt.** Claude Code sessions treating CLAUDE.md as a "constitution" are correct — it's the highest-priority user content, but it IS displaceable during compaction. Ada's most critical invariants should be in hooks (outside context window), not CLAUDE.md.
