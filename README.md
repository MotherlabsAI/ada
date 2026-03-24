# Ada — Intent compiler for Claude Code

**Close the gap between what you mean and what gets built.**

Ada is a semantic intent compiler. You describe what you want to build — at whatever level you think in. Ada runs structured elicitation to surface blocking unknowns, then compiles through a 7-stage pipeline that produces CLAUDE.md, agent files, and pre-tool hooks. Claude Code builds against those governed artifacts instead of against an informal description.

**The intent gap:** Every AI-assisted development session starts with informal natural language that is never formalized. Claude Code infers your intent. The inference is close. Close is not right. By the time the drift is visible, rewinding is harder than starting over. Ada closes this gap before building starts.

```
$ npm install -g @motherlabs/ada
$ ada compile

[elicitation — semantic questions, not technical ones]

CTX → INT → PER → ENT → PRO → SYN → GOV
                                      ↓
                                 approved 0.94
                                      ↓
CLAUDE.md  ←  agents/  ←  hooks/ (247 files)
                                      ↓
Claude Code reads CLAUDE.md on every turn and builds inside your intent.
```

Ada is not a code generator. It is the step before — the translation layer between human intent and governed execution.

**[motherlabs.ai/ada](https://motherlabs.ai/ada)** — full documentation

---

## Architecture

| Stage | Name       | Output                                   |
| ----- | ---------- | ---------------------------------------- |
| CTX   | Context    | Codebase snapshot, vocabulary, packages  |
| INT   | Intent     | Goals, constraints, unknowns             |
| PER   | Perception | Domain, stakeholders, language           |
| ENT   | Entity     | Entities, invariants, bounded contexts   |
| PRO   | Process    | Workflows, state machines, Hoare triples |
| SYN   | Synthesis  | Blueprint: architecture + components     |
| VER   | Verify     | Coverage score, coherence score, drift   |
| GOV   | Governor   | ACCEPT / REJECT / ITERATE + confidence   |

Each stage's output is content-addressed (postcode = git blob SHA). Provenance gates between stages enforce entropy monotonicity. On ACCEPT, the world model is written to git objects.

---

## Packages

| Package              | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `@ada/compiler`      | 8-stage pipeline engine, Zod schemas, streaming agents                |
| `@ada/elicitation`   | Adaptive depth classifier, dialogue engine, session manager           |
| `@ada/provenance`    | Postcode addressing, SQLite store, entropy tracking                   |
| `@ada/config-writer` | Generates CLAUDE.md, agent files, hooks, skills, settings             |
| `@ada/mcp-server`    | MCP authority server: query_constraints, check_drift, get_world_model |
| `@ada/orchestrator`  | Compilation loop, Claude Code spawning, session checkpoints           |
| `@ada/governor`      | Runtime drift detection, invariant evaluation                         |
| `@ada/storage`       | Project run history, global state                                     |
| `cli`                | Terminal UI (Ink/React) — welcome screen, streaming pipeline          |

---

## Quick Start

```bash
git clone https://github.com/alexrozex/ada.git
cd ada
pnpm install
pnpm build

export ANTHROPIC_API_KEY=sk-ant-...
ada compile "build a subscription billing system with Stripe"
```

Bare `ada` opens the interactive welcome screen. Without an API key, Ada falls back to the `claude` CLI automatically.

---

## What Ada Writes on ACCEPT

```
CLAUDE.md                           ← lean orientation for every Claude Code session
.claude/
  agents/<BoundedContext>-agent.md  ← invariants + workflow steps + state machines
  skills/<workflow>.md              ← per-workflow execution guide
  settings.json                     ← MCP config + hook registrations
hooks/
  pre-tool/*.sh                     ← ~250 invariant enforcement scripts
  session-start.sh                  ← world model reference on session start
.ada/
  ref                               ← world model pointer: ada/v1 <tree-sha>
  manifest.json                     ← stage index with postcodes + git SHAs
  state.json                        ← full checkpoint for MCP tools
.git/hooks/post-commit              ← ada verify on every commit
```

World model artifacts are git objects. Provenance: `git log --follow .ada/ref`.

---

## Design Decisions

**Compiled-along then frozen.** Each stage accumulates context from all prior stages. On ACCEPT, the full accumulated signal is frozen as stationary context. See [docs/CONTEXT.md](docs/CONTEXT.md).

**Blind agents.** Each stage sees only its input schema. Prevents coordination drift.

**Entropy monotonicity.** Gates check that entropy decreased from the prior stage — not just that it is low enough. Shape over magnitude.

**Postcodes = git SHAs.** World model artifacts are git blob objects. No reinvented content-addressing. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Pre-calibrated elicitation.** Questions selected by pure function (no LLM), returned verbatim from axiom-aligned templates.

**Additive iteration.** ITERATE appends corrections to original intent. User's words are never replaced.

**Self-compile proof.** `ada compile "build ada"` must Governor ACCEPT.

---

## Documentation

| Doc                                          | What it covers                                                |
| -------------------------------------------- | ------------------------------------------------------------- |
| [docs/ADA.md](docs/ADA.md)                   | Master index — all docs, hierarchy, status                    |
| [docs/CONTEXT.md](docs/CONTEXT.md)           | Context architecture: compiled-along vs stationary, doc chain |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Pipeline, postcodes, world model, git-backed design           |
| [docs/BRAND.md](docs/BRAND.md)               | Identity, voice, vocabulary, claims                           |
| [docs/RESEARCH.md](docs/RESEARCH.md)         | Positioning against research from Jan–Mar 2026                |

---

## Status

**v0.1.0** — All 8 stages live. Elicitation live. World model git-backed. MCP authority server live. Interactive welcome screen. Post-compile Q&A. Auto-spawn Claude Code on ACCEPT.

Motherlabs © 2026 — MIT
