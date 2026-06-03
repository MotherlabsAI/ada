# Research Intake

**Purpose.** A holding area for external research Alex feeds in. Each drop is filtered
into three buckets — **Bank** (already true of Ada), **Steal** (new, on-thesis, actionable),
**Noise** (unverified / fabricated, quarantined) — with claims traced to their source.

**This file is NOT a spec.** Nothing here is a build commitment. Ideas graduate only when
moved into the **Frozen** section below, and only with Alex's explicit sign-off. Until then
it's excavation, not direction.

**The loop.** drop research → filter here → (when feeding stops) freeze signal into a
plan + AXIOMS delta → Alex gives the go → build runs. Filtering may run in the background;
building does not start until freeze + go.

**Accuracy stance.** Alex flagged that research from a model carries fabricated specifics
(dates, dollar amounts, percentages). Directions can be real while the _numbers_ are invented.
Default: a quantitative claim is **unverified** unless traced to a primary source.

---

## Status

|                  |            |
| ---------------- | ---------- |
| Drops ingested   | 3          |
| Frozen decisions | 0          |
| Open questions   | 5          |
| Last updated     | 2026-06-02 |

---

## Frozen (build-eligible — requires Alex's sign-off)

_Empty. Nothing has graduated yet._

---

## Open questions (for Alex / future drops)

- **OQ-1.** Adopt the neuro-symbolic principle (model-at-compile-time, symbolic-at-check-time)
  as an explicit AXIOM, or leave it implicit in A3? → see Steal 1-a.
- **OQ-2.** Should the 4 behavioral constraints be hard-coded into every emitted `CLAUDE.md`,
  or offered as a toggleable preset? → see Steal 1-b.
- **OQ-3.** ~~Is context-virtualization (local index of tool output) in scope for Ada?~~
  **RESOLVED (Drop 2):** out of scope — it needs a datastore (SQLite/vector) and a long-lived
  process, both of which break Ada's zero-dep / runs-and-exits constraints. It's a _separate
  runtime product_ that consumes Ada packs. (Reaffirmed unanimously + survived critic steelman.)
- **OQ-4.** `.mcp.json` and pre-tool hooks are **verified unbuilt** (Drop 2), but `AXIOMS.md` A6
  currently says "MCP / hooks / plugins come later, not in P0." Does Alex want to pull MCP-manifest
  - hook emission **into** scope now, or keep them post-P0? → see Steal 2-c / 2-e.
- **OQ-5.** Adopt the **single typed-IR blueprint** (Steal 2-a) as the canonical form the other
  emitters derive from? This is the big one — it replaces today's hardcoded-prose blueprint.
- **OQ-6.** Build the **generic U2F excavation engine** (Steal 3-a) — the model-at-compile-time
  layer that DRIVES the existing `excavator.md`/`anti-generic-critic.md` prompts to _produce_ the
  graph + unknown-unknowns, instead of `showcase.ts` hand-authoring them? This is **the product
  bet itself**, and `showcase.ts`'s own header (DECISION D6) marks it as the planned next layer.
  Note: 2-a (typed IR) and 3-a (the engine that fills it) are the same build, two halves.

---

## Drop 1 — "Semantic Compiler for Human Context Engineering" (2 docs)

**Source.** Alex-supplied research compilation (LLM-generated, self-flagged as partly inaccurate).
Two parts: (1) architecture + venture thesis; (2) runtime mechanics (virtualization, guardrails,
neuro-symbolic, multi-agent debate).

### Bank — already true of Ada (confidence, not new work)

- **The upstream/downstream split** ("chaos→intent" vs "intent→code") is Ada's own thesis,
  independently restated. Confirms direction; not evidence it's correct.
- **Emit `CLAUDE.md` + `.mcp.json` + skills** as the executor handoff — already Ada's export shape.
- **Single source of truth, derive views from it** — already the pack / world-model.

### Steal — new, on-thesis, actionable

- **1-a · Neuro-symbolic principle (strongest idea).** Call the model _once_, at compile time,
  to lower intent into a typed deterministic graph; then check that graph _symbolically_ —
  identical inputs yield identical outputs (referential transparency). This is the rigorous
  name for **AXIOM A3** (C is a pure predicate, no model in the checker). Candidate: make it
  explicit in `AXIOMS.md`. → OQ-1.
