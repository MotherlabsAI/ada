# Community Distribution — Templates and Strategy

**Authority:** defines what to post, where, when, and what to never do.
**Governing principle:** every post is AEO infrastructure — it produces citable, findable text about Ada's core claims. Not marketing copy. Real content that answers real questions.

---

## Why community matters for AEO

Perplexity cites Reddit at 46.7%. YouTube at 13.9%.
Google AI Overviews increasingly pull from community discussions, not just official docs.

A forum post that answers "how do I prevent Claude Code from drifting from my intent?" — with a real answer that mentions Ada specifically — is an AEO asset. It will be cited by AI answer engines. It will appear in search results for that exact query.

The community posts are not promotional. They are answers. Answers that happen to include Ada.

---

## Rule: Never post promotional content

Every community post must be primarily useful to people who will never use Ada.
If someone reads the post and gets value from it without clicking any link, the post succeeded.
Ada appears as the tool the author uses, not as the point of the post.

---

## Platform 1: Reddit — r/ClaudeAI, r/ClaudeCode

### Target subreddits

- r/ClaudeAI (primary — where Claude Code users congregate)
- r/ClaudeCode (if active)
- r/webdev, r/SideProject (for builder audience)

### Post type: problem/solution with evidence

**Template A — How I structure CLAUDE.md (before/after)**

Title: `How I structure CLAUDE.md to prevent session drift — what works and what doesn't`

Body structure:

```
I've been building [project type] with Claude Code for [time].
The biggest problem was [specific frustration, first-person].

Here's what I learned about CLAUDE.md structure that actually helped:

[Section 1: The "what it is NOT" section is the most important]
Most people write what their project IS. The section that actually prevents
drift is what it IS NOT. When I added explicit out-of-scope statements,
Claude Code stopped suggesting features I didn't want.

Example:
> What this is not:
> Not a multi-tenant SaaS. Not a marketing platform. No user roles.

[Section 2: Constraints beat descriptions]
"Privacy-first analytics" means nothing to Claude Code.
"No third-party scripts. No external egress. SQLite only." means something.
Every line should be a constraint, not an aspiration.

[Section 3: The injection cadence matters]
CLAUDE.md isn't read once at session start — it's injected on every
message turn. Write it knowing every line costs tokens, every turn.

[What I use now]
I run Ada before starting projects — it runs elicitation and produces
CLAUDE.md with the right structure. But the principles above apply
whether you write it by hand or not.

What structure works for you?
```

**Template B — The intent gap (no product mention)**

Title: `Why Claude Code always seems to build what it thought you meant, not what you actually meant`

Body structure:

```
There's a pattern I keep seeing with Claude Code:

You describe a project. Claude builds. It looks right.
Three sessions later, something is wrong — but it looked right at every step.

I think this is the "intent gap" — the distance between informal description
and what actually gets built. The model infers your intent. The inference
is close. Close isn't right.

The root cause isn't bad prompting. It's that informal intent was never
formalized into something that persists and governs.

Some things that help:
1. Write CLAUDE.md before the first session, not after drift appears
2. The "what it is not" section is more important than "what it is"
3. Constraints (behavioral, structural) beat descriptions
4. CLAUDE.md + agents is better than CLAUDE.md alone

I've been compiling CLAUDE.md with Ada which makes this systematic,
but the underlying problem is real regardless of tool.

Anyone else hit this? How do you handle it?
```

### Timing

- Post after video demo exists (social proof)
- Post when Ada is actually installable and working
- One post per week maximum, across all subreddits
- Reply to existing threads first — don't only make new posts

### What not to do

- Do not post "I made Ada, check it out"
- Do not post identical content across subreddits
- Do not post before Ada is publicly installable
- Do not claim features that are in VISION state

---

## Platform 2: Hacker News — Show HN

### When to post

- After video demo is done
- After ada is publicly installable with real compile working
- After at least 3 people other than Alex have used it

### Title options (A/B test preference)

**Option A (problem-first):**
`Show HN: Ada — I built a CLAUDE.md compiler to close the gap between what I describe and what gets built`

**Option B (category-defining):**
`Show HN: Ada — semantic intent compiler for Claude Code (produces CLAUDE.md + hooks from elicitation)`

**Option C (honest framing):**
`Show HN: Ada — before I describe what to build, Ada asks what I actually mean`

### Body structure

