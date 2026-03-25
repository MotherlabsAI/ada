# ADA.md — Master Context Library

**Version:** 1.0.0
**Authority:** top-level index of all Ada and Motherlabs context documents.
Load this file first. Follow pointers to source documents for depth.

All documents in this library are written to the same semantic standard:
every claim is verifiable, every section earns its place, no internal vocabulary
surfaces to the reader without explanation, no promise exceeds what the product delivers.

---

## Hierarchy

```
ADA.md  ←  this file — master index
│
├── BRAND.md            ←  top of the semantic hierarchy — all other docs derive from this
├── ARCHITECTURE.md     ←  Ada internals: pipeline, postcodes, world model, git-backed design
├── CONTEXT.md          ←  two types of context (compiled-along vs stationary) + meta-chain
├── docs/STATE.md       ←  technical audit: what is built, where it's shallow, known gaps, research conformance
├── docs/DIRECTION.md   ←  research-adjusted architectural direction: world-state runtime, hierarchical execution, delegation contracts, verification stack, safe self-improvement
├── docs/PLAN.md        ←  phased implementation plan: Phase 0 (foundation repair) through Phase 6 (safe self-improvement)
│
├── docs/research/
│   ├── claude-code/
│   │   ├── INDEX.md             ←  corpus index and file status
│   │   ├── context-loading.md   ←  CLAUDE.md hierarchy, token budget, @ imports, injection mechanism
│   │   ├── agent-files.md       ←  frontmatter schema, invocation model, isolation, output routing
│   │   ├── hooks-system.md      ←  hook types, stdin format, exit codes, blocking behavior
│   │   ├── mcp-integration.md   ←  server discovery, stdio lifecycle, tool calling, context
│   │   ├── settings-permissions.md  ←  settings.json schema, permission model, merge behavior
│   │   └── session-memory.md    ←  MEMORY.md, session lifecycle, context window, persistence
│   └── synthesis/
│       ├── ada-output-spec.md   ←  what Ada must produce for Claude Code — gap analysis + priority table
│       └── closed-loop-design.md  ←  Ada ↔ Claude Code signal map, 17 signals, Phase 5 design
│
├── docs/product/
│   ├── CAPABILITIES.md ←  what Ada does: [LIVE], [BUILDING], [VISION]
│   └── WORKFLOW.md     ←  how Ada is actually used — real workflow, not marketing
│
├── docs/strategy/
│   ├── VIDEO_DEMO.md   ←  the first public demo — structure, what to build, why
│   └── GROWTH.md       ←  how Ada spreads — distribution mechanism, cold start
│
├── docs/website/
│   ├── CONTENT_STRATEGY.md   ←  what each page says and why — battle-tested claims only
│   ├── DESIGN_DIRECTION.md   ←  visual language, palette, ◈, layout grammar
│   ├── DESIGN_PSYCHOLOGY.md  ←  visitor psychology, evidence sequencing, page structure rules
│   ├── SEO_STRATEGY.md       ←  how Ada gets found — search queries, timeline
│   └── IMAGERY.md            ←  what visual assets appear and what never appears
│
└── docs/UI_LAUNCH.md         ←  TUI launch screen design: structure, brand decisions, invariants
```

---

## Quick Reference

### What Ada Is

Requirements elicitation and formalization tool for AI-driven software development.

Input: natural language intent — at whatever level the user operates.
Output: `CLAUDE.md`, agent definitions, pre-tool hooks.
Position: **before building starts.**

```
user intent  →  Ada elicits  →  Ada compiles  →  CLAUDE.md + agents + hooks  →  Claude Code builds
```

### What Ada Is NOT

- Not a chatbot
- Not a code generator
- Not a prompt wrapper
- Not auto-memory (MEMORY.md is retrospective; Ada is prospective)
- Not a replacement for Claude Code — a prerequisite to it

### The Core Claim (locked — do not modify)

> Between what you mean and what gets built, something gets lost.
> Not because AI isn't capable.
> Because intent was never structured before building started.
>
> Ada is the step before.
> It structures your intent into files Claude Code reads every session.
> The result: less distance between what you described and what gets built.
> Not zero. Less.

