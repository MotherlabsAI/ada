# FREEZE — the Ada build (pending Alex's go)

**Status:** proposed, not ratified. Per the intake loop, the decisions and the AXIOMS delta below
**graduate only when Alex types the go.** Until then this is a proposal, not edits to `AXIOMS.md`
(frozen-v1) or code.

**Provenance:** frozen from 6 inputs — `docs/RESEARCH-INTAKE.md` Drops 1–5 (external research, filtered +
codebase-verified) and Drop 6 (Alex's vision). Synthesized by a 4-agent freeze workflow (3 drafters + 1
adversarial critic, verdict **GO_WITH_FIXES**); all 4 critic fixes folded in below.

---

## TL;DR — what you're approving

1. **The build:** stop hand-authoring packs; build the **generic compile engine** that turns any intent
   into a typed graph + real unknown-unknowns, with the guardrails it needs and the editable playground
   it deserves. One arc, six phases.
2. **An AXIOMS delta:** 4 clarifications/guards that are _entailed_ by what's already there (need your
   sign-off because axioms are immutable) + 1 held back as a real decision (below).
3. **A first slice** chosen to prove your non-negotiable — _the first node must impress_ — on the smallest
   surface.

**Three things only you can decide** (end of doc): approve the 4 axiom deltas? · amend A7 to allow "any
knowledge"? · say "go" on the first slice?

---

## 1. The one build

A generic, **model-at-compile-time** U2F excavation **engine** produces a **typed-IR semantic graph**,
gated by the existing deterministic rubric; one **canonical blueprint contract** and every downstream view
(CLAUDE.md / C / wiki / optional Mermaid) **derive from it** — never restate prose. The graph is
navigable **and editable** in an earth-toned ink TUI where **user and engine co-excavate**. It emits a
**portable filesystem pack** (Obsidian `[[wikilinks]]`, any knowledge domain) under a **hard salience
budget** enforced by a **pure model-free C-check**. It stays a local CLI/TUI that **runs and exits** — zero
runtime deps beyond ink/react, the model touched only at compile time, C model-free.

This replaces the deliberate `D6` hand-authored seed (`showcase.ts` / `blueprint.ts` / `claude.ts` booking
prose) with the layer their own header promised: _"the LLM-driven intent→graph layer slots into this same
contract later."_

---

## 2. Frozen decisions

### In scope (the steals that survived, deduped)

| id      | name                                                                                                     | builds on (already exists)                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **2-a** | Typed-IR blueprint = the single canonical contract; all views derive from it                             | `core/types.ts` (NodeCapsule/Edge/Seed), `compile/assemble.ts` NodeSpec; **rewrites** `export/blueprint.ts` + `export/claude.ts`         |
| **3-a** | Generic U2F excavation engine (model-at-compile-time → scored NodeSpecs) — **the product bet**           | `prompts/excavator.md` + `anti-generic-critic.md`, `rubric.ts` gate, `assemble.ts` `assemblePackGated`; **replaces** `buildShowcasePack` |
| 3-a.1   | Cross-domain analogical reasoning pathway                                                                | excavator prompt strategy (gets its own artifact + fixture — critic fix)                                                                 |
| 3-a.2   | Reverse-thinking-from-failure pathway                                                                    | lands in `LocalContext.failureIfMissing`                                                                                                 |
| 3-a.3   | Bounded Socratic `ctx init` interview (finite, write-to-seed, exit)                                      | `core/types.ts` Seed, the ink TUI                                                                                                        |
| 3-a.4   | Kano must-have / delighter ranking                                                                       | maps onto existing `NodeUi.openPriority`                                                                                                 |
| **4-a** | CLAUDE.md salience budget + **pure model-free density C-check**                                          | `export/claude.ts` `entities()`, ranks on `rubric` × `openPriority`, new `c/checks/density.mjs`                                          |
| 4-b     | Compaction-resistant emit shape (fenced immutable Hard-rules, do-not-summarize, backed by re-runnable C) | `export/claude.ts`, `c/emit.ts`                                                                                                          |
| 4-c     | Honest defeasibility: new `defeasible`/`exception` EdgeKind; soft rules → C0–C2 + residue                | `core/types.ts` EdgeType (verified absent), CheckClass C0–C5 ladder                                                                      |
| 4-d     | Provenance vs authority-confusion: ingested text stays `truth=source` DATA, never an Ada-authored MUST   | `core/types.ts` TruthClass (+ test — critic fix)                                                                                         |
| **6-a** | Editable graph playground: TUI read-only → generative co-excavation                                      | `tui/ink/App.ts`, `usePack.ts`, `navigator.ts`                                                                                           |
| 6-b     | Obsidian / multi-client portability via `[[wikilinks]]`                                                  | `pack/wiki.ts` (currently relative-path links)                                                                                           |
| 6-c     | "Compile any knowledge" scope (non-software domains)                                                     | engine domain-agnostic; **see A7 decision**                                                                                              |
| 6-d     | Experiential spec: fun/animated/earth-tone/familiar (blinking eye, terracotta→plum)                      | `tui/ink/theme.ts`, `art.ts` — woven through TUI phases                                                                                  |

