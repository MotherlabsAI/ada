# Ada — Capabilities

**Authority:** describes Ada's current product state.
All claims are verifiable from the codebase or explicitly tagged.
Status tags: `[LIVE]` `[BUILDING]` `[VISION]`
**Implementation depth:** docs/STATE.md — actual edges, gaps, and `[SOLID]`/`[SHALLOW]`/`[HEURISTIC]` ratings per feature

Do not imply a BUILDING or VISION feature is LIVE.

---

## What Ada Does

Input: natural language intent — at whatever level the user operates.
Output: `CLAUDE.md`, agent definitions, pre-tool hooks, queryable world model.
Position: before building starts — and present throughout.

---

## Live `[LIVE]`

### Elicitation

Structured dialogue that surfaces and resolves ambiguity in user intent
before compilation begins.

- Adaptive depth classifier (pure function, no LLM) assigns 0–5 questions
- Questions are about what the thing should do, not how to build it
- Pre-calibrated axiom-aligned frames — returned verbatim, no LLM rewriting
- Terminal clears cleanly between elicitation and compile UI — no overlap

### Compilation pipeline

9-stage processing of elicited intent into structured context files.

Stages: `CTX → INT → PER → ENT → PRO → SYN → VER → GOV → BLD`

Stages CTX–GOV reduce ambiguity through LLM reasoning. BLD is deterministic — no LLM, pure structural derivation from the accepted blueprint.
Provenance gates between stages enforce entropy monotonicity.

### Output: `BUILD.md` `[LIVE as of 2026-03-25]`

Concrete build contract derived deterministically from the accepted blueprint.
Only written on GOV ACCEPT.

- **Stack** — one of 4 named presets, keyword-matched from architecture pattern + summary
- **Acceptance criteria** — one per bounded context, derived from workflow postconditions
- **File tree** — one directory per bounded context, one `.ts` + co-located `.test.ts` per component
- **Dependencies** — deduped base stack packages + per-component responsibility keyword matching

### Output: `CLAUDE.md`

Lean orientation file. Summary, components, build order, Ada MCP tool list.
Detail lives in agent files, not here.

### Output: `.claude/agents/`

Per-bounded-context files containing invariants, workflow steps with Hoare
triples, and state machines. Loaded per context, not all at once.

### Output: `hooks/pre-tool/*.sh`

~250 pre-tool guard scripts, one per entity invariant.
Run before every tool call Claude Code makes. Deterministic enforcement
outside the context window.

### Output: `hooks/session-start.sh`

Prints world model location and MCP tool names at the start of every session.

### Governor gate

- Rejects compilations below coherence threshold
- Iterates — if rejected, Ada revises and resubmits (up to 3 iterations)
- Fallback: picks best iteration by composite score if ACCEPT never reached

### World model `[LIVE as of Phase 3/4]`

Persistent, navigable store of all compiled artifacts.

- Git-backed: each stage artifact written as git blob object
- `.ada/ref` = `ada/v1 <tree-sha>` — world model pointer
- `.ada/manifest.json` — stage index with postcodes + git SHAs
- `.ada/state.json` — full checkpoint for MCP tools
- Non-git repos fall back to `.ada/artifacts/` file-based storage

### MCP authority server `[LIVE]`

19 tools available in every Claude Code session across 5 categories:

**World model access (read-only):**

- `ada.get_blueprint` — full compiled blueprint
- `ada.get_invariants` — entity invariants by scope
- `ada.get_workflow` — workflow definitions by name
- `ada.get_world_model(stage?)` — any stage artifact
- `ada.query_constraints(scope)` — invariants + workflows by domain scope `[HEURISTIC]`
- `ada.check_drift(description)` — alignment check against compiled intent `[HEURISTIC]`

**Feedback loop (write):**

- `ada.propose_amendment` — queue a blueprint amendment for human review
- `ada.propose_agent` — propose a new agent definition
- `ada.propose_skill` — propose a new reusable skill
- `ada.extract_skills` — extract repeated patterns from session log as skill candidates
- `ada.log_drift` — record a drift event to the provenance chain

**Verification:**

- `ada.verify` (static) — string-match coverage against blueprint
- `ada.verify` (5-layer stack) — structural, execution, policy, outcome, provenance layers

**Runtime / governance:**

- `ada.get_runtime_state` — current world-state snapshot from session log
- `ada.get_macro_plan` — topologically sorted execution plan from blueprint
- `ada.checkpoint` — git stash + checkpoint record
- `ada.rollback_to(checkpoint)` — git stash pop + checkpoint cleanup
- `ada.get_contract(context)` — delegation contract for a bounded context
- `ada.enter_delegation` / `ada.exit_delegation` — manage delegation stack