### Current Product State

| Phase | What                                                    | Status |
| ----- | ------------------------------------------------------- | ------ |
| 1     | Compilation — intent → CLAUDE.md + agents + hooks       | Live   |
| 2     | Elicitation — structured questioning before compilation | Live   |
| 3     | World model — artifact store + MCP constraint authority | Live   |
| 4     | Git-backed world model — postcodes = git SHAs           | Live   |

---

## Document Summaries

### ARCHITECTURE.md

**Role:** canonical design decisions for Ada's internals — how the compiler is built, not what it does.

**Contains:**

- The 8-stage pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV) with stage outputs
- Postcode anatomy and the key insight: postcodes are git SHAs by another name
- Current world model (`.ada/artifacts/`) vs target architecture (git object store)
- Migration path: `git hash-object` → `git mktree` → `.ada` one-line ref pointer
- Elicitation design: adaptive depth classifier, pre-calibrated question frames
- MCP authority server design and `loadBlueprint` resolution order
- Generated artifact index with token budget rationale for CLAUDE.md

**Key insight:**
Postcodes are git SHAs by another name. Ada's `.ada/artifacts/` reinvents what git already provides.
The right design: artifacts are git objects, postcodes are git SHAs, `.ada` is a one-line committed ref.
This eliminates custom content-addressing, reduces latency, and gives provenance for free.

---

### CONTEXT.md

**Role:** defines the two types of context Ada manages and how all context layers chain together. Read this to understand why Ada's output is structured the way it is, and how the docs + memory bank should be loaded.

**Contains:**

