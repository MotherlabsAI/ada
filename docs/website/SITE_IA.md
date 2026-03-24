# motherlabs.ai — Information Architecture

Derived from: SITE_CONTEXT.md
Principle: every page has exactly one job. If a page has two jobs, split it.

---

## Navigation Model

Minimal top nav. Three primary links + one CTA button.

```
[motherlabs]    Ada    Lab    [Get Started →]
```

- **motherlabs** (logo/wordmark) → /
- **Ada** → /ada
- **Lab** → /lab
- **Get Started** (button, primary CTA) → /start or external link to CLI install

No dropdown menus. No mega nav. No footer-only pages.

---

## Pages

### / — Home

**Job:** Get the right person (builder who uses Claude Code and feels the ceiling)
to understand Ada in 90 seconds and act.

**Primary CTA:** Get Started / Install Ada
**Secondary CTA:** Learn more about Ada → /ada

**Content blocks (in order):**

1. Hero — positioning headline + sub-headline + primary CTA
2. Problem — the gap that Ada closes (intent → correct execution, reliably)
3. Solution — Ada as semantic compiler, not chatbot, not prompt wrapper
4. How it works — 4-step human-level pipeline (no stage codes)
5. Ada + Claude Code — the governance separation (for the technical audience)
6. Lab signal — brief honest credibility (one person, ~400 iterations, real problem)
7. Final CTA

**Converts:** secondary audience (technical founders) and primes primary audience
(Claude Code builders) to go deeper at /ada.

---

### /ada — Ada Product Page

**Job:** Give the primary audience (Claude Code builders, senior devs) enough
precision to understand the architecture and trust it.

**Primary CTA:** Get Started / Install
**Secondary CTA:** none — this page is for depth, not conversion

**Content blocks (in order):**

1. Governing invariant — "semantic authority from first idea to last commit"
2. What Ada is NOT — critical differentiator section (chatbot, code gen, one-shot)
3. The pipeline — human-level 4-phase breakdown with more detail than homepage
4. The world model — persistent artifacts vs. ephemeral context (the key insight)
5. Ada + Claude Code — the governance model in technical terms
6. Phase roadmap — where Ada is now vs. where it's going (compilation → world model
   → ongoing authority) — honest about current state
7. Get Started CTA

**Converts:** primary audience who want to understand before committing.

---

### /lab — Motherlabs

**Job:** Establish who built this and why — credibility through honesty, not polish.

**Primary CTA:** none (this page is context, not conversion)
**Links out to:** / and /ada naturally from prose

**Content blocks (in order):**

1. What Motherlabs is — the lab framing, not startup framing
2. The origin — one person, one PC, ~400 iterations, learning by building
3. Ada as the product that emerged — Ada is the reason Motherlabs exists publicly
4. The relationship to Claude Code — Motherlabs built the layer above Claude Code,
   the way Anthropic built Claude Code as the layer above Claude
5. A note on how to reach Alex (GitHub, or a contact form if needed)

**Does NOT include:** full personal backstory, fake team page, investor language.

---

### /start — Get Started

**Job:** Get a builder from "interested" to "running Ada" in the shortest possible path.

**Primary CTA:** first install command (copy-pasteable)
**Secondary CTA:** link to docs / README

**Content blocks:**

1. Prerequisites — Node.js 18+, pnpm, API key (2–3 lines)
2. Install — one command
3. First run — what to expect (the elicitation session, the compilation output)
4. What's next — link to Ada docs or GitHub

**This page is minimal.** It is a ramp, not a sales page.
If a full docs site exists, /start redirects or links there.
If no docs site yet, /start is a lean getting-started page built inline.

---

## Pages NOT included (and why)

- **/blog** — not yet; content is the product, not the marketing
- **/pricing** — not applicable at this stage
- **/changelog** — useful later when there is a user base to communicate to
- **/openclaw** — OpenClaw is a separate product; if it gets a page, it gets its own domain or subdirectory when ready
- **/team** — there is no team; a fake team page would be dishonest
- **/investors** — not applicable

---

## URL Structure

```
/          — homepage
/ada       — Ada product page
/lab       — Motherlabs origin
/start     — get started
/404       — not found (custom)
```

Clean, no trailing slashes, no versioning in URLs at this stage.

---

## Primary CTA Decision

**"Get Started"** — not "Sign Up", not "Try for Free", not "Request Access."

Rationale: Ada is a CLI tool for builders. "Get Started" maps to "install and run."
It is honest about what the action is. It does not imply a SaaS signup flow.

If Ada eventually has a waitlist or account system, the CTA updates then.
Do not design for a SaaS funnel that does not exist yet.

---

## Mobile Considerations

All pages must work at 375px (iPhone SE baseline).
Nav collapses to hamburger or hidden links at mobile.
Code blocks in /start must be horizontally scrollable, not truncated.
The homepage hero must be readable without horizontal scroll on any device.
