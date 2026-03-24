# motherlabs.ai — Design Psychology

**Authority:** defines the psychological and architectural principles behind every page decision.
Derived from: BRAND.md, DESIGN_DIRECTION.md, CONTENT_STRATEGY.md.
Apply before writing or changing any page. These are constraints, not suggestions.

---

## The 3-Second Rule

Every cold visitor asks one question in the first 3 seconds: **"What is this?"**

Not: "What is the problem this solves?" Not: "Is this for me?"
Those come second. First: what is it.

The hero must answer this before any copy runs.

For Ada: the terminal compile output answers "what is this" before the headline explains
why it matters. Visitors process: _CLI tool → compile stages → CLAUDE.md output →
something gets lost._ The product speaks before the copy does.

**Test:** cover the hero headline. Can a stranger still answer "what is this?" from
what remains? If not, the hero is failing.

---

## The Evidence Rule

For a cold visitor with no prior exposure, the conversion sequence is:

```
claim → evidence → claim → evidence → action request
```

Not:

```
claim → claim → claim → action request
```

Evidence for a CLI tool is not a screenshot. It is the output itself.

Real numbers produce investigation. Vague claims produce doubt.

| Claim                             | Evidence                           |
| --------------------------------- | ---------------------------------- |
| "Ada produces structured context" | Show 6 lines of a real CLAUDE.md   |
| "Extensive hook coverage"         | "247 hooks written"                |
| "Multi-stage compilation"         | The actual stage list with ✓ marks |
| "Governor approval"               | "approved 0.94"                    |

The compile output block is the primary evidence unit. It must appear
in or immediately below the hero — before any section that asks for trust.

---

## Progressive Disclosure

George Miller (1956, replicated): working memory holds ~4 chunks before processing degrades.

Presenting all sections simultaneously causes cognitive dropout by section 3.

**The structure that works:**

Each section answers exactly one question — the question the visitor is naturally
asking at that scroll position.

```
"What is this?"         → Hero: compile block + headline
"Does it actually work?" → Evidence: real output, real numbers
"Is this for me?"        → Recognition: the specific frustration, precisely named
"How does it work?"      → Mechanism: 3 sentences, user-framed
"What do I get?"         → Artifact: one real file excerpt, not three described
"How do I start?"        → Invitation: the install command
```

Never answer two questions in the same section. The visitor must feel
each answer earns the next scroll.

---

## The Recognition Moment

The copy must articulate the specific frustration — not the general category.

| Generic (low resonance)  | Specific (high resonance)                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| "AI loses context"       | "By the time the drift is visible, rewinding is harder than starting over"                            |
| "Sessions don't persist" | "The next session, it builds from where it thinks it left off — which isn't quite where you left off" |
| "Prompts don't scale"    | "You re-explain the architecture. Every session."                                                     |

The recognition moment must appear early — within the first scroll.
Currently it's buried in paragraph 3 of the problem section. It should open the problem section.

---

## User-Framing vs Product-Framing

Every mechanism must be framed from the visitor's first-person experience.

Not "Ada does X." — "You do Y, and X happens."

| Product-framed (wrong)                            | User-framed (right)                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| "Ada surfaces what's ambiguous and asks about it" | "Ada asks you the questions that surface what you actually mean"                   |
| "Ada produces structured context"                 | "What you get is a file you can read and verify against what you originally meant" |
| "Claude Code reads them every session"            | "The intent you expressed lives in the project. Not in chat history. On disk."     |

The visitor must see themselves in the page. If Ada is always the subject, the visitor is an observer.
If the visitor is the subject, they are a participant.

---

## The CTA Hierarchy

Standard: button that says "Get started."
Better: the install command.

```
npm install -g @motherlabs/ada
```

A person who copies this command is already converted.
The button is a proxy for the decision. The command is the decision.

The button remains as secondary — for visitors who want to learn more
before committing. But the command is primary.

**CTA rule:** the action must be as specific and concrete as the product.
"Get started" is not specific. The install command is.

---

## Trust Signals for Cold-Start Products

Ada has no social proof. This is the cold-start constraint.

Available trust signals, in order of credibility:

1. **Specificity of numbers** — "247 hooks" > "extensive hook coverage"
2. **Honest limitations** — "not zero distance, less" > any perfection claim
3. **Iteration count** — "~400 iterations since late 2024" > "battle-tested"
4. **Evidence artifacts** — a real CLAUDE.md excerpt > any description of CLAUDE.md

The single highest-trust line on the page: "not zero distance. less."
It earns trust by refusing to overclaim. It must be visually prominent — not buried in body text.

Required before the final CTA:

> Built by one person. ~400 iterations since late 2024.

Not as a section. One line. A fact.

---

## Visual Hierarchy as Cognitive Direction

Visual hierarchy is not aesthetic — it is how the eye is told where to go next.

The eye follows: **size → contrast → position** (in that order).

If everything below the fold is the same size and contrast, the eye wanders.
Engagement drops before the visitor finishes the section.

**Required contrast points:**

- The compile output block must read visually heavier than surrounding prose
- "not zero. less." must be visually distinct — larger, or different weight, or isolated
- The install command must be the largest monospace element on the page
- Stage labels (CTX, INT, ENT...) must be visually lighter than their ✓ marks

**Color discipline:**

The accent color (#8ba4c4) signals interactivity. If it appears on code spans,
links, AND the primary CTA button, it loses signal value. Use it for the CTA.
Use `var(--color-text-dim)` for inline code spans that are not interactive.

---

## The Separation That Matters

Every visitor who builds with Claude Code will ask: "How is this different from MEMORY.md?"

This question must be answered before they ask it — because if they have to ask,
they've already started doubting.

The answer is stated precisely: Ada is prospective. MEMORY.md is retrospective.

It must appear as a standalone visual moment — not embedded in a paragraph.
Two lines, full stop:

> Claude Code's auto-memory records what it observed as it worked.
> Ada records what you intend before it starts.

Then: "One is retrospective. One is prospective. They are not the same thing."

This is the most important disambiguation on the page. Treat it as such visually.

---

## The Correct Page Structure

```
[HERO]         What is this? — compile block + headline + sub + CTA
[RECOGNITION]  Is this for me? — the specific frustration, precisely named
[EVIDENCE]     Does it work? — compile output block OR real CLAUDE.md excerpt
[MECHANISM]    How does it work? — 3 sentences, user-framed
[SEPARATION]   How is this different? — retrospective/prospective distinction
[ARTIFACT]     What do I get? — one real file excerpt, not three described
[INVITATION]   How do I start? — install command + trust signal
```

Each section: one question, one answer, one scroll.
The visitor never has to hold more than one idea to move forward.

---

## What to Never Do

- Answer two questions in the same section
- Show a feature list where an evidence artifact would serve
- Use the word "Get started" as the primary CTA if the install command exists
- Let the recognition moment ("by the time you notice...") appear after the fold
- Use the accent color on non-interactive inline code spans
- Describe what a file contains without showing an excerpt
- State a trust claim without a specific, verifiable number attached
