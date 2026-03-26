# CONTEXT.md — Ada Context Architecture

**Authority:** defines the two types of context Ada manages and how all context layers chain together.
**Derives from:** ARCHITECTURE.md (pipeline), BRAND.md (identity)
**Audience:** anyone building Ada, building with Ada, or maintaining its documentation

---

## Core Principle

> Ada is a context machine.
> It accumulates context during compilation, then freezes it as stationary context for execution.
> All documentation and memory follows the same pattern — accumulated once, read many times.

---

## The Two Types of Context

### 1. Compiled-Along Context

Context that **accumulates forward** through the pipeline during a single compilation run. Each stage takes all prior context and adds its own signal. Nothing is thrown away — only refined.

```
Elicitation Q&A  ← user answers enrich raw intent before pipeline starts
       ↓
     CTX  — codebase snapshot, vocabulary, package structure
       ↓  (CTX output injected into INT prompt)
     INT  — goals, constraints, unknowns extracted from enriched intent
       ↓  (INT output is input to PER)
     PER  — domain context, stakeholders, ubiquitous language
       ↓  (INT + PER are input to ENT)
     ENT  — entities, invariants, bounded contexts
       ↓  (INT + PER + ENT are input to PRO)
     PRO  — workflows, state machines, Hoare triples, failure modes
       ↓  (all above are input to SYN)
     SYN  — blueprint: architecture, components, resolved conflicts
       ↓  (blueprint + INT graph are input to VER)
     VER  — coverage score, coherence score, drift detection
       ↓  (full pipeline state is input to GOV)
     GOV  — ACCEPT / REJECT / ITERATE
```

At GOV, the accumulated context spans: the codebase, the raw intent, the domain, every entity and invariant, every workflow step, the full architecture, and a structural audit. Nothing the user said has been lost.

**If ITERATE:** the correction is additive. The original intent is never replaced — only annotated. Each iteration's context includes all previous iterations. The governor always sees the full trajectory.

**The key property:** each downstream stage is more grounded than the last. CTX anchors INT to reality. INT anchors PER to intent. PER anchors ENT to domain. By SYN, the blueprint is grounded in all of it simultaneously.

---

### 2. Stationary Context

Context that is **written once and read on every session** — permanently frozen until the next compilation. This is what Ada produces; it is what Claude Code consumes.

**Written on ACCEPT:**

| File                                | What it contains                                               | When read                            |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| `CLAUDE.md`                         | Orientation: summary, components, build order, Ada MCP         | Start of every Claude Code session   |
| `.claude/agents/<context>-agent.md` | Invariants, workflow steps, state machines per bounded context | When agent is invoked by Claude Code |
| `.claude/skills/<workflow>.md`      | Per-workflow step-by-step execution guide                      | When skill is triggered              |
| `hooks/pre-tool/*.sh`               | ~250 scripts, one per entity invariant                         | Before every tool call Claude makes  |
| `hooks/session-start.sh`            | World model location, MCP tool names                           | On session start                     |
| `.claude/settings.json`             | MCP server config, hook registrations                          | On session start                     |
| `.ada/ref`                          | World model pointer — `ada/v1 <tree-sha>`                      | MCP server read                      |
| `.ada/manifest.json`                | Stage index with postcodes and SHAs                            | MCP server fallback                  |
| `.ada/state.json`                   | Full state checkpoint, blueprint inline                        | MCP `loadBlueprint()`                |

**The relationship:** compiled-along context becomes stationary context at ACCEPT. The pipeline's entire accumulated signal is distilled into these files. From then on, Claude Code reads the frozen form — not the pipeline state.

**Why it must be frozen:** if the context changed between sessions, the hooks would conflict with the code. Stationary context is the contract between Ada and Claude Code. Recompile to renegotiate.

---

## The Meta-Context Chain

The same two-type pattern applies to Ada's own development context.

**The chain — load from top to bottom:**

```
Memory bank (~/.claude/projects/.../memory/)
│   Who is Alex. How to work together. What's been decided. What to avoid.
│   Accumulated across all conversations. Personal + project layer.
│
├── README.md  (repo root)
│   What Ada is. Quick start. Package map. Design decisions.
│   Entry point for any new session touching the codebase.
│
└── docs/ADA.md  (master index)
    │   Hierarchy of all docs. Quick reference. Status table.
    │   Authoritative index — if a doc isn't here, it isn't canonical.
    │
    ├── docs/ARCHITECTURE.md
    │   8-stage pipeline. Postcodes. World model. Git-backed design.
    │   Two types of context. Elicitation. MCP. Generated artifacts.
    │
    ├── docs/BRAND.md
    │   Identity. Voice. Vocabulary: use/avoid. Claims: live/dead.
    │   Gates all public-facing language.
    │
    ├── docs/CONTEXT.md  ← this file
    │   Context architecture: compiled-along vs stationary.
    │   The meta-chain. Structurally correct loading order.
    │
    ├── docs/product/CAPABILITIES.md
    │   [LIVE] / [BUILDING] / [VISION] feature map.
    │
    ├── docs/product/WORKFLOW.md
    │   Real usage patterns. Model assignment rationale.
    │
    └── docs/strategy/ + docs/website/
        Growth, demo, content strategy, design.
```

**Structurally correct loading order for any new session:**

1. Memory bank — establishes who you are working with and what has already been decided
2. README.md — orients to the repo: what it is, where things live
3. ADA.md — orients to the doc library: what documents exist and what each one covers
4. Specific docs by relevance — go deeper only where the task requires it

Do not start in the middle. A session that begins at ARCHITECTURE.md without memory or README context will make decisions that contradict prior decisions.

---

## Context Chain Across Sessions

Claude's memory is the accumulated compiled-along context of the entire Alex ↔ Ada development relationship. It is:

- **Personal layer:** who Alex is, how he works, what communication style fits
- **Project layer:** architectural decisions made, features live vs planned, patterns confirmed
- **Feedback layer:** what approaches worked, what to avoid, why

The memory bank does NOT contain:

- Code patterns (read the code)
- Git history (use `git log`)
- Current task state (use tasks)
- File paths that may have moved (verify before referencing)

Memory describes the non-obvious, non-derivable, non-transient signal from all past conversations. It is the stationary layer of the meta-chain — written when something non-obvious is established, read at the start of every new session.

---

## Why This Structure Is Correct

**The pipeline structure informs the documentation structure.**

The pipeline accumulates specificity: broad intent → domain → entities → processes → architecture.
The doc chain accumulates depth: entry point → index → specific domains → code.

Both follow the same pattern: **start broad, narrow by need, don't skip levels.**

A user who describes what they want to build doesn't start by specifying their database schema.
A session that needs to understand Ada's architecture doesn't start by reading hook scripts.

The pattern is the same at every level. That is not a coincidence — it is the structural principle.

---

## Links

- `README.md` — entry point for the repo
- `docs/ADA.md` — master document index
- `docs/ARCHITECTURE.md` — pipeline, world model, git-backed design
- `docs/BRAND.md` — identity, vocabulary, claims
- `~/.claude/projects/.../memory/MEMORY.md` — personal memory index
