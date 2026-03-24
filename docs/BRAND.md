# Ada — Brand & Product SSOT

**Authority:** This document is the top of the semantic hierarchy.
All other docs (SITE_CONTEXT, DESIGN_DIRECTION, CONTENT_STRATEGY, CLAUDE.md)
derive from this. When they conflict with this, this wins.

**Entropy rule:** Every line here earns its place or is removed.
Do not add context that can be derived from reading the product.

---

## What Ada Is

Ada is a requirements elicitation and formalization tool for AI-driven software development.

It takes natural language intent — at whatever level the user operates —
identifies what is ambiguous, resolves it through structured questioning,
and produces the persistent context files Claude Code reads every session:
`CLAUDE.md`, agents, hooks.

**Ada happens before building starts.** That is its categorical position.

---

## What Motherlabs Is

One-person AI lab. Ada is its product.

The lab exists because one person needed this tool for himself
and built it through ~400 iterations of real use.
That origin informs credibility, not marketing.
Motherlabs is not a venture-backed startup. It is a lab that produced something.

---

## The Core Claim

Every word here is battle-tested. Do not weaken or strengthen it.

> Between what you mean and what gets built, something gets lost.
> Not because AI isn't capable.
> Because intent was never structured before building started.
>
> Ada is the step before.
> It structures your intent into files Claude Code reads every session.
> The result: less distance between what you described and what gets built.
> Not zero. Less.

---

## The Differentiator

**Ada happens before.**

MEMORY.md, Cursor Rules, better prompting — these happen during or after.
Ada structures intent before the first file is opened.

Claude Code's auto-memory (MEMORY.md) records what it observed as it worked — retrospective.
Ada records what you intend before it starts — prospective.
These are not the same thing.

This distinction is factual, specific, and survives any competitive challenge.

---

## Users

### Primary — builders without developer vocabulary

- Have real product vision and specific ideas
- Build with Claude Code or similar tools
- Hit the ceiling: output drifts from intent, sessions don't accumulate meaning
- Know something is wrong but may not have words for what
- Do not need to be developers to be the user

### Secondary — technical founders

- Understand AI tools well
- Care about outcome, not internal architecture
- Success = "it built what I actually meant"

### Not the user

- Enterprise teams with professional requirements engineers
- People who need Claude Code explained from scratch
- Anyone satisfied with chatbot-style AI interaction

---

## Brand Voice

The voice of someone who built a real thing and wants to describe it accurately.
Not selling. Describing.

**Rules — no exceptions:**

- Short sentences. Strong verbs. No filler.
- Say what something is. Then say what it is not.
- Credibility comes from specificity, not from claims.
- If it only works in a marketing context, cut it.
- The test: could this appear in a technical note or engineering doc? If yes, keep.

**Right:** "Ada asks the minimum questions needed to resolve what's ambiguous."
**Wrong:** "Ada intelligently understands your unique vision."

**Right:** "Less distance between what you described and what gets built."
**Wrong:** "Your ideas, perfectly realized."

**Right:** "~400 iterations since late 2024."
**Wrong:** "Years of research and development."

---

## Tone

Direct. Precise. No performance.

Not: enthusiastic, warm, encouraging in the consumer-product sense.
Yes: honest, specific, confident without aggression.

No corporate language. No buzzword stacking. No "we're excited to."
No "revolutionize," "unlock," "unleash," "empower," "game-changer."
No "AI-powered" — meaningless in 2026.

Dark mode for language: no gloss. The words do the work.

---

## Personality

Ada is a tool, not an assistant. It does not have a chatbot personality.

Motherlabs has a persona: the lab, not the startup.
Someone who ran 400 iterations on a real problem and knows exactly what they found.
Honest about what exists and what doesn't. Specific about what the product does.
Precise about where it falls short.

---

## What Ada Is NOT

These are as definitional as what Ada is.

- **Not a chatbot** — does not do open-ended conversation
- **Not a code generator** — produces context files; Claude Code writes the code
- **Not a prompt wrapper** — operates at the requirements layer, not the prompt layer
- **Not auto-memory** — MEMORY.md records what Claude observed; Ada records what you intend
- **Not a replacement for Claude Code** — a prerequisite to it; they are complementary
- **Not complete** — elicitation and compilation are live; world model is in development

---

## Current Product State

Be honest about this everywhere. Overpromising costs more than underselling.

| Phase | What                                                    | Status         |
| ----- | ------------------------------------------------------- | -------------- |
| 1     | Compilation — intent → CLAUDE.md + agents + hooks       | Live           |
| 2     | Elicitation — structured questioning before compilation | Live           |
| 3     | World model — persistent artifact store, navigable      | In development |
| 4     | Ongoing authority — drift detection, impact analysis    | Vision         |

Do not imply Phase 3 or 4 are live.

---

## Design Principles

Apply to all surfaces: web, CLI, docs, any future UI.

1. **The tool is the brand.** Design derives from the product, not from marketing conventions.
2. **One continuous object.** CLI is dark. Website is dark. Same palette, same glyphs, same feel.
3. **Palette source of truth:** `cli/src/ui/design-system.ts` — exact tokens, do not approximate.
4. **◈ is Ada's identity mark.** Used deliberately as structural punctuation. Never decoratively.
5. **Typography does the work.** No stock illustration, no icon sets, no decorative gradients.
6. **Every visual decision traces to a product principle.** If it doesn't, remove it.

---

## Vocabulary

### Use

| Term                       | Why                                     |
| -------------------------- | --------------------------------------- |
| intent                     | what the user means to build            |
| requirements elicitation   | the academic discipline Ada is doing    |
| ambiguity                  | the documented root problem             |
| structured context         | what Ada produces                       |
| `CLAUDE.md`, agents, hooks | the actual concrete outputs             |
| prospective                | Ada's temporal position (before)        |
| retrospective              | MEMORY.md's temporal position (after)   |
| reduces                    | honest result word — never "eliminates" |
| before building starts     | the categorical differentiator          |

### Avoid

| Term                                | Why                             |
| ----------------------------------- | ------------------------------- |
| semantic compiler                   | not standard, arguable          |
| governed artifacts                  | internal vocabulary             |
| postcode, entropy, gate             | internal vocabulary             |
| nothing gets lost                   | unprovable promise              |
| impossible to build the wrong thing | unprovable promise              |
| governs Claude Code                 | implies authority we don't have |
| AI-powered                          | meaningless                     |
| world model                         | only when Phase 3 is live       |

---

## Claims That Survived the Battle Test

These are specifically verified. Use them. Do not dilute.

- Natural language is inherently ambiguous — ACM research, documented
- Ambiguity at requirements stage compounds as you build — documented
- Claude Code reads CLAUDE.md at the start of every session — Anthropic docs
- MEMORY.md is retrospective; Ada is prospective — factually distinct
- Ada reduces the distance between intent and output — honest, supportable
- Ada happens before — categorical, specific, survives any competitive challenge

## Claims That Are Dead

Do not resurrect these.

- "Nothing gets lost in translation"
- "Structurally impossible to build the wrong thing"
- "No tool exists that does this"
- "Ada governs Claude Code"
- "AI promised you could build from ideas"
- "Semantic compiler"