- **1-b · The 4 behavioral constraints — content for the emitted `CLAUDE.md`.**
  (i) verification-first (no impl before a reproducing test), (ii) surgical edits only,
  (iii) no speculative abstractions, (iv) halt-and-ask on ambiguity. Insight: _strip bad
  instincts, don't stack good ones._ Concrete payload for the BLUEPRINT/CLAUDE emitters. → OQ-2.
- **1-c · Emit a Mermaid view + confirm `.mcp.json` manifest is in the export.** Makes a pack
  drop-in for Claude Code and model-agnostic. Small, concrete.
  > **Correction (Drop 2):** the word "confirm" was wrong — I implied these existed. **Verified:
  > neither Mermaid nor `.mcp.json` is emitted anywhere in `src/`.** 1-c is _unbuilt work_, now
  > carried forward as Steal 2-d (Mermaid) and 2-e (`.mcp.json`).

### Noise — quarantined (do NOT build on)

- **Entire venture / M&A section.** Acquisitions (Stainless "$300M", Astral, Promptfoo,
  Contextual AI "$80–90M"), the "12–24 month window," MCP "market share" % — unverified /
  likely fabricated. **The exit thesis is a story about being acquired, not about whether Ada
  is good.** Changes zero lines of what we build.
- **Every percentage.** "77.5% requirements coverage," "99% token savings," "40% fewer errors,"
  "10× PR velocity," "143k tokens / 72%," "sub-50ms." Illustrative, not measured. Direction may
  hold; the number is invented.
- **Named tools/frameworks** (context-mode by "mksglu", Faros Clara, EO-SR, DACL) — treat as
  _concepts to evaluate_, not citations. Verify existence before relying on any.

### Adjacent (interesting, probably out of scope)

- **Context virtualization** (intercept large tool output via PreToolUse hook, index to local
  SQLite/FTS5, return lean summaries). Genuinely good, but it's a _runtime executor_ concern —
  likely a separate product that _consumes_ Ada packs, not part of the compiler. → OQ-3.
- **Multi-Agent Debate (MAD)** for requirements classification (functional vs non-functional +
  judge). A build-time technique for the elicitation stage; revisit when building the compiler.
- **C4 model** (4 abstraction levels) — a known framework to position Ada's node/postcode model
  against, not necessarily to adopt.

---

## Drop 2 — "BE2E DSL + the 2026 Agent Harness" (2 docs)

**Source.** Alex-supplied research (LLM-generated, self-flagged inaccurate). Part 1 = the Behavior
E2E (BE2E) DSL: compile intent into one strongly-typed IR + a "Shared Semantic Substrate"
(EventStoreDB/Redis/Qdrant/Neo4j/ClickHouse) + DACL neuro-symbolic execution. Part 2 = the 5-layer
agent harness, 8-step runtime loop, 6 "Iron Laws," and 8 "types of context engineering."

**Method.** Filtered by **3 independent classifiers + 1 adversarial critic** (workflow
`wf_f0153cf9`), then **every codebase claim verified by hand** before recording.

### Verified codebase facts (ground truth — checked, not asserted)

- **No `.mcp.json` is emitted anywhere in `src/`** (only `TASK_GRAPH.json`). `grep "mcp" src` = nothing.
- **No Mermaid is emitted anywhere in `src/`.**
- **`src/export/blueprint.ts` emits hand-written booking-domain prose** (`no_double_booking`, literal
  `book()/reschedule()/cancel()/capturePayment()`), keyed off `seed.domain` but **not derived from the
  typed node graph.** This is the defect Steal 2-a fixes.
- **The generic emitter (`src/export/claude.ts`) ships exactly 3 fixed agents** (`ada-context-scout`,
  `ada-blueprint-writer`, `ada-c-verifier`). `ada-entity-mapper` exists **only** on the hand-engineered
  showcase path (`src/compile/engineered/emit.ts`) — generic per-node subagents are unbuilt.

### Steal — verified, in-scope, on-thesis

