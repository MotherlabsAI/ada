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
| Drops ingested   | 1          |
| Frozen decisions | 0          |
| Open questions   | 3          |
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
- **OQ-3.** Is context-virtualization (local index of tool output) in scope for Ada, or is it a
  _separate_ runtime product that consumes Ada's packs? → see Noise/adjacent 1.

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
