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
│
├── docs/product/
│   ├── CAPABILITIES.md ←  what Ada does: [LIVE], [BUILDING], [VISION]
│   └── WORKFLOW.md     ←  how Ada is actually used — real workflow, not marketing
│
├── docs/strategy/
│   ├── VIDEO_DEMO.md   ←  the first public demo — structure, what to build, why
│   └── GROWTH.md       ←  how Ada spreads — distribution mechanism, cold start
│
└── docs/website/
    ├── CONTENT_STRATEGY.md   ←  what each page says and why — battle-tested claims only
    ├── DESIGN_DIRECTION.md   ←  visual language, palette, ◈, layout grammar
    ├── SEO_STRATEGY.md       ←  how Ada gets found — search queries, timeline
    └── IMAGERY.md            ←  what visual assets appear and what never appears
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

| Phase | What                                                    | Status         |
| ----- | ------------------------------------------------------- | -------------- |
| 1     | Compilation — intent → CLAUDE.md + agents + hooks       | Live           |
| 2     | Elicitation — structured questioning before compilation | Live           |
| 3     | World model — persistent artifact store, navigable      | In development |
| 4     | Ongoing authority — drift detection, impact analysis    | Vision         |

---

## Document Summaries

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

## Authoring Rules for New Documents

Any new document added to this library must:

1. State its authority and what it derives from at the top
2. Pass the same battle-test applied to site copy: verifiable, not overpromising, no internal vocabulary without explanation
3. Say what something is, then what it is not
4. Use the vocabulary table from BRAND.md — never "semantic compiler", "governed artifacts", "postcode/entropy/gate"
5. Include a key invariant or key insight section — the non-obvious thing this document captures
6. Be referenced in this index before it is considered part of the library

Documents that are not referenced here are not part of the canonical context.