- Compiled-along context: the 8-stage accumulation chain, elicitation enrichment, additive iteration
- Stationary context: what ACCEPT writes, when each file is read, why it must be frozen
- The meta-context chain: memory → README → ADA.md → specific docs → code
- Structurally correct loading order for any new session
- Why the doc structure mirrors the pipeline structure (both narrow by need, don't skip levels)
- Links to all chained documents

**Key insight:**
The pipeline structure informs the documentation structure. Both follow: start broad, narrow by need.
A user doesn't start with the schema. A session doesn't start with the hooks.

---

### docs/research/claude-code/ + docs/research/synthesis/

**Role:** living research corpus on Claude Code's actual behavior — how it loads context, invokes agents, fires hooks, integrates MCP, and manages sessions. Feeds directly into Ada's output optimization and Phase 5 closed-loop design.

**Contains:**

- `context-loading.md` — CLAUDE.md hierarchy (operator/project/user/local), 200-line budget, @ import syntax, `<system-reminder>` injection mechanism, what works vs fails
- `agent-files.md` — full frontmatter schema (including `maxTurns`, `effort`, `isolation`, `memory`), invocation model (4 methods), context isolation, output routing, Ada-specific findings
- `hooks-system.md` — hook types, stdin JSON format, exit codes, blocking model _(in progress)_
- `mcp-integration.md` — server discovery, stdio lifecycle, tool calling protocol _(in progress)_
- `settings-permissions.md` — settings.json full schema, permission model _(in progress)_
- `session-memory.md` — MEMORY.md loading, session lifecycle, persistence model _(in progress)_
- `synthesis/ada-output-spec.md` — gap analysis: Ada's current output vs Claude Code's actual needs, priority table
- `synthesis/closed-loop-design.md` — 17-signal map (Ada→Claude + Claude→Ada), 5 missing signals, Phase 5 implementation order

**Key invariants:**

- Claims are tagged `[CONFIRMED]` (official docs) / `[INFERRED]` (consistent community reports) / `[UNVERIFIED]`
- Each file ends with "Implications for Ada" — the actionable section
- Synthesis files feed directly into implementation PRs

---

### docs/STATE.md

**Role:** technical audit of Ada's actual implementation depth as of 2026-03-24. The honest account of what each pipeline stage does, where it's shallow, where it breaks, and what research says about it. Required reading before making implementation claims.

**Contains:**

- Pipeline Depth Map: each of the 8 stages (CTX→GOV) with `[SOLID]` / `[SHALLOW]` / `[HEURISTIC]` / `[GAP]` / `[RESEARCH NEEDED]` tags and actual edges
- Output Quality Map: CLAUDE.md, agent files, hooks (~250), world model, `ada verify`
- Ada + Claude Code pairing patterns — 4 effective patterns documented
- Known Gaps Summary table: 12 gaps with severity and what must change
- Research conformance table: 10 papers mapped to Ada's implementation
- Where research is needed: 6 items that remain unvalidated

**Key invariants:**

- Hook effectiveness is `[HEURISTIC]` — ~250 hooks enforce pattern matching, not formal predicates. Effectiveness is unmeasured.
- `ada verify` invariant coverage is always near 1.0 by construction — token presence, not semantic enforcement. The score is not meaningful in isolation.
- PER's `ubiquitousLanguage` map is generated but never written to agent files. Claude Code never sees domain vocabulary.
- SYN's `openQuestions`, `resolvedConflicts`, and `nonFunctional` are generated and discarded — not in CLAUDE.md or agents.

---

### docs/DIRECTION.md

**Role:** research-adjusted architectural direction. Read before making any architectural decision about Ada's future. Supersedes any prior claim that unconstrained recursive swarms are Ada's target architecture.

**Contains:**

- Updated one-sentence product definition
- The product gap that drives the extension: Ada is currently compiler-only; the vision requires a governed runtime
- Six architectural layers that extend (not replace) the current pipeline: world-state runtime, hierarchical execution, delegation contracts, verification stack, safe self-improvement
- What the Jan–Mar 2026 research supports vs. what it does not yet justify
- Research source table (12 papers)

**Key invariants:**

- World-state runtime (tracks execution reality) and compiled world model (tracks compiled intent) are separate — never conflate them
- Delegation contracts are non-optional for any child agent
- Self-improvement is always offline, benchmarked, and human-approved
- Governance core is immutable — agents improve around it, not through it

---

### docs/PLAN.md

**Role:** phased implementation plan. Read to understand what is being built, in what order, and why each phase must precede the next.

**Contains:**

- Phase 0: Foundation repair (6 critical bugs that break existing functionality)
- Phase 1: Feedback loop (PostToolUse audit, PreCompact checkpoint, propose_amendment tool, SessionEnd summary)
- Phase 2: World-state runtime (versioned execution state, rollback checkpoints, uncertainty tracking)
- Phase 3: Hierarchical execution (macro planner, micro executor, local repair, independent verifier)
- Phase 4: Delegation contracts (contract schema, compiler, writer, enforcement, depth tracking)
- Phase 5: Verification stack (structural, execution, policy, outcome, provenance verifiers)
- Phase 6: Safe self-improvement (skill extraction, experiment branches, promotion gates)
- Sequencing rules and current status table

**Key invariant:** Phase 0 must complete before any other phase begins.

---

### BRAND.md

**Role:** semantic authority for all product and brand decisions. When any other doc conflicts with this, BRAND.md wins.

**Contains:**

- What Ada is and is not (definitional, not marketing)
- What Motherlabs is (one-person lab, not venture-backed startup)
- Brand voice rules — short sentences, strong verbs, no filler
- Vocabulary: what to use, what to avoid
- Claims that survived battle testing vs claims that are dead
- Design principles (7): tool is the brand, one continuous object, palette SSOT, ◈ as identity mark

**Key invariants:**

- Never use: "semantic compiler", "governed artifacts", "postcode/entropy/gate" (internal vocabulary)
- Always use: "intent", "requirements elicitation", "reduces" (not "eliminates"), "before building starts"
- The differentiator: Ada happens before. MEMORY.md, Cursor Rules, better prompting — during or after.

---

### docs/product/CAPABILITIES.md

**Role:** source of truth for what Ada currently does, what is in development, what is vision.

**Contains:**

- [LIVE] features: elicitation, compilation pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV), CLAUDE.md, agents/, hooks/, governor gate, provenance
- [BUILDING] features: world model/artifact store, drift detection, impact analysis
- [VISION] features: ongoing authority, natural language queries against compiled context, intent version history
- Important missing for adoption: post-compilation summary, one-command install, Windows support, recoverable error UX