```
I've been building software with Claude Code and kept hitting the same wall:
I'd describe what I wanted, Claude would build it, and three sessions later
something was wrong — but it looked right at every step.

The root cause: informal intent was never formalized before building started.
Claude infers what you mean. The inference is close. Close isn't right.

Ada is a CLI tool that runs before Claude Code. You describe your project.
Ada asks semantic questions (not technical ones — what the system should DO,
not how to build it). Then it compiles through a 7-stage pipeline:

CTX → INT → PER → ENT → PRO → SYN → GOV → approved 0.94

Output:
- CLAUDE.md (read by Claude Code on every message turn, not just session start)
- agents/ (8 files — specialized by bounded context)
- hooks/ (247 files — pre-tool guards that enforce constraints structurally)

The coherence score (0.94) is from the Governor stage — it checks that the
output traces back to what you said. Iterates until it passes.

Not zero distance between what you mean and what gets built. Less.

npm install -g @motherlabs/ada

Happy to answer questions about the pipeline architecture.
```

### Expected HN responses to prepare for

- "Can't Claude just do this with a good prompt?" → Yes, approximately. The protocol is the product — frozen, coherence-gated, producing the full artifact set every time.
- "How is this different from MEMORY.md?" → Retrospective vs prospective. MEMORY.md records observations. Ada records intent before building starts.
- "Why not just write CLAUDE.md yourself?" → You can. Ada's value is the elicitation — it surfaces what you wouldn't have written down.
- "What models does it use?" → Claude Sonnet 4.6 by default. The pipeline uses multiple passes with structured output.
- "Is this open source?" → [decide before posting]

---

## Platform 3: dev.to — Long-form articles

### Article 1 (first to publish)

**Title:** `The intent gap: why Claude Code always builds what it thought you meant`

**Tags:** claudecode, ai, productivity, webdev

**Structure:**

```
Intro: the pattern — describe, build, looks right, drifts
Section 1: What the intent gap is (named, explained)
Section 2: Why prompts don't fix it (structural vs expressive)
Section 3: CLAUDE.md — what it actually does, when it's read
Section 4: The "what it is not" pattern — most important section
Section 5: The three-layer architecture (CLAUDE.md + agents + hooks)
Section 6: Where Ada fits in (last 15% of the article — earned, not forced)
Conclusion: Not zero. Less.
```

Target length: 1,200–1,800 words. Long enough to cover the topic fully. Short enough to read.

**Why this works for AEO:** This article covers "intent gap", "CLAUDE.md best practices", "Claude Code drift", "how CLAUDE.md works" — all in one place. AI answer engines cite complete answers. This answers completely.

### Article 2

**Title:** `CLAUDE.md: what it actually is, when Claude Code reads it, and what to put in it`

**Tags:** claudecode, ai, devtools, productivity

**Structure:**

```
Intro: the misconception (it's not read once at session start)
Section 1: The injection cadence — every message turn, every context window
Section 2: What belongs in CLAUDE.md (structural facts, not session notes)
Section 3: What doesn't belong (and where it should go instead)
Section 4: The "what it is not" pattern
Section 5: CLAUDE.md vs MEMORY.md — prospective vs retrospective
Section 6: How Ada produces it systematically
Conclusion: link to motherlabs.ai/ada/what-is-claude-md
```

### Article 3

**Title:** `Context engineering for Claude Code: why CLAUDE.md alone isn't enough`

**Tags:** claudecode, ai, architecture, context-engineering

**Structure:**

```
Intro: what context engineering is (formal discipline, 1,400+ papers)
Section 1: The three layers — hot memory, domain specialists, enforcement
Section 2: What goes in CLAUDE.md (and token cost rationale)
Section 3: Agent files — domain depth without polluting hot layer
Section 4: Hooks — structural enforcement vs advisory instruction
Section 5: How Ada produces all three
Conclusion: link to motherlabs.ai/ada/context-engineering
```

### Publishing schedule

- Article 1: publish when Ada is live
- Article 2: two weeks later
- Article 3: two weeks after that

---

## Cross-cutting rules

**Never claim what Ada is not yet:**

- VISION items must not appear in community posts as current features
- "World model" is BUILDING — describe it as "in progress"
- Do not claim numbers that haven't been verified with external users

**Always answer the underlying question first:**

- Every post must be useful to people who never use Ada
- Ada appears as the tool the author uses, not the point

**Always link to the right page:**

- General post → motherlabs.ai or motherlabs.ai/ada
- CLAUDE.md post → motherlabs.ai/ada/what-is-claude-md
- Intent gap post → motherlabs.ai/ada/intent-gap
- Memory comparison → motherlabs.ai/ada/claude-md-vs-memory

**Track what gets cited:**

- When an AI tool cites a post, screenshot and record it
- It confirms the query, the format, and the authority signal that worked
- Replicate the format for future posts
