# ARCHITECTURE.md — Ada Internals Reference

**Authority:** canonical design decisions for Ada's internals — how the compiler is built, not what it does.
**Derives from:** BRAND.md (identity), docs/product/CAPABILITIES.md (what is live vs vision)
**Depth audit:** docs/STATE.md — what each stage actually does, where it's shallow, known gaps
**Audience:** contributors to Ada itself (currently: Alex + Claude Code)

---

## Core Principle

> Complexity reflects in simplicity.
> When the right structure is found, the implementation shrinks.
> If adding a feature requires reinventing something that already exists — stop. Reuse.

---

## The 9-Stage Pipeline

Ada compiles intent through 9 stages, each producing a content-addressed artifact.
Stages CTX–GOV use LLM reasoning. BLD is deterministic — pure structural derivation, no LLM.

```
CTX → INT → PER → ENT → PRO → SYN → VER → GOV → BLD
```

| Stage | Name       | LLM? | Output                                              |
| ----- | ---------- | ---- | --------------------------------------------------- |
| CTX   | Context    | no   | Codebase snapshot, package boundaries               |
| INT   | Intent     | yes  | Intent graph — goals, constraints, unknowns         |
| PER   | Perception | yes  | Domain context, stakeholders                        |
| ENT   | Entity     | yes  | Entity map, bounded contexts                        |
| PRO   | Process    | yes  | Workflows, state machines                           |
| SYN   | Synthesis  | yes  | Blueprint — full compiled spec                      |
| VER   | Verify     | yes  | Verification report, coverage scores                |
| GOV   | Governor   | yes  | Decision: ACCEPT / REJECT / ITERATE                 |
| BLD   | Build      | no   | Stack, file tree, dependencies, acceptance criteria |

BLD runs only on GOV ACCEPT. Each stage output is immutable. A postcode identifies it.

---

## Postcodes

Every artifact Ada produces carries a **postcode** — a content-addressed identifier:

```
ML.SYN.abc12345/v1
^  ^   ^        ^
|  |   |        version
|  |   content hash
|  stage
namespace
```

Postcodes are Ada's unit of provenance. Every artifact traces back to the intent that produced it through a chain of postcodes.

### The Key Insight

**Postcodes are git SHAs by another name.**

A git SHA is: namespace-free, content-addressed, immutable, globally unique, already proven at scale.
A postcode is: namespace-qualified, content-addressed, immutable, globally unique, custom-built.

The only difference is the namespace prefix — which belongs in metadata, not the identifier itself.

This means: **Ada's world model should live in git's object store.**

---

## World Model Architecture

### Current State (Phase 3 — live)

Ada writes artifacts to disk after each stage:

```
.ada/
  manifest.json              — index: runId, intent, stage → postcode map
  artifacts/
    ML_SYN_abc12345_v1/
      artifact.json          — the compiled blueprint
    ML_INT_def67890_v1/
      artifact.json          — the intent graph
    ...
```

This works. It is also reinventing content-addressed storage that git already provides.

### Target Architecture (Phase 4 — design direction)

**Postcodes = content SHAs. World model = git objects. `.ada/ref` = pointer (mirrors git `HEAD`).**

```
# During compilation, Ada writes each artifact as a git object:
git hash-object -w --stdin  ← artifact JSON piped in
→ abc12345def67890...  (the SHA — content address)

# After GOV stage, Ada writes a tree linking all stage SHAs:
git mktree  ← "100644 blob <sha>\tINT" entries piped in
→ world-model-tree-sha

# Ada writes the pointer:
.ada/ref  →  "ada/v1 <world-model-tree-sha>"

# MCP server reads a stage artifact:
git ls-tree <tree-sha>     ← find stage entry
git cat-file blob <sha>    ← read artifact JSON
```

`.ada/ref` is the entry point — one line, committed, human-readable. Mirrors git's own `HEAD` pattern. `.ada/manifest.json` is kept as fallback for non-git tools and human inspection.

### What This Eliminates