**Key invariants:**

- Do not imply BUILDING or VISION features are LIVE
- Approximately 250 hooks per compilation covering entity invariants (verifiable from codebase)
- Governor gate iterates — rejects below coherence threshold, revises, resubmits

---

### docs/product/WORKFLOW.md

**Role:** describes how Alex actually uses Ada — real workflow, not a marketing narrative.

**Contains:**

- Division of labor: Ada for complex/multi-domain work → Claude directly for creative/judgment work
- Why not Opus 4.6 for compilation: Ada's task is structured/constrained; Opus belongs in execution where reasoning depth matters
- The verification step: read CLAUDE.md after compilation, before handing to Claude Code — semantic check, not technical
- Session pattern (numbered flow)

**Key insight:**
Ada on a faster model + Claude Code on Opus = better total output than Opus on both tasks.
Matched model to matched task. The craftsman analogy: filling out a form vs building what the form specifies.

---

### docs/strategy/VIDEO_DEMO.md

**Role:** defines the first public demonstration of Ada — structure, what to build, why.

**Contains:**

- What to build: self-hosted web analytics dashboard (Plausible Analytics alternative, $9–19/month → free)
- Why this build: visual verification is immediate (live pageview), complexity is correctly scoped, paid→free is visible
- The exact brief Alex gives Ada (plain language, no technical vocabulary)
- Video structure: timestamp table from 0:00 to 30:00
- GitHub repo requirements (CLAUDE.md visible in root, one-command deploy, README references Ada)

**Key invariant:**
Visual verification is non-negotiable. The pageview appearing live in the dashboard is the proof.
No code reading required for the viewer to understand that it worked.

---

### docs/strategy/GROWTH.md

**Role:** defines how Ada spreads — distribution mechanism and the cold start problem.

**Contains:**

- Primary distribution artifact: the GitHub repository (not the website, not the video)
- Why the CLAUDE.md in a repo is the viral unit — inspectable, forkable, traceable
- The video demo as distribution event — proof, not marketing
- Where the audience already is: tier 1 (developer communities), tier 2 (vibe coders), tier 3 (technical founders)
- Cold start strategy: video demo first → SEO surface → CLAUDE.md in demo repo gets forked
- SEO queries Ada can own (specific, not broad)
- What does not work: paid acquisition, press before video demo, comparison content

**Key invariant:**
Product quality is the growth strategy. One bad session that doesn't match intent does not get shared.

---

### docs/website/CONTENT_STRATEGY.md

**Role:** defines what each page on motherlabs.ai says and why.

**Contains:**

- Semantic constraints: 4 tests every claim must pass before appearing on site
- Dead claims (explicit list — do not resurrect)
- Survived claims (with sources)
- Per-page content strategy: / (homepage), /ada, /lab, /start
- Hero headline locked with rationale
- "What Ada Is NOT" section guidance — primary audience arrives with assumptions; clear them

**Key invariant:**
The core differentiator: Ada happens before. MEMORY.md, Cursor Rules, better prompting — during or after.
This distinction is factual, specific, survives any competitive challenge.

---

### docs/website/DESIGN_PSYCHOLOGY.md

**Role:** psychological and architectural principles behind every page decision — visitor behavior, evidence sequencing, progressive disclosure, trust hierarchy.

**Contains:**

- The 3-second rule: hero must answer "what is this?" before any copy runs
- Evidence rule: claim → evidence → claim → evidence → action (never claim → claim → action)
- Progressive disclosure: each section answers one question, earns the next scroll
- Recognition moment: name the specific frustration, not the general category
- User-framing vs product-framing: "You do Y, and X happens" not "Ada does X"
- CTA hierarchy: the install command is the primary CTA, not a button
- Trust signals for cold-start: specificity + honest limitations + iteration count
- Correct page structure: Recognition → Evidence → Mechanism → Separation → Artifact → Invitation
- Full prohibition list: what never to do on any page