**Already built (banked, no new work):** the wiki/pack emitters, the model-free C subsystem
(`c/run.ts`, `c/emit.ts`), the rubric gate, the typed graph + provenance.

### Out of scope (quarantined — must not appear in any phase)

The 5-DB "shared substrate" (EventStoreDB/Redis/Qdrant/Neo4j/ClickHouse) · the 5-layer agent harness +
8-step runtime loop · context virtualization / SQLite / FTS5 · session continuity / checkpointing · the
drift-capture runtime PostToolUse loop · VROP / stored-injection · context-anxiety · AEO/@graph (domain
content only if a user's intent asks) · the DACL runtime VM · **LLM-as-judge (violates A3)** · the
M&A/venture thesis · the **intent-telemetry "flywheel" (no phone-home)** · **all fabricated numbers**.

---

## 3. Proposed AXIOMS delta (needs your sign-off)

Axioms are immutable; these are _proposed_, not applied. Each was put through an entailment test — only
deltas **entailed** by the existing axioms + verified code pass.

**PASS — entailed (approve individually):**

- **D1 · A3 clarify — neuro-symbolic boundary.** "The model is invoked at compile time only, to lower
  intent into the typed graph + blueprint; from there every C check is purely symbolic — a runnable
  pass/fail predicate, no model in the evaluation path. Identical compiled inputs yield identical verdicts.
  No model may re-enter after compile." _(Names what A1+A3+A6 already jointly imply + the `c/emit.ts`
  docstring. Resolves OQ-1.)_
- **D2 · A3 clarify — defeasibility routing.** "A3 forbids a model in the checker, not exceptions in the
  data. Hard invariants → pure C (C4/C5); soft/defeasible rules → C0–C2 + residue + blueprint guidance +
  A4 gating; stochastic edge-case resolution lives in the executor, never in a check." _(Derives from A3 +
  the shipped C0–C5 ladder. The `defeasible` EdgeKind it implies is a code item, 4-c, not axiom text.)_
- **D3 · A1/A2 clarify — editable-playground boundary.** "The exploratory layer (graph + wiki) is
  user-editable; the user co-excavates alongside the engine. User-authored nodes/edges are `truth=source`
  (A2); engine output is inferred/residue. User editing never reaches the deterministic layer directly —
  determinism flows in only by re-compile, never live mutation." _(A1 already calls the graph exploratory;
  A2 already carries the truth classes. Covers 6-a.)_
- **D4 · NEW A9 — sovereignty / no phone-home.** "Ada runs and exits. It MUST NOT transmit, harvest, or
  persist the user's intent, packs, interview answers, or derived semantics to any external service for any
  purpose. The only outbound call permitted is the single compile-time model invocation (A1); everything
  else stays on the filesystem (A5). A pack is the user's property." _(Hardens A5/A6 + zero-dep; forecloses
  Drop 5's telemetry-flywheel values fork.)_

**HELD BACK — not entailed (a real decision, not an axiom edit):**

