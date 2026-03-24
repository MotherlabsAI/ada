# motherlabs.ai — Content Strategy

Derived from: SITE_CONTEXT.md + SITE_IA.md
This document defines WHAT each section says and WHY — not the final copy.
Copy is written in implementation phase, constrained by this strategy.

---

## / — Homepage

### Hero

**What it says:**
The clearest, most precise statement of what Ada does — positioned as the gap-closer
between human intent and governed execution.

**Headline direction:**
Not a tagline. A claim. One sentence that could not apply to any other product.

Candidate angles:

- "The semantic layer between what you want to build and what gets built."
- "Ada compiles your intent. Claude Code builds it. Nothing gets lost in translation."
- "From first idea to governed execution — without losing what you meant."

The headline must survive the 5-second test: a builder who uses Claude Code should
immediately understand why this is different from a prompt wrapper or a chatbot.

**Sub-headline:**
One sentence that handles the "how": Ada is a semantic compiler. It takes intent as
input, produces governed artifacts as output, and governs what Claude Code can build.

**CTA:**
"Get Started" — links to /start. No secondary CTA in the hero. One action.

**Visual treatment (direction, not spec):**
Minimal. The headline is the hero. No product screenshots at this stage unless the
glass-box CLI output is visually compelling — in which case a terminal recording
of Ada running an elicitation session and producing a blueprint is the product proof.

---

### Problem

**What it says:**
Name the gap that the primary audience already feels.

Builders who use Claude Code or similar tools hit the same wall:

- Context degrades across sessions
- Prompts don't scale — they're not artifacts
- The AI builds what you said, not what you meant
- You can't ask "does this change align with the original intent?" because there
  is no persistent original intent — only chat history

**Why this section matters:**
The primary audience doesn't need to be told LLMs are powerful. They need to be told
that someone has identified the ceiling they've already hit and built past it.

**What NOT to say:**

- Don't explain what Claude is (they know)
- Don't explain what prompts are
- Don't use the word "hallucination" — it's overused and wrong for this problem
- Don't make this about AI in general — make it about the specific failure mode of
  agentic building

**Length:** 3–5 sentences or 2–3 short bullet points. This section validates, not educates.

---

### Solution

**What it says:**
Ada is a semantic compiler — not a chatbot, not a code generator, not a prompt wrapper.

The key insight: Ada's output is governed artifacts, not code and not chat.
These artifacts are authoritative. Claude Code builds against them.
The constraints are in the artifacts, not in the prompt.

**The "aha" moment to engineer:**
The reader goes from "another AI tool" to "oh — this is the layer that governs the
execution layer." That's the shift. That's what this section does.

**Specific claims:**

- Ada holds a canonical semantic model of your project — goals, entities, processes,
  architecture — as a persistent artifact, not ephemeral context
- Ada governs what Claude Code builds; Claude Code doesn't override Ada's decisions
- Ada makes it structurally impossible to build the wrong thing because the constraints
  live in the artifacts, not the prompt

**What NOT to say:**

- Don't use stage codes or internal type names
- Don't say "world model" without explaining it (or skip the term entirely)
- Don't imply Ada writes code — it doesn't

---

### How It Works

**What it says:**
The 4-phase pipeline at human abstraction level.

Phase 1 — Intent
You tell Ada what you want to build. At whatever level you think in.
Ada doesn't ask about frameworks, libraries, or patterns.

Phase 2 — Elicitation
Ada asks the minimum questions needed to resolve what it genuinely doesn't know.
Not technical questions — semantic ones. What does it need to be? What does it not?

Phase 3 — Compilation
Ada produces the canonical semantic model: entities, processes, architecture,
governed blueprint. This is the artifact. It is authoritative.

Phase 4 — Execution
Claude Code (or any capable execution layer) receives the blueprint and builds.
Ada governs what can be built. Claude Code builds it.

**Format:**
Numbered steps, each with a one-sentence title and 2–3 sentences of description.
No diagrams required — the prose should be clear enough without them.
If a diagram is added, it must be a simple left-to-right flow, not an architecture diagram.

**What NOT to show:**

- Internal stage codes (CTX, INT, PER, ENT, PRO, SYN, VER, GOV)
- PostcodeAddress format
- Gate evaluation logic
- Entropy scores

---

### Ada + Claude Code

**What it says:**
The governance separation — for the technical reader who immediately asks "so what
is the relationship between Ada and Claude Code exactly?"

Ada = semantic layer (WHY and WHAT)
Claude Code = execution layer (HOW)

Ada produces governed artifacts. Claude Code implements them.
They are not competitors. They are complements. Ada governs Claude Code.

**The analogy that works:**
Ada to Motherlabs is what Claude Code is to Anthropic.
Motherlabs built the layer above Claude Code, the way Anthropic built Claude Code
as the layer above Claude.

**The parallel use case (illustrates the separation):**
You can run Ada as a research agent swarm compiling product strategy while Claude Code
builds the website. Two different abstraction levels, both traceable to governed intent.

**What NOT to say:**

- Don't imply Ada replaces Claude Code (it doesn't)
- Don't imply Claude Code is insufficient (it's the best execution layer available)
- Don't make this sound like a wrapper or a plugin

---

### Lab Signal

**What it says:**
Brief, honest credibility marker. Not a bio. A fact that earns trust.

"Built by one person who needed it for himself. ~400 iterations since late 2024.
The real thing, not the pitch deck version."