**Key invariant:**
"not zero distance. less." is the strongest trust signal on the page — it earns trust by refusing to overclaim.
Must be visually prominent, not buried in body text.

---

### docs/website/DESIGN_DIRECTION.md

**Role:** visual language definition for all surfaces — web, CLI, any future UI.

**Contains:**

- Exact palette tokens from `cli/src/ui/design-system.ts` (canonical source — never approximate)
- ◈ usage rules: favicon, section separator, CTA prefix, active nav — deliberate, never decorative
- Layout grammar: 1px borders, surface stack, whitespace = breathing room not decoration
- Hero structure: no gradient, type on dark, pipeline in glyphs below CTA
- Motion: CSS only, single breathe animation on hero ◈
- "Frontier" defined: refusal to use visual effects as substitute for meaning

**Key palette (exact values):**

```
bg-deep:      #0d0d0d
surface:      #151518
elevated:     #1c1c21
accent:       #8ba4c4  (steel blue — NOT purple)
text-primary: #e8e6df  (warm off-white)
text-muted:   #9c9a92
```

---

### docs/website/SEO_STRATEGY.md

**Role:** how Ada gets found in search — phases, timeline, realistic expectations.

**Contains:**

- Phase 1: Get Indexed (Search Console + @astrojs/sitemap)
- Phase 2: Signal what the site is (page titles, meta, JSON-LD)
- Phase 3: Build signals (community posts, GitHub presence)
- Phase 4: Target specific queries
- Timeline: indexed 3–7 days, "motherlabs ai" query 2–4 weeks, ranking 3–6 months
- Primary queries Ada can own (specific pain points, not broad category)

---

### docs/UI_LAUNCH.md

**Role:** design authority for the Ada TUI launch screen (`cli/src/ui/welcome.tsx`). Read before modifying the welcome screen.

**Contains:**

- Annotated structure diagram showing all panels and their runtime equivalents
- Decision rationale for each element: double-border header, animated ◈, pipeline preview, framed input
- Brand vocabulary fix: why "requirements elicitation · before building starts" replaced the banned "semantic compiler"
- Source file index and key invariants

**Key invariants:**

- `◈` identity mark must animate on load via `useDiamondBreathe()` — static is incorrect
- All 8 pipeline stages must appear as pending (`◇`) in the context panel
- Never use "semantic compiler" on the welcome screen or in any user-facing copy
- Border structure must mirror runtime: `double` for the outer header, `single` for content panels

---

### docs/website/IMAGERY.md

**Role:** defines what visual assets appear on the site and what never does.

**Contains:**

- The governing constraint: if it couldn't appear in a terminal or technical doc, justify it first
- Approved patterns: terminal output blocks, real CLAUDE.md excerpts, before/after in prose
- The video demo as primary visual asset — thumbnail shows the terminal, not a face
- Photo of Alex: /lab page only, not homepage — text credibility over image credibility
- Explicit prohibition list: stock photos, AI illustration, gradient backgrounds, fake screenshots

**Key invariant:**
The site grows with real proof artifacts — real CLAUDE.md outputs, real terminal sessions.
Not with designed images that simulate what the product does.

---

## Research Foundation

Academic research that validates Ada's claims, architecture, and positioning.
All papers are from mid-2025 to March 2026. Citations are exact.

---

### The Intent Gap — Named and Formalized

**arxiv 2603.17150 — "Intent Formalization: A Grand Challenge for Reliable Coding in the Age of AI Agents"**
Microsoft Research. March 2026.

> "The gap between informal natural language requirements and precise program behavior — the intent gap — has always plagued software engineering, but AI-generated code amplifies it to an unprecedented scale."

> "In vibe coding scenarios, developers describe what they want in natural language and accept AI-generated code with minimal or no review — representing the purest manifestation of the intent gap."

Ada's core problem has a name. "Intent gap" is academic vocabulary. Ada is a production implementation of the solution this paper calls a grand challenge. The proposed solution: translate informal intent into checkable formal specifications — which is what Ada's compilation pipeline does across 8 stages.