- **6-c "compile any knowledge."** The _thesis_ already permits it ("Ada's substrate is meaning, which is
  general") — so the thesis line is **unchanged**. But the **MVP boundary A7 is software-context**.
  Allowing non-software domains is consistent with the thesis but is **not entailed by A7** — it's a
  deliberate scope expansion. **If you want it in the freeze, it's an explicit A7 amendment, decided on its
  own** (below). Not smuggled in via the thesis.

---

## 4. The plan (6 phases — critic fixes folded in)

Dependency-ordered, not preference-ordered. Every phase lands behind a CLI command that runs-and-exits; no
phase introduces a server, datastore, or session loop.

- **P0 · Typed-IR contract** (2-a, 4-d, **+ Seed de-hardcoding [critic top-fix]**). Make
  `blueprint.ts`/`claude.ts` _derive_ every line from graph nodes/edges/seed + the C registry — delete the
  literal `book()`/`no_double_booking` prose. **Pull the hardcoded Seed (`assemble.ts:243`) and booking-ish
  `CLUSTER_COLOUR` defaults out here** — the Seed is engine/interview _input_, never an emitter literal.
  Decide Mermaid-optional: either emit a derived Mermaid view or drop it from 2-a's scope. _Proves: a pack
  from a non-booking `NodeSpec[]` emits a blueprint + CLAUDE.md whose every claim traces to a node id, zero
  un-provenanced MUSTs._
- **P1 · U2F engine** (3-a, 3-a.1/.2/.4). The compile-time module driving `excavator.md` +
  `anti-generic-critic.md` → candidate `NodeSpec[]` → `scoreNode` → `assemblePackGated`. One injectable
  model boundary (tests run model-free). **Invariant [critic-fix]: `anti-generic-critic.md` is a C2
  _advisory/generative_ pass — it never becomes the kept/rejected gate and never lands in a C file
  (`scoreNode` stays the gate, A3).** **3-a.1 gets a concrete artifact [critic-fix]:** an analogical
  prompt-strategy section + a fixture node proving an analogy-sourced insight clears the gate. _Proves:
  `ada compile "<real intent>"` produces scored, provenance-traced nodes that pass the same rubric the
  calibration exemplars pass._
- **P2 · Bounded Socratic `ctx init`** (3-a.3). Finite branching ink interview → writes the Seed → exits.
  Hard turn-cap (asserted by test). _Proves: a user-driven seed enriches engine output and provably
  terminates._
- **P3 · Guardrails at scale** (4-a, 4-c, 4-b, **+ 4-d test [critic-fix]**). Salience budget + pure density
  C-check (fails an over-budget pack); `defeasible` EdgeKind + soft-rule routing; fenced immutable
  Hard-rules. **Test: a `truth=source` (ingested) node cannot emit a MUST line.** _Proves: an over-budget
  pack FAILS `ada c run` on a pure predicate._
- **P4 · Editable playground** (6-a, 6-d). Read-only → spawn/edit-edge/push-deeper; user nodes
  `truth=source`; determinism downstream. Earth-tone/animated/familiar, pure-ink (OQ-8 → no MCP-UI dep).
  **Done-when adds an exit/no-session assertion [critic-fix]** — the TUI still runs-and-exits as it gains
  write power (A6/A9). _Proves: a user-spawned node persists tagged source and survives re-compile._
- **P5 · Portability + any-knowledge** (6-b, 6-c). Emit `[[wikilinks]]` (Obsidian vault populates);
  run the engine on a non-software intent through the same gate. _Proves "Ada is to meaning what Claude
  Code is to code" literally._ (Gated on the A7 decision.)

---

## 5. The first slice — _the first node must impress_

**Name:** one impressive node from a real **non-booking** intent, end-to-end through the gate.

**Why it's first:** it makes the non-negotiable executable on the smallest surface — a single
model-at-compile-time call producing **one NodeSpec that clears the same `scoreNode` rubric** the 5
verbatim calibration exemplars clear, from an intent that is _not_ the booking showcase. It exercises A1
(model-at-compile-time-only), A2 (provenance), A3 (model-free gate) at once, on the **already-built**
`assemblePackGated`/`rubric` seam. Quality of one node > breadth.

**Done when** `pnpm build && node --test dist/compile/engine/excavate.test.js` is green, asserting:

1. engine called with a real non-booking intent + a **stubbed** model → one candidate NodeSpec;
2. it passes `scoreNode` with verdict **`impress`** (total ≥ 5 && specific);
3. `fromPrompt` is non-empty and every fragment is a substring of the intent (**A2**, no fabrication);
4. same stubbed input → **byte-identical** NodeSpec (**A1** determinism downstream of the one call);
5. **grep-guard:** no `anthropic`/`fetch`/`openai` token reachable outside `engine/model.ts` (**A3/A1**
   structural);
6. **negative case:** a generic candidate is **rejected** by the gate (the bar is real).

**Critic fix folded in:** the flagged CLI demo path (`ada compile --engine "<intent>"`) must carry the
**engine-supplied Seed** (not the booking literal) so the one impressive node isn't framed by booking
chrome. `buildShowcasePack` stays the default until P1 proves the full multi-node engine.

---

## 6. Decisions only you can make

1. **AXIOMS delta** — approve D1, D2, D3, D4? (all / some / none)
2. **A7 scope** — amend the MVP boundary to allow **6-c "compile any knowledge"** now, or keep the MVP
   software-context-only and revisit later?
3. **Go?** — say **"go"** and I start the **first slice** (via the subagent build loop, TDD). Freeze stays
   a proposal until then.