### Drift detection `[LIVE — static]`

`ada verify` scans the codebase against the compiled blueprint.
Run manually or triggered automatically on every commit via `.git/hooks/post-commit`.
Output: coverage score, coherence score, semantic drift findings.
Current implementation: static analysis (string matching). No LLM call.

### Provenance

Every artifact is addressable and traceable to original intent.
Provenance chain: `git log --follow .ada/ref`.
Each stage calls `store.record()` with postcode, content, parent postcode.

### Interactive welcome screen

`ada` or `ada compile` opens Ink TUI welcome screen.
Logo, Ada identity, styled prompt, keyboard hints.
Elicitation → compile renderer → post-compile Q&A → Claude Code spawn.

### Post-compile Q&A

After ACCEPT, Ada stays alive as readline interface.
User asks anything about the compiled blueprint.
Ada answers using Anthropic API with full blueprint as system prompt.
Empty enter proceeds to spawn.

### Feedback loop `[LIVE]`

Claude Code actions feed back into Ada's world model during and after every session.

- `hooks/post-tool-audit.sh` — every Bash/Edit/Write/Read/MultiEdit call appended to `.ada/session-log.jsonl`
- `hooks/pre-compact.sh` — checkpoint written to stdout before context compaction; Ada state survives
- `hooks/session-end.sh` — structured session summary written to `.ada/sessions/{id}.json`
- `ada.propose_amendment` MCP tool — Claude can flag when blueprint needs updating; queued for human review
- `ada review-amendments` CLI — interactive review of queued amendments; approve triggers `ada compile --amend`
- `ada review-skills` CLI — interactive review of extracted skill candidates; approved skills written to `.claude/skills/`

### Runtime governance `[LIVE]`

Ada tracks execution state and can roll back to any checkpoint.

- `ada.get_runtime_state` — reads session log + checkpoint chain, returns world-state snapshot
- `ada.get_macro_plan` — topological sort from blueprint with completion inference from session log
- `ada.checkpoint` — `git stash push` + checkpoint record; any significant state is restorable
- `ada.rollback_to(checkpoint)` — `git stash pop` + cleans all later checkpoints
- `ada.enter_delegation` / `ada.exit_delegation` — delegation frame management for bounded agent spawning
- `ada.get_contract(context)` — reads delegation contract for a bounded context

---

## In Development `[BUILDING]`

### Execution orchestrator

Coordinates macro/micro execution cycle. Reads compiled blueprint, spawns bounded micro executors with delegation contracts, routes outputs to the independent verifier, updates world-state. Not yet started.

### Micro executor + local repair

Bounded task execution per component under a delegation contract. Handles failures locally with a defined retry budget before escalating to the macro planner. Not yet started.

### Contract compiler

Compiles blueprint components into delegation contracts automatically (one per bounded context). Currently contracts must be written by hand. Not yet started.

### Uncertainty tracking

Per-fact confidence scores in world-state. Sourced facts (from verified tool outputs) carry higher confidence than inferred facts (LLM-derived). Feeds into macro planner decisions. Not yet started.

### Ongoing drift authority (`ada watch`)

`ada watch` — monitors `.ada/provenance.db` for drift signals.
Triggered on commit or file change. Re-runs verify agent against codebase + compiled blueprint.
Surfaces drift with postcode evidence. Not yet started.

### Impact analysis

Given a change to X: what else in the compiled model is affected?
Requires ongoing drift authority as prerequisite.

### Natural language queries against compiled context

"What did Ada decide about X?" returns authoritative answer from the artifact.
Not a summary from memory — a provenance-addressed answer.
Requires richer MCP query layer.

---

## Vision `[VISION]`

### Intent version history

How intent evolved from first description through all iterations.
Navigable. Reversible. Auditable.
Foundation: git-backed world model already provides the diff history via `git log --follow .ada/ref`.

### Multi-project authority

Ada as semantic authority across multiple projects.
Single installation, cross-project drift detection, shared entity vocabulary.

---

## Important Missing for Adoption

Not yet built. Material for the widest possible user base.

**1. Readable post-compilation summary**
Plain-language output after compilation that the user verifies against
their original intent before handing off to Claude Code.
Currently implicit. Must be explicit.
This is the verification step that makes Ada trustworthy to non-developers.

**2. One-command install**
`npm install -g @motherlabs/ada` or `brew install ada`.
Simpler install = faster spread. Every friction point in setup kills adoption.

**3. Windows support**
63% of vibe coders are non-developers. Many are on Windows.
CLI-only on macOS/Linux limits the primary audience.

**4. Recoverable error experience**
When something goes wrong, the error must not require understanding Ada's
internals to recover from. Plain language. Clear next action. No stack traces
surfaced to the user unless they ask.