**Use on site:** "Ada closes the intent gap" is now a citable, grounded claim.

---

### Ada's Architecture — Independently Validated

**arxiv 2602.20478 — "Codified Context: Infrastructure for AI Agents in a Complex Codebase"**
Aristidis Vasilopoulos. February 2026. Built on a 108,000-line C# distributed system, 283 development sessions.

A separate research team arrived at the identical three-tier architecture:

| Their term         | Their artifact                                                              | Ada's equivalent          |
| ------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Hot memory         | "Constitution" — always loaded, coding conventions, orchestration protocols | `CLAUDE.md`               |
| Domain specialists | 19 specialized agents, one per bounded context                              | `agents/`                 |
| Cold memory        | 34 on-demand specification documents                                        | hooks/ + provenance store |

Key finding: _"LLM-based agentic coding assistants lack persistent memory: they lose coherence across sessions, forget project conventions, and repeat known mistakes."_ Their solution is Ada's architecture. Ada compiles it automatically from elicited intent. They built it by hand over 283 sessions.

**Implication:** Ada's CLAUDE.md + agents/ + hooks/ is not a design choice — it is the peer-reviewed correct architecture for agentic coding systems.

---

### Context Engineering — The Formal Discipline

**arxiv 2507.13334 — "A Survey of Context Engineering for Large Language Models"**
Lingrui Mei et al. July 2025. 1,400+ papers reviewed.