- **2-a · Single typed IR for the blueprint (the homerun).** Lower intent **once** into ONE
  strongly-typed contract — a small EBNF over `system / concept / entity / behavior` — emitted as a
  static file; the CLAUDE / C / blueprint views **derive from it** instead of restating prose. Fixes
  the hardcoded-prose defect above. Serves A1 (deterministic blueprint), A2 (kills hallucinated
  interfaces), A8 (a typed contract is a more constraining, testable payload). **Guard:** a file Ada
  _writes and exits_ — never a runtime that _executes_ it (that's claim B). → OQ-5.
- **2-b · Split the emitted `CLAUDE.md`** into a stable/static prefix (axioms, hard rules, entity
  registry) vs a volatile/dynamic suffix, so the executor's prompt cache stays warm. Pure authoring
  change in `claude.ts`, zero-dep. _(Drop the fabricated "~40%"; keep qualitative until A8-measured.)_
- **2-c · Cap + justify the emitted tool/action surface**, and add a **deterministic C predicate** over
  the manifest (tool count ≤ a small bound, names stable across recompiles). A pure A3 predicate in the
  `.mjs` shape the C engine already uses. _(Drop the fabricated "~72%.")_ → OQ-4.
- **2-d · C4-level Mermaid views** (system-context / container / component) projected from the node
  graph — which means **finally building the base Mermaid emitter (the unbuilt half of 1-c).** Mermaid
  only, **no PlantUML dependency.**
- **2-e · Actually emit `.mcp.json`** in every export bundle (the unbuilt half of 1-c). _Note:_ A6
  currently defers MCP to post-P0 — so this is a scope decision, not an automatic build. → OQ-4.
- **2-f · (secondary) Compile-time multi-agent debate** (functional / non-functional / judge) as an
  excavation aid in the elicitation stage. One-shot, **inside** the single compile-time model boundary
  (A1); output lands as provenance-tagged nodes (A2). **Never** a persistent runtime loop.

### Bank — confirmed already true (no new work)

- **DACL / "Amortized Intelligence"** = the compile-once-then-deterministic principle. Already Drop-1
  Steal 1-a (A1+A3); the audit trace ≈ A2 provenance. The "VM executes the graph" half is the executor.
- **Iron Laws I, III, V** (model-as-replaceable, filesystem-as-memory, subagents-for-isolation) restate
  A6 / A5 posture. _(But see correction: generic subagent emission is only partly built.)_

### Noise / Out of scope — quarantined (unanimous + critic steelman failed)

- **B · the 5 "mandatory" databases** (EventStoreDB/Redis/Qdrant/Neo4j/ClickHouse). Frontally breaks
  zero-dep / no-DB / filesystem / runs-and-exits. The _information model_ is already on disk
  (`edges.yaml` ≈ graph, truth classes ≈ event log, C reports ≈ observability, wiki ≈ search). **Take
  the model, leave the services.**
- **D · the 5-layer harness + 8-step runtime loop** — that's the _executor/runtime_ sibling, not the
  compiler. Ada sits before execution and exits (A6).
- **E3 / E4 / E5 · context selection (vector+rerank), context virtualization (SQLite/FTS5), session
  continuity (checkpointing)** — all need a datastore or a long-lived process. E4 reaffirms OQ-3.
- **Iron Laws II/IV/VI _runtime halves_** — cache enforcement, live tool gating, command interception
  are the executor's. Only their **compile-time emission** halves are stolen (2-b/2-c, and an A4 hook).
- **All percentages** (40 / 72 / 98–99 / 99.5 / >95, "30 min → 3 hr", "7000-word" threshold) —
  fabricated. Never enter a spec, AXIOM, or positioning line.

### Critic's two factual corrections (verified true, recorded so they don't recur)

1. **`.mcp.json` / Mermaid are NOT "already banked"** — they are unbuilt (→ 2-d, 2-e). The classifiers
   that called E8 "already shipped" were wrong against the code.
2. **Generic per-node subagents are NOT shipped** — only the 3 fixed agents + the showcase-only
   `ada-entity-mapper`. "Context isolation via subagents" is partly unbuilt, not done.

### Pre-registered prediction vs. outcome (honesty check)

Before the run I wrote: _substrate + harness land out of scope_ (**✅ correct**), and _"the real steals
will be small."_ **That second half was wrong.** Steal 2-a (the typed IR) is a **homerun, not small** —
because it patches a real existing defect (the blueprint is hardcoded prose, not graph-derived). I take
the correction rather than defend the prediction.

---

## Drop 3 — "U2F unknown-unknowns engine + the success pyramid" (1 doc)

**Source.** Alex-supplied research on surfacing **unknown-unknowns** (U2F: Unknown-Unknowns to
Functional solutions) and a 4-layer definition of success.

**Method.** 3 classifiers + 1 adversarial critic (`wf_6139e5c5`), tuned to guard **over-acceptance**
(this drop describes Ada's own heartland, so it's tempting to wave things through as "already built").
Every codebase claim verified by hand first.

### Verified codebase facts (ground truth — checked)

- The unknown-unknowns **data model exists** (`unknowns` field, `residue` truth-class, UNK cluster, a
  `recompiles` edge), the **gate exists** (`rubric.ts` `scoreNode`), and the **prompts exist**
  (`prompts/excavator.md`, `anti-generic-critic.md`) — but **no engine drives them.**
- **`showcase.ts`'s header documents this as intentional:** _"a DETERMINISTIC seed (DECISION D6)…
  not model-generated. The LLM-driven intent→graph layer slots into this same contract later, behind
  the human gate (A2/A4)."_ So the engine is a **deliberately-deferred layer**, not an oversight.
- **No** analogical / reverse-thinking / Socratic logic, and **no** PostToolUse / drift / feedback
  loop, exist anywhere in `src/`.

### Steal — verified, in-scope, on-thesis

- **3-a · The generic U2F excavation engine (the product bet, made buildable).** A compile-time,
  single-invocation, zero-dep module that drives the existing prompts against a seed and emits **scored
  NodeSpecs** (incl. `residue`/UNK) through the `rubric.ts` gate into the existing contract — replacing
  the hand-authored `showcase.ts` capsules. Model **at compile time only** (A1); output traces to intent
  or lands as honest residue (A2); runs-and-exits. **This is the same build as 2-a** (the typed IR is the
  contract; the engine is what fills it). → OQ-6.
  - **3-a.1 · Cross-domain analogical reasoning** — a prompt pathway that surfaces non-obvious nodes by
    transfer from unrelated domains. Distinct from 2-f (debate _adjudicates_; analogy _generates_).
  - **3-a.2 · Reverse-thinking-from-failure** — back-chain from failure/attack states to missing
    constraints; lands in the existing `failureIfMissing` field. Pure compile-time reasoning — **not** a
    runtime scanner.
  - **3-a.3 · Bounded Socratic elicitation** — a **finite** branching ink-TUI interview _before_ pack
    assembly that captures the user's implicit expectations into the seed, then **exits.** The critic
    overruled a classifier who wanted to quarantine this: it's a steal **with a hard turn-cap** (finite,
    write-to-seed, exit; never a session/chat server). It's the richest source of _user-side_ unknowns —
    and it dovetails with the CLI/TUI work already in flight.