| Current                     | Target                            |
| --------------------------- | --------------------------------- |
| `.ada/artifacts/` directory | git object store (`.git/objects`) |
| Custom hash in postcode     | git blob SHA                      |
| `loadArtifact(postcode)`    | `git cat-file blob <sha>`         |
| Manual content-addressing   | Built into git                    |
| `.gitignore` management     | Objects live in `.git/objects`    |
| `manifest.json` as index    | git tree + `.ada/ref` as index    |

### What It Preserves

- The postcode concept — still the unit of provenance
- The stage artifact model — each stage still produces one artifact
- The MCP tools — `ada.get_world_model(stage)` still works, reads from git objects instead of files
- `.ada/ref` — stays committed to the repo as the world model pointer

### Benefits

1. **No reinvention** — git's object store is battle-tested, immutable, content-addressed by design
2. **Latency** — `git cat-file` is faster than filesystem JSON reads at scale
3. **Provenance for free** — `git log --follow .ada` shows every world model revision
4. **Delta compression** — git packs similar objects; large blueprints compress well
5. **Distributed** — push the repo, the world model goes with it
6. **Verifiable** — SHA is the integrity check; no separate hash needed

---

## Elicitation

Before compilation, Ada runs an elicitation pre-phase: structured questioning to reduce intent ambiguity before the pipeline begins.

**Depth is adaptive** — the classifier reads the raw intent and assigns 0–5 questions based on:

- Scope clarity (how specific is the domain?)
- Stakeholder clarity (who uses it?)
- Constraint presence (are there explicit constraints?)
- Technical specificity (does the intent constrain implementation?)

**Question quality is pre-calibrated** — hint frames are axiom-aligned templates. They are not rewritten by the LLM. The LLM is only invoked when no pre-calibrated frame matches.

---

## MCP Authority Server

After ACCEPT, Ada stays in the room as a queryable constraint authority:

```
ada.query_constraints(scope)      — invariants for any domain scope
ada.check_drift(description)      — alignment check against compiled intent
ada.get_world_model(stage?)       — read any stage artifact
```

These tools work inside any Claude Code session spawned by Ada. The MCP server reads from `.ada/` (current) or git objects (target architecture).

**The loadBlueprint resolution order:**

1. `ADA_STATE_PATH` env var (explicit override)
2. `ADA_PROJECT_DIR` env var + `.ada/state.json`
3. `process.cwd()` + `.ada/state.json`

This ensures spawned Claude Code sessions always find the world model without env var configuration.

---

## Generated Artifacts

After ACCEPT, Ada writes to the target project:

| File                    | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `CLAUDE.md`             | Lean orientation: summary, components, build order             |
| `BUILD.md`              | Concrete contract: stack, file tree, deps, acceptance criteria |
| `.claude/agents/*.md`   | Per-bounded-context: invariants, workflows, machines           |
| `.claude/settings.json` | MCP config, hook registrations                                 |
| `hooks/pre-tool/*.sh`   | ~250 hooks enforcing entity invariants at tool call            |
| `.ada/ref`              | World model pointer — `ada/v1 <tree-sha>`                      |
| `.ada/manifest.json`    | World model index (fallback + human-readable)                  |
| `.ada/state.json`       | Active blueprint for MCP tools                                 |
| `.ada/artifacts/*/`     | Stage artifacts (non-git repos only)                           |

### CLAUDE.md Token Budget

CLAUDE.md is lean by design — orientation, not reference:

- Summary (1 paragraph)
- Working principles (7 lines)
- Architecture (pattern + rationale)
- Components (name + responsibility + bounded context only)
- Pointer: `> Invariants, workflow steps, state machines → agent files in .claude/agents/`
- Build order
- Done criteria
- Ada MCP tool list

Detail lives in agent files. CLAUDE.md is the door; agent files are the rooms.

---

## Key Invariants for Ada Itself

These apply when building Ada:

- **Do not ask granular technical questions** — infer from intent, decide autonomously
- **Excavation over generation** — every output traces back to input; never hallucinated
- **Gates are pure functions** — no I/O, no network calls; evaluate accumulated state only
- **Postcodes through provenance package only** — no ad hoc hash construction
- **Quality > speed** — one bad compilation that mismatches intent causes reputation damage