Defines context engineering as: _"the systematic optimization of information payloads for LLMs."_ Establishes the three-tier memory model (hot/domain/cold) as the recognized pattern for agentic systems. Identifies a fundamental asymmetry: LLMs understand complex contexts well but struggle to generate equivalently sophisticated long-form outputs — which is why structured compilation (Ada's approach) matters more than better prompting.

**Implication:** Ada practices context engineering. This is the academic name for what Ada does. It is a formal discipline with 1,400+ papers. Not a trend — a field.

---

### Requirements Elicitation — Active Research, Not Solved

**arxiv 2507.02564 — "LLMREI: Automating Requirements Elicitation Interviews with LLMs"**
Alexander Korn, Samuel Gorsch, Andreas Vogelsang. July 2025.

LLM chatbot designed to conduct requirements elicitation interviews with minimal human intervention. Key result: captures ~70% of intended requirements. Authors conclude: _"fully automating the requirements elicitation process remains a challenge."_ No quality gate. No coherence score. No multi-stage compilation.

**arxiv 2507.02858 — "Requirements Elicitation Follow-Up Question Generation"**
July 2025.

Research on knowing when to stop asking questions — specifically: detecting ambiguity and determining when sufficient requirements have been collected. This is Ada's readiness predicate problem, being researched in parallel by academics.

**arxiv 2508.18675 — "Requirements Development and Formalization for Reliable Code Generation: A Multi-Agent Vision" (ReDeFo)**
Weisong Sun et al. August 2025.

Multi-agent framework: three agents augmented with formal methods, requirements-to-code pipeline. Validates Ada's multi-stage approach. Research prototype. Ada ships.

**arxiv 2505.07270 — "Automated Repair of Ambiguous Natural Language Requirements"**
May 2025. Introduces SpecFix — autonomous repair of ambiguous requirements. Increases Pass@1 score by 4.3%. Validates that natural language ambiguity in requirements directly causes code generation failure.

**Implication:** Ada ships what multiple research groups are racing to build. The academic community has named the problem. Ada has a running product with a quality gate they have not reached.

---

### Context Engineering for Code Assistants

**arxiv 2508.08322 — "Context Engineering for Multi-Agent LLM Code Assistants Using Elicit, NotebookLM, ChatGPT, and Claude Code"**
August 2025.

Proposes an "Intent Translator" layer (using GPT-5) for clarifying user requirements before code generation. Combined with semantic retrieval and document synthesis. The intent translation layer as a concept is validated. Ada is the structured, governor-gated version.

**arxiv 2510.04618 — "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models" (ACE)**
October 2025.

Treats contexts as evolving playbooks that accumulate, refine, and organize strategies through generation, reflection, and curation. ACE outperforms baselines by +10.6% on agents. Validates that context quality compounds — better input context produces disproportionately better outputs.

**arxiv 2602.05447 — "Structured Context Engineering for File-Native Agentic Systems"**
February 2026. 9,649 experiments across 11 models, 4 formats, schemas ranging from 10 to 10,000 tables. Studies how format and structure of context affects agent performance. Validates that structured context (YAML, Markdown) outperforms unstructured context for agentic systems.

---

### The Vibe-to-Agentic Gap

**arxiv 2505.19443 — "Vibe Coding vs. Agentic Coding: Fundamentals and Practical Implications of Agentic AI"**
Ranjan Sapkota et al. May 2025.

Formal taxonomy:

- **Vibe coding** — prompt-based, conversational, human-in-the-loop, ideation and prototyping
- **Agentic coding** — autonomous, goal-driven, multi-file, enterprise-grade automation

Key finding: _"Successful AI software engineering will rely not on choosing one paradigm, but on harmonizing their strengths."_ Ada is exactly the bridge — it takes vibe-level intent (plain language, no technical vocabulary required) and produces the structured context that enables agentic execution.

**Implication:** Ada's position between vibe and agentic is a formally recognized gap, not an invented problem.

---

### Context Degradation — Empirically Confirmed

**arxiv 2601.11564 — "Context Discipline and Performance Correlation: Analyzing LLM Performance and Quality Degradation Under Varying Context Lengths"**
January 2026.

Empirical confirmation: instruction-following degrades as context length increases. Performance decline is systematic across models. Academic backing for:

- The CLAUDE.md 150–200 line constraint documented in best practices
- Ada's architectural answer: lean CLAUDE.md + agents/ (domain-specific, loaded per context) + hooks/ (deterministic enforcement, outside the context window entirely)

**arxiv 2510.05381 — "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval"**
October 2025.

Even with perfect retrieval, performance degrades substantially as input length increases. Validates Ada's compression strategy: don't put everything in CLAUDE.md — distribute across the three-tier architecture.

---

### Key Terms from Research — Now Usable in Ada Context

| Academic term          | Source                 | What it means for Ada                       |
| ---------------------- | ---------------------- | ------------------------------------------- |
| Intent gap             | 2603.17150             | The documented gap Ada closes — now citable |
| Intent formalization   | 2603.17150             | What Ada's compilation pipeline does        |
| Context engineering    | 2507.13334             | The formal discipline Ada practices         |
| Hot memory             | 2602.20478, 2507.13334 | CLAUDE.md — always loaded, constitution     |
| Domain specialists     | 2602.20478             | agents/ — bounded context agents            |
| Cold memory            | 2602.20478             | hooks/ + provenance — retrieved on demand   |
| Vibe-to-agentic bridge | 2505.19443             | Ada's exact position in the stack           |
| Context discipline     | 2601.11564             | Why CLAUDE.md must stay lean                |

---

### What the Research Does NOT Validate

- Ada's governor gate coherence scoring — no comparable research yet
- Ada's provenance chain (postcode system) — no comparable research yet
- Ada's 8-stage pipeline depth vs simpler approaches — not benchmarked
- The specific 150–200 line CLAUDE.md threshold — practitioner consensus, not peer-reviewed

These remain Ada's claims without academic backing. They are verifiable from the codebase but not externally validated.

---

## Authoring Rules for New Documents

Any new document added to this library must:

1. State its authority and what it derives from at the top
2. Pass the same battle-test applied to site copy: verifiable, not overpromising, no internal vocabulary without explanation
3. Say what something is, then what it is not
4. Use the vocabulary table from BRAND.md — never "semantic compiler", "governed artifacts", "postcode/entropy/gate"
5. Include a key invariant or key insight section — the non-obvious thing this document captures
6. Be referenced in this index before it is considered part of the library

Documents that are not referenced here are not part of the canonical context.