### Bank — confirmed already built (no new work)

- **Q · the "UUs Playbook" = the wiki.** Filesystem-backed, git-committable Markdown that binds the
  downstream agent — already Ada's emitter layer (`pack/writer.ts`, `pack/wiki.ts`, `export/claude.ts`).
  Only its _content source_ (the 3-a engine) is the gap.
- **T-L3 (verification rigor) = the C subsystem** (`src/c/run.ts`, pure predicate, A3). **T-L4
  (referential transparency) = axioms A1/A2/A3 + the typed graph.** Both already shipped supporting infra
  — explicitly _not_ the product bet. Don't mislabel them as new.

### Noise / Out of scope — quarantined

- **R · drift capture (the costume trap).** Sounds like our heartland ("turn a lesson into a reusable
  constraint"), but the load-bearing verb is **runtime**: a PostToolUse loop intercepting live tool-call
  failures and mutating the graph online = the executor layer (A6). Ada may _emit_ a static PostToolUse
  hook file; it must **never host the loop.** Keep the `recompiles` edge a **human-initiated** re-compile,
  never a live-trace channel.
- **S · dual-benefit framing** and **T (the pyramid)** as a whole — a positioning lens, not a build.
- **T-L2 numbers** ("98% savings", "315KB→5.4KB") — fabricated; the measurable-improvement _principle_ is
  already A8. **T-L1's C4/Mermaid** is already Drop-2 Steal 2-d — don't re-bank.

### Pre-registered prediction vs. outcome (honesty check)

I predicted: P/P1–P3 = the real steal, unbuilt (**✅**); R = executor (**✅**); S + T = framing (**✅**).
**Right this time.** The one thing I'd have gotten wrong solo: I'd have quarantined the Socratic
interview as too runtime-y — the critic correctly kept it as a steal _with a turn-cap_. Scored honestly:
the discipline is the score, not the streak.