That's roughly the length. The honesty is the credibility.

**What NOT to say:**

- Don't make this a personal story section (that belongs on /lab)
- Don't claim traction or users that don't exist
- Don't manufacture social proof

---

### Final CTA

Same CTA as hero. "Get Started." Optionally with a secondary link to /ada for
people who want to go deeper before committing.

---

## /ada — Ada Product Page

### Governing Invariant

**What it says:**
State the single constraint that defines Ada's scope.

"Ada is the semantic authority for a piece of software — from first idea to last commit."

This is not a tagline. Explain it. What does "semantic authority" mean in practice?
It means Ada holds the canonical model. It means every change can be checked against
the original intent. It means the answer to "should we build this?" comes from the
model, not from memory or instinct.

---

### What Ada Is NOT

**What it says:**
This section does the most work on this page. The primary audience will arrive with
assumptions baked in. Clear them.

- NOT a chatbot — Ada does not do open-ended conversation. It runs structured
  elicitation sessions with a specific goal: resolve blocking unknowns.
- NOT a code generator — Ada produces governed blueprints. Claude Code generates code.
  Ada is the layer above the execution layer, not inside it.
- NOT a one-shot tool — The compiled world model persists. It is navigable. You can
  ask it questions after the build.
- NOT a validator — Ada makes autonomous implementation decisions at its level.
  It doesn't surface technical choices to the user. It surfaces semantic decisions.
- NOT a documentation tool — CLAUDE.md + agents + hooks are the interface to the
  execution layer, not a spec dump.

**Format:**
Short, punchy. Each "not" gets one sentence of clarification — not an essay.
The format itself signals precision.

---

### The Pipeline (detailed)

Same 4-phase structure as homepage but with more depth:

- Intent: What kinds of intent does Ada accept? (Natural language, at the user's level.
  Ada infers technical choices from conceptual descriptions.)
- Elicitation: How does Ada decide what to ask? (Minimum set of blocking unknowns.
  Questions are about behavior and experience, not implementation.)
- Compilation: What does "canonical semantic model" mean? (Goals, entities, processes,
  architecture — as persistent, addressable artifacts. Not a chat history. Not a doc.)
- Execution: What is the artifact that Claude Code receives? (A governed blueprint:
  a structured artifact that contains the constraints Ada has decided. Claude Code
  implements it. Ada governs what Claude Code can build.)

---

### The World Model

**What it says:**
The key architectural insight that separates Ada from prompt wrappers.

Most AI tools produce ephemeral output — a response in a conversation.
Ada produces a world model: a persistent, navigable, addressable artifact store.

After compilation:

- Every stage has a provenance-addressed artifact
- The manifest links all artifacts by address
- Claude Code reads the world model on every session — not a static file, a live
  knowledge graph
- You can ask Ada "what did the architecture stage say about payments?" and get an
  authoritative answer, not a summary from memory

**Current state (be honest):**
World model is Phase 3 of Ada's development. Compilation (Phase 1) and Elicitation
(Phase 2) are live. The world model artifact store is in active development.
This honesty builds trust. Don't claim Phase 3 is live if it isn't.

---

### Ada + Claude Code (technical depth)

Same governance model as homepage, but with more precision:

- CLAUDE.md + agents + hooks = the interface between Ada and Claude Code
- 251 hooks enforcing entity invariants at tool boundaries (hooks are laws, not suggestions)
- Ada's artifacts are the source of truth; Claude Code never overrides Ada's semantic
  decisions — it implements them
- The result: governance that doesn't rely on the model remembering the original intent

---

### Phase Roadmap

What exists and what's coming — honest, not a product marketing roadmap:

Phase 1 — Compilation (live): Intent → governed blueprint → Claude Code execution
Phase 2 — Elicitation (live): Structured dialogue before compilation, resolving
blocking unknowns before they become wrong code
Phase 3 — World Model (in development): Persistent artifact store, navigable,
provenance-addressed
Phase 4 — Ongoing Authority (vision): Ada as semantic guardian on every commit,
drift detection, impact analysis

---

## /lab — Motherlabs

### What Motherlabs Is

Lab, not startup. One person, not a team. Built to solve a real problem, not to
build a company. The company is a side effect of the solution working.

---

### The Origin

~400 iterations. Since late 2024. Learning how LLMs work, how context works, what
context engineering actually means when you build against it rather than talk about it.

The lab is him and his PC. That's the honest version. That's the version worth saying.

---

### Ada as the Product

Ada is what came out of the lab. The reason Motherlabs is visible at all is that
Ada is the thing that worked — the thing someone else might actually need.

"I built it because I needed it for myself" is not a marketing line. It is the
most credible thing a founder can say. It means the product was tested against a
real problem before it was tested against a market.

---

### The Analogy

"Ada to Motherlabs is what Claude Code is to Anthropic."

Motherlabs built the semantic governance layer for AI-driven software development.
Anthropic built Claude Code as the execution layer for AI-driven software development.
They are complementary, not competitive. Ada governs Claude Code.

---

### Contact / Reach

Keep it minimal. GitHub link. Maybe a simple contact form or email.
Not a sales CRM. Not a demo booking flow. Someone who wants to talk can reach Alex.

---

## /start — Get Started

No strategy needed — this page is a ramp.
Content = prerequisites + install command + first run explanation + what's next.
No persuasion. Already persuaded. Get them running.
