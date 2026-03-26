# Ada — State of the System

**Authority:** technical audit of Ada's actual implementation depth, real edges, research conformance, and Claude Code pairing patterns.
**Derives from:** codebase audit (2026-03-25), ADA.md, BRAND.md, CAPABILITIES.md, 2025–2026 research literature.
**Status tags:** `[SOLID]` `[SHALLOW]` `[HEURISTIC]` `[GAP]` `[RESEARCH NEEDED]`

> This document says what exists, what it actually does, and where it breaks.
> No overclaiming. No concealment.

---

## Pipeline Depth Map

### BLD — Build Contract (deterministic, post-GOV)

**What it does:** Pure structural derivation from the accepted blueprint. No LLM, no I/O side effects. Runs only on GOV ACCEPT. Produces a `BuildContract` with four outputs: stack preset (4 named presets, keyword-matched from architecture pattern + summary), file tree (one dir per bounded context, one `.ts` + co-located `.test.ts` per component, prisma schema if applicable), dependency manifest (stack base packages + per-component responsibility keyword matching), and acceptance criteria (one criterion per bounded context, derived from the last workflow step's postcondition). Writes `BUILD.md` alongside `CLAUDE.md`.

**Stack presets:** `nextjs-prisma-postgres`, `express-prisma-postgres`, `cli-node`, `library-ts`. Default: `nextjs-prisma-postgres`. Selection is keyword match against `architecture.pattern` + `summary`.

**Status:** `[SOLID]` for the gate mechanics and data structure. `[HEURISTIC]` for stack preset selection and file tree indentation rendering.

**Edges:**

- `[HEURISTIC]` Stack preset is keyword-matched. `"REST API"` in summary → express preset. `"CLI"` → cli-node. No static analysis of actual package.json — if the repo already uses a different stack, BLD may suggest the wrong preset.
- `[HEURISTIC]` Dependency keyword matching (`"hash"/"password" → bcrypt`, `"queue" → bull`, etc.) is a fixed vocabulary. Components with novel responsibility language may produce an empty dependency list.
- `[SHALLOW]` File tree indentation in BUILD.md has a cosmetic issue — paths from `src/app/` don't render with proper tree structure. Data is correct; rendering is imperfect.
- `[GAP]` File tree is static spec, not validated against the actual monorepo structure. A component named `PaymentService` gets `src/payment/payment-service.ts` regardless of whether a different naming convention is already in use.
- BLD runs as a 9th stage only. The stage record is emitted and viewable in the compile renderer like any other stage.

---

### CTX — Static Codebase Analysis

**What it does:** Walks `packages/*/src/**/*.ts` (monorepo) or `src/`, `app/`, `lib/`, `pages/`, `components/` (standalone). Extracts exported interfaces, type aliases, constants, package boundaries and dependency graphs. Pure function, no LLM, no I/O side effects.

**Injected into:** INT (vocabulary → "use these names, don't invent new ones"), ENT (type registry with field shapes), SYN (package boundaries and dependency graph).

**Status:** `[SOLID]` for TypeScript monorepos and standard standalone layouts.

**Edges:**

- Regex extraction: `export\s+interface\s+(\w+)`. Multi-line interfaces with nested generics silently truncate. Complex extends chains not followed.
- No framework detection. A Next.js project and a plain Express project look identical to CTX.
- No runtime analysis — types that only exist at runtime (via class instantiation, factory patterns) are invisible.
- Python, Go, Rust: completely invisible. Ada is TypeScript-native today.
- `[GAP]` CTX output is structural, not semantic. It tells INT "these names exist" but not "these names mean this in this domain."

---

### INT — Intent Extraction

**What it does:** Sonnet with glass-box streaming (reasoning visible to user). Extracts goals (stated/derived/implied/unstated), constraints, unknowns (blocking/scoping/implementation), challenges. Grounded in CTX vocabulary. Web grounding available behind `ADA_WEB_ACCESS=true` flag.

**Status:** `[SOLID]` for single-session compilations. Genuinely good at proportional extraction — simple intent → 2-4 goals, complex intent → more.

**Edges:**

- `[SHALLOW]` No multi-turn refinement within a single compilation. INT runs once with the enriched intent. If it misses a goal, VER may catch it, triggering ITERATE — but the correction is via augmented intent string, not dialogue.
- `[SHALLOW]` --amend mode (NEW) injects prior blueprint into INT so goals accumulate across compilations. But the injection is prompt-level — no structured merging. Duplicate goals or goal drift is possible across amend cycles.
- `[GAP]` INT unknowns typed as blocking/scoping/implementation. Blocking unknowns can surface for clarification. But the clarification callback only fires on iteration 1. If clarification is needed on iteration 2 (after ITERATE), it is skipped.
- Web grounding uses `web_search_20250305` tool — real-time domain context injection. Off by default. When enabled, adds 3-5 sentence domain summary. Quality is model-dependent.

---

### PER — Domain / Vocabulary / Exclusions

**What it does:** Sonnet. Names the domain, defines stakeholders (knowledgeBase, blindSpots, fearSet, vocabulary), builds ubiquitousLanguage map, lists excludedConcerns.

**Status:** `[SOLID]` for domain naming and exclusion lists. Stakeholder data is generally good.

**Edges:**

- `[GAP]` Stakeholder vocabulary and fearSet are generated but **never written to agent files**. Claude Code never sees them. The stakeholder data informs ENT/PRO downstream within the pipeline but does not persist to stationary context.
- `[GAP]` ubiquitousLanguage map is generated but not injected into agent files as canonical terminology. This is the most important output of PER for Claude Code — the terms that must be used consistently — and it goes nowhere.
- `[SHALLOW]` Domain naming is single-attempt. If the INT stage produced a domain description that doesn't match the actual user domain, PER inherits that error without correction.

---

### ENT — Entity Extraction and Invariants

**What it does:** Sonnet. Extracts entities (substance/quality/relation/event/state categories), properties with types, invariants as predicates, grouped into bounded contexts with root entities. Grounded in CTX type registry.

**Status:** `[SOLID]` for well-described domains. Predicate invariants are the right primitive — they generate hooks.

**Edges:**

- `[SHALLOW]` ENT receives CTX type registry ("these types exist with these fields — reference them, do not reinvent") but this is advisory. ENT may still generate entities that conflict with or partially overlap existing types.
- `[GAP]` ENT does not know about the architecture (that's SYN's output). Bounded context naming in ENT is domain-driven, but component naming in SYN is architecture-driven. The mapping between them (done in config-writer by `contextEntities.get(comp.boundedContext)`) is a string match — it breaks when ENT and SYN use slightly different names for the same context.
- `[SHALLOW]` Category (substance/quality/relation/event/state) is used in hook generation but not validated. A "state" entity without lifecycle transitions is not flagged.
- Invariant predicates are valid code expressions (`entity.field !== null && entity.field.length > 0`) but they're never actually evaluated — they're enforced via hook pattern matching, not execution.

---

### PRO — Process / Workflow / State Machines

**What it does:** Sonnet. Defines workflows with named steps, each with a Hoare triple (precondition, action, postcondition), failure modes (precondition/action/postcondition class + handler), and temporal relations. Defines state machines for stateful entities.

**Status:** `[SOLID]` structurally. Hoare triples are genuine formal specification primitives.

**Edges:**

- `[SHALLOW]` Temporal relations (enables/requires/concurrent/compensates/guards) are written but **never used** to generate a build order or task graph. They exist in the artifact but config-writer ignores them.
- `[SHALLOW]` Failure modes are written but **only used in agent acceptance criteria**. They don't generate error handling code, fallback workflows, or compensating transactions.
- `[GAP]` State machine transitions have guards ("guard: directory is empty or has no conflicts") but these are natural language, not formal predicates. They cannot be evaluated or enforced mechanically.
- `[SHALLOW]` Workflow step assignment to bounded contexts (in config-writer) is keyword matching — any step containing a term from a bounded context's entity list is assigned there. Steps that touch multiple contexts are assigned to all of them (duplicate), or to none (missed) if the terminology doesn't overlap.
- PRO receives up to 12 entities (capped in prompt). Large entity models truncate.

---

### SYN — Synthesis / Architecture / Blueprint

**What it does:** Sonnet. Produces the final blueprint: architecture pattern, components with responsibilities and interfaces, resolved conflicts, non-functional requirements, open questions. Grounded in CTX package boundaries.

**Status:** `[SOLID]` for producing a coherent architecture that respects the codebase structure.

**Edges:**

- `[GAP]` `openQuestions` and `resolvedConflicts` are generated but **not surfaced in any output**. They appear nowhere in CLAUDE.md, agent files, or the post-compile summary. The system discards the most uncertain and most decided parts of the compilation.
- `[GAP]` `nonFunctional` requirements (performance, security, scalability) are generated but not written to agent files or CLAUDE.md.
- `[SHALLOW]` Architecture pattern is a string label ("event-driven-microservices"). It is not validated against the codebase structure or the package boundaries CTX provided. SYN may propose a pattern that contradicts the actual monorepo shape.
- Component interfaces are declared (e.g. `processPayment(amount, currency): Result`) but these are natural language method signatures, not TypeScript types. They are written to agent files but don't generate actual interface stubs.

---

### VER — Blueprint vs Intent Audit

**What it does:** Opus with extended thinking (unless `ADA_DEV_MODE=1`). Adversarial audit — tries to break the blueprint by checking each goal for component coverage. Produces coverageScore, coherenceScore, drifts, gaps.

**Status:** `[SOLID]` as an adversarial reviewer. Extended thinking catches real gaps.

**Edges:**

- `[GAP]` VER's gaps and drifts are **not surfaced in the post-compile summary**. The user never sees what VER found — they only see the governor's decision. If VER found 3 coverage gaps, the user has no idea.
- `[SHALLOW]` VER audits blueprint vs intent, not blueprint vs codebase. The `ada verify` command does the latter, but VER stage and `ada verify` are completely separate systems that don't share findings.
- Scoring: coverage = goals addressed / total goals. A goal is "addressed" if any component's postcondition is traceable to it. This is assessed by Opus — accurate but subjective.
- Coherence = 1.0 minus (contradictions / total invariants). High by default (0.85+) unless actual contradictions exist.

---

### GOV — Governor Gate

**What it does:** Sonnet. Decision: ACCEPT / REJECT / ITERATE. Confidence score. Violation list (stageCode + description). If REJECT, nextAction (correction instruction) augments intent for next iteration. Up to 3 iterations. Fallback: best by composite score if ACCEPT never reached.

**Status:** `[SOLID]` as a gate mechanism.

**Edges:**

- `[GAP]` Governor's confidence score and violation list are **not shown in the post-compile summary**. The user sees the headline decision but not the rationale.
- `[SHALLOW]` The ITERATE correction appends to intent as `CORRECTION: [action]`. The original intent is never replaced. This is correct (additive, not destructive) but the correction is at most 500 characters of natural language — it cannot address structural blueprint problems that require regenerating specific stages.
- `[GAP]` No per-stage targeted recompilation on ITERATE. The entire 8-stage pipeline re-runs. If GOV says "ENT stage missed a User entity," the fix rebuilds INT, PER, ENT, PRO, SYN, VER, GOV — even though only ENT needs to change.

---

## Output Quality Map

### BUILD.md

**What it contains:** Stack label, acceptance criteria (one per bounded context), file tree (per component, co-located tests, prisma schema), dependencies (deduped base + keyword-matched dev/prod split), provenance postcode.

**When it appears:** Only on GOV ACCEPT. Not written on REJECT or ITERATE.

**Edges:**

- `[SHALLOW]` Acceptance criteria are derived from the last workflow step postcondition per bounded context — good quality for well-specified workflows, generic for under-specified ones.
- `[GAP]` BUILD.md is not read by CLAUDE.md or agent files. Claude Code must discover it manually. It is not referenced in the current CLAUDE.md template.

---

### CLAUDE.md

**What it contains:** Summary (from `blueprint.summary`), architecture pattern, component list with responsibilities, build order by dependencies, Ada MCP tool instructions.

**Token budget:** ~150-200 lines. Lean by design — detail lives in agents.

**Edges:**

- `[GAP]` Excluded concerns not written. Claude Code doesn't know what Ada explicitly ruled out.
- `[GAP]` Open questions not written. Claude Code doesn't know what Ada left unresolved.
- `[GAP]` Non-functional requirements not written.
- Build order is by dependency chain — correct for components with declared dependencies. But dependencies are declared by SYN via LLM, not extracted from actual code. May be wrong.

---

### `.claude/agents/`

**What they contain:** Per bounded-context file with responsibility, invariants as predicates, workflow steps with Hoare triples, state machines, acceptance criteria, prohibited actions.

**Loaded by Claude Code:** On-demand when invoked for a specific bounded context.

**Edges:**

- `[SHALLOW]` Workflow step assignment to contexts is keyword matching. A step that involves three contexts is assigned to all three — the agent files contain duplicates. A step that uses generic language appears in none.
- `[GAP]` Stakeholder vocabulary from PER not included. If the domain has a specific term ("Invoice" in billing means something precise), agents don't capture that.
- `[GAP]` The `description` field in frontmatter — used by Claude Code to decide when to invoke an agent — is always `"Use when [responsibility] tasks arise in [context] domain."` Low selectivity. Claude Code may choose the wrong agent or no agent for edge cases.
- Agent files include `status: GHOST` — means they exist but haven't been validated by execution yet. This is accurate but the status never changes automatically.

---

### `hooks/pre-tool/*.sh`

**What they do:** One shell script per entity invariant predicate. Fire before every tool call Claude Code makes. Generated by `hooks.ts` in config-writer.

**Mechanism:** Each hook greps the tool arguments for patterns derived from the predicate. If a violation pattern is detected, the hook exits non-zero → tool call blocked.

**Status:** `[HEURISTIC]` — this is the most important architectural fact about hooks.

**Actual behavior of a hook for `entity.name !== null && entity.name.length > 0`:**
The hook looks for patterns like `name` in the tool arguments. It does NOT evaluate whether a proposed code change would result in a null name. It cannot — it has no access to the code's execution state.

**What hooks actually prevent:**

- Tool calls that literally reference the forbidden pattern in the arguments (e.g. `Write` with content containing `name: null`)
- Writes to files that contain the exact string the hook was calibrated against

**What hooks cannot prevent:**

- Logic errors that produce null names at runtime
- Refactors that move the enforcement point without changing the pattern
- Any invariant violation that doesn't manifest as a textual pattern in tool arguments

**Edges:**

- `[GAP]` ~250 hooks are generated. Their effectiveness depends entirely on how precisely the predicate terms match what Claude Code actually writes. Overspecific predicates catch nothing. Underspecific predicates produce false positives.
- `[GAP]` Hooks have no cross-invariant reasoning. Each fires independently. A sequence of tool calls that individually pass but collectively violate an invariant is not caught.
- `[RESEARCH NEEDED]` No measurement exists for hook effectiveness. The claim "~250 hooks enforcing invariants" is true structurally. Whether enforcement actually prevents violations vs merely slowing Claude Code down is unmeasured.

---

### World Model (`.ada/`)

**What it contains:** `.ada/ref` (git tree pointer), `.ada/manifest.json` (stage index with postcodes + SHAs), `.ada/state.json` (full checkpoint), `.ada/provenance.db` (SQLite provenance chain).

**Status:** `[SOLID]` as a persistence mechanism.

**MCP tools (22 tools across 16 tool files — all real implementations):**

Read-only (world model access):

- `ada.get_blueprint` — reads `.ada/state.json`. `[SOLID]`
- `ada.get_invariants` — reads entity invariants from blueprint. `[SOLID]`
- `ada.get_workflow` — reads workflow definitions from blueprint. `[SOLID]`
- `ada.get_world_model(stage?)` — reads any stage artifact by code. `[SOLID]`
- `ada.query_constraints(scope)` — substring match against entity names and invariants. `[HEURISTIC]`
- `ada.check_drift(description)` — keyword match against intent graph goals. `[HEURISTIC]`

Write / feedback loop:

- `ada.log_drift` — writes drift record to `provenance.db`. `[SOLID]`
- `ada.propose_amendment` — queues amendment to `.ada/amendments/{ts}-{STAGE}.json`. `[SOLID]`
- `ada.propose_agent` — queues agent proposal. `[SOLID]`
- `ada.propose_skill` — writes to `.ada/skill-proposals.json`. `[SOLID]`
- `ada.extract_skills` — reads session log, extracts repeated patterns, writes to `.ada/skill-candidates.json`. `[SOLID]`
- `ada.report_implementation_decision` — records a decision Claude Code made that differs from blueprint; writes to `.ada/session-log.jsonl`. `[SOLID]`
- `ada.report_gap` — records a gap Claude Code discovered during implementation; queued for review. `[SOLID]`

Verification:

- `ada.verify` (static) — entity/component/invariant coverage via string matching. `[HEURISTIC]`
- `ada.verify` (5-layer stack) — structural, execution, policy, outcome, provenance layers. `[SOLID]` for structural + policy; `[HEURISTIC]` for execution + provenance.

Runtime / governance:

- `ada.get_runtime_state` — reads session log + checkpoints, builds world-state snapshot. `[SOLID]`
- `ada.get_macro_plan` — topological sort from blueprint, infers completion from session log. `[SOLID]`
- `ada.checkpoint` — `git stash push` + writes to `.ada/checkpoints.json`. `[SOLID]`
- `ada.rollback_to(checkpoint)` — `git stash pop` + cleans checkpoint chain. `[SOLID]`
- `ada.get_contract(context)` — reads `.claude/contracts/{slug}.json`. `[SOLID]`
- `ada.enter_delegation` / `ada.exit_delegation` — manages `.ada/delegation-stack.json`. `[SOLID]`

**Edges:**

- `[GAP]` `check_drift` is a keyword heuristic. It will return `aligned: true` for a description that uses blueprint vocabulary even if the described change fundamentally contradicts the blueprint's intent.
- `[SHALLOW]` Provenance chain records each stage artifact with parent postcodes. But the chain is only traversable via `git log --follow .ada/ref` or direct DB queries. No tool surfaces provenance to Claude Code in a useful way.
- `[GAP]` `@ada/ent` package runs on synthetic fixtures and is not wired into the main compiler's ENT stage. The compiler uses `EntityAgent` (LLM). If the ENT integration pipeline (C3 gap resolution, 3-hop provenance, gate evaluation) is ever needed in the live pipeline, it would need to be wired into `engine.ts` with real blueprint data passed in.

---

### `ada verify`

**What it does:** Scans codebase, diffs against compiled blueprint. Coverage dimensions: entity (40%), invariant (30%), component (30%). Pass threshold: ≥0.7 and zero critical findings.

**Status:** `[HEURISTIC]` — the verification logic is heuristic throughout.

**Invariant coverage gap — critical:**
The invariant check extracts dotted property terms from predicate strings (`entity.name !== null` → looks for `name` in files). Property terms like `name`, `id`, `status` appear in virtually every TypeScript file. Invariant coverage will read near 1.0 for almost any codebase, regardless of whether invariants are actually enforced.

**Component coverage tiers:**

- Tier 1: exact name match (precise)
- Tier 2: 1/3 of declared interface methods found anywhere in codebase (loose)
- Tier 3: single keyword stem match anywhere in symbols or file paths (very loose)

A component named `UserService` passes tier 3 verification if any symbol in the codebase contains `user`. This means component coverage can read near 1.0 on a trivial codebase.

**Bottom line:** `ada verify` is most useful for catching completely unimplemented entities and components. It is NOT reliable for measuring quality of implementation or actual invariant enforcement.

`[RESEARCH NEEDED]` A semantically grounded verification engine — one that checks whether code implements the specified behavior, not just whether certain strings appear — requires either LLM-assisted analysis or formal methods integration.

---

## Ada + Claude Code Pairing Patterns

### What actually flows between Ada and Claude Code

Ada writes files. Claude Code reads them. The handoff is entirely file-based.

```
Ada → CLAUDE.md              → Claude reads at session start (every session)
Ada → .claude/agents/        → Claude reads on-demand per bounded context
Ada → hooks/pre-tool/*.sh    → Fires before every tool call (not Claude's decision)
Ada → .claude/settings.json  → Claude reads at session start (hook registration, MCP config)
Ada → .ada/state.json        → MCP server reads on ada.get_world_model()
```

**What Claude Code does with this:**

- Orients on project scope, component list, build order from CLAUDE.md
- Invokes agents when working in a domain — gets invariants and workflow steps
- Has hooks firing in the background (transparent to Claude unless a hook blocks)
- Can query Ada's world model via MCP tools at any point

### Effective pairing patterns (verified from use)

**Pattern 1: Blueprint-first build**
Run `ada compile` before any code exists. Claude Code gets full architecture blueprint, entities, workflows before writing a single file. The blueprint defines the space of what gets built.

**Pattern 2: Mid-build scope change**
New feature idea mid-build: run `ada compile --amend "add [new scope]"` from the project directory. Prior blueprint is preserved. New components and entities are appended. Claude Code's next session has the updated artifact.

**Pattern 3: Drift detection gate**
`ada verify` runs on every commit (via `.git/hooks/post-commit`). Coverage report surfaces what has diverged from the compiled blueprint. Can be run in `--comment` mode for GitHub PR comments.

**Pattern 4: Constraint query before modification**
Before modifying an entity, Claude Code calls `ada.query_constraints("entity-name")` via MCP. Gets the invariants and workflow steps for that entity. Reduces invariant violation.

### Gaps in the pairing

**`[GAP]` No feedback loop from Claude Code to Ada.**
Claude Code implements. If it makes an implementation decision that differs from the blueprint (better approach found, scope clarified during build), there is no mechanism to update the blueprint. The world model becomes stale as code grows.

**`[GAP]` Agents are passive.**
Agent files contain everything Claude Code needs, but Claude Code must proactively invoke them. There is no mechanism that says "you are about to write to the Payment domain — load the payment agent." Subagent invocation depends on Claude Code's own judgment.

**`[GAP]` Hook effectiveness is unmeasured.**
Hooks fire, but whether they actually change Claude Code's behavior vs. producing noise is unknown. A hook that fires frequently and is consistently overridden by the user creates friction without protection.

**`[GAP]` Session context window vs agent depth.**
As Claude Code's context fills with code, CLAUDE.md's instructions compress under attention. The 150-line target for CLAUDE.md is based on context degradation research, but the actual inflection point where blueprints lose influence is unknown for this specific interaction pattern.

---

## Where Research Is Needed

### 1. Hook effectiveness measurement

**Question:** Do pre-tool hooks actually reduce invariant violations vs. a baseline with no hooks?
**Method:** Controlled build: same intent, same Claude Code session, with and without hooks. Count invariant violations in final code.
**Why it matters:** Hooks are architecturally central to Ada's enforcement model. If they're noise rather than signal, the architecture needs revision.

### 2. Blueprint influence on Claude Code output quality

**Question:** Does a compiled Ada blueprint produce better final code than a well-written CLAUDE.md written by hand?
**Method:** A/B on same intent: (a) Ada-compiled CLAUDE.md + agents + hooks vs. (b) hand-written equivalent. Human evaluation of output quality, invariant adherence, and scope alignment.
**Why it matters:** Ada's value proposition depends on this being measurably true.

### 3. Requirement coverage rate

**Question:** What percentage of requirements in a user's intent end up as implemented behaviors in the final code, with vs. without Ada?
**Why it matters:** The academic baseline (LLMREI, arxiv 2507.02564) captures ~70% of requirements via LLM interview. Ada claims higher via 8-stage compilation + governor gate. This claim is unvalidated.

### 4. Semantic verification

**Question:** Can we build an `ada verify` that actually checks whether code implements the specified behavior, not just whether strings match?
**Approach:** Use LLM to compare function bodies against Hoare triple specifications. Match state machine transitions against actual state transitions in code. This requires LLM calls in the verify path — currently all static.
**Why it matters:** The current verify scores are misleadingly high. A semantically grounded verify would be a genuine quality signal.

### 5. --amend stability

**Question:** How many amend cycles before the blueprint becomes internally inconsistent?
**Method:** Repeatedly amend the same project with incremental scope changes. Measure coherence score trajectory. Count contradictions introduced by additive compilation.
**Why it matters:** The --amend feature is new. The prompt-level injection for incremental compilation is untested at scale.

### 6. Optimal CLAUDE.md token budget

**Question:** At what CLAUDE.md length does Claude Code's adherence to blueprint instructions begin to degrade?
**Research basis:** arxiv 2601.11564 ("Context Discipline and Performance Correlation") shows degradation is systematic but the exact inflection point for instruction-following (vs. code retrieval) in agentic sessions is not established.
**Why it matters:** The 150-200 line target is practitioner consensus. It should be empirically derived.

---

## Research Conformance Table — 2026

| Paper                                                            | Claim                                                                                                                   | Ada's implementation                                                                                              | Status                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2603.17150 Microsoft Research — "Intent Formalization"           | Intent gap is named, formal. Closing it requires multi-stage formalization.                                             | Ada's 8-stage pipeline is a production implementation of this. INT→ENT→PRO→SYN = progressive formalization.       | `[SOLID]` — architecture validates the claim               |
| 2602.20478 Vasilopoulos — "Codified Context"                     | Three-tier architecture (hot/domain/cold) is the validated pattern for agentic coding. Built by hand over 283 sessions. | CLAUDE.md = hot memory. agents/ = domain specialists. hooks/ = cold enforcement. Ada compiles this automatically. | `[SOLID]` — Ada automates what Vasilopoulos built manually |
| 2507.13334 Mei et al. — "Context Engineering Survey"             | Systematic optimization of information payloads for LLMs. Three-tier pattern is the recognized architecture.            | Ada is a production context engineering system. The 8-stage pipeline is a structured optimization pass.           | `[SOLID]` — Ada practices the formal discipline            |
| 2601.11564 — "Context Discipline and Performance Correlation"    | Instruction-following degrades as context length increases.                                                             | Validates CLAUDE.md token budget (lean hot memory, detail in agents).                                             | `[SOLID]` — architecture decision is validated             |
| 2510.05381 — "Context Length Alone Hurts LLM Performance"        | Even with perfect retrieval, performance degrades with input length.                                                    | Validates distributing context across three tiers (not all in CLAUDE.md).                                         | `[SOLID]` — validates the distributed architecture         |
| 2507.02564 LLMREI — "Requirements Elicitation Interviews"        | LLM interview captures ~70% of requirements.                                                                            | Ada claims higher via multi-stage + governor gate. **Claim is unvalidated.**                                      | `[RESEARCH NEEDED]`                                        |
| 2508.18675 ReDeFo — "Requirements Development and Formalization" | Multi-agent + formal methods pipeline. Research prototype.                                                              | Ada ships.                                                                                                        | `[SOLID]` — Ada is ahead                                   |
| 2505.07270 SpecFix — "Ambiguous Requirements Repair"             | Natural language ambiguity in requirements directly causes code generation failure.                                     | Validates Ada's elicitation phase: resolve before compiling.                                                      | `[SOLID]` — validates the "before" position                |
| 2505.19443 — "Vibe Coding vs. Agentic Coding"                    | Vibe-to-agentic gap is a formally recognized problem.                                                                   | Ada bridges vibe (plain language) to agentic (governed execution).                                                | `[SOLID]` — Ada's exact position is validated              |
| 2602.05447 — "Structured Context Engineering"                    | Structured context (YAML, Markdown) outperforms unstructured for agentic systems.                                       | Ada's output is structured Markdown with formal invariant predicates.                                             | `[SOLID]` — validates output format                        |

**Not validated by any research:**

- Ada's governor gate coherence scoring
- Ada's provenance chain (postcode system)
- Ada's 8-stage depth vs simpler 2-3 stage alternatives
- Hook effectiveness as deterministic enforcement
- The specific 150-200 line CLAUDE.md threshold

---

## Known Gaps Summary

| Gap                                                    | Severity | Status                                                                                                             |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------ |
| Blueprint missing file tree                            | High     | **CLOSED** — BLD stage derives file tree per component                                                             |
| Blueprint missing tech stack resolution                | High     | **CLOSED** — BLD stage selects stack preset                                                                        |
| Blueprint missing dependency manifest                  | High     | **CLOSED** — BLD stage derives deps + devDeps                                                                      |
| Blueprint missing acceptance criteria                  | High     | **CLOSED** — BLD stage derives one criterion per BC                                                                |
| PER stakeholder vocabulary not written to agents       | High     | config-writer agents.ts: add ubiquitousLanguage section                                                            |
| SYN openQuestions/resolvedConflicts not surfaced       | Medium   | Post-compile summary + CLAUDE.md                                                                                   |
| SYN nonFunctional requirements not in agents/CLAUDE.md | Medium   | config-writer + claude-md.ts                                                                                       |
| VER gaps and drifts not shown to user                  | High     | Post-compile summary                                                                                               |
| GOV violations not shown to user                       | High     | Post-compile summary                                                                                               |
| Invariant coverage in `ada verify` is always high      | Critical | Semantic verification needed                                                                                       |
| Hook effectiveness unmeasured                          | Critical | Controlled experiment needed                                                                                       |
| No Claude Code → Ada feedback loop                     | High     | **CLOSED** — `propose_amendment`, `report_implementation_decision`, `report_gap`, session log, `review-amendments` |
| Workflow step→context assignment is keyword matching   | Medium   | Better bounded context resolution                                                                                  |
| No per-stage targeted recompilation on ITERATE         | Medium   | Stage-targeted rerun capability                                                                                    |
| Agent description is low-selectivity                   | Low      | Richer invocation descriptions                                                                                     |
| --amend stability untested at scale                    | Medium   | Multiple amend cycles on real projects                                                                             |
| BUILD.md not referenced in CLAUDE.md template          | Low      | Add pointer to BUILD.md in config-writer claude-md.ts                                                              |
| `@ada/ent` not wired into main compiler pipeline       | Medium   | Standalone harness on synthetic fixtures; `engine.ts` uses `EntityAgent`                                           |

---

## What Is Genuinely Strong

These are the parts of Ada where the implementation matches the architectural intent:

1. **The pipeline's accumulation property.** Each stage is grounded in all prior stages. By SYN, the blueprint is grounded in: codebase vocabulary, extracted goals, domain context, entity model, process model, and structural audit. This is the strongest property of the design.

2. **The separation of concerns.** Ada compiles WHY and WHAT. Claude Code executes HOW. The interface (CLAUDE.md + agents + hooks) is file-based and inspectable. This separation is the right architecture — validated independently by the Vasilopoulos paper.

3. **Provenance.** Every artifact is content-addressed (git object store). Every stage records its parent. `git log --follow .ada/ref` gives the full compilation history. This is the correct foundation for an intent authority system.

4. **The elicitation classifier.** Pure function, no LLM, no I/O. Correctly assigns 0–5 questions based on domain signals. Tested directly in the codebase. The "before building starts" position is right.

5. **Hooks as out-of-context enforcement.** The architectural idea — enforcement that fires regardless of context window state — is correct. The current implementation is heuristic, but the pattern is right. Hooks that actually evaluate predicates would be a major upgrade.

6. **Ada happening before.** The categorical differentiator is real and survives any competitive challenge. MEMORY.md is retrospective. Cursor Rules are written during or after. Ada is prospective — compiled before the first file opens. This position is both factually unique and academically validated (2505.07270).
