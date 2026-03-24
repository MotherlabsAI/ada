# motherlabs.ai — Design Direction

Derived from: SITE_CONTEXT.md + CONTENT_STRATEGY.md
This is a constraints document. It is handed to Claude Code as the design brief.
No design decisions are made during implementation that contradict this file.

---

## The Fundamental Question: What Does This Site Feel Like?

It feels like a well-made tool, not a well-marketed product.

The lab aesthetic is real. The product is real. The design should be honest about
both — it's not a startup with a $2M brand budget, and it shouldn't look like one.
It should look like something built by someone who cares about craft and precision.

The closest analogy: a well-designed terminal. Not a consumer app.
Information-forward. Typographically strong. Minimal visual noise.

---

## Color

**Mode: Dark primary.**

Rationale:

- Ada's CLI is dark. The glass-box streaming output is dark. The site should feel
  continuous with the tool, not like a different product.
- Builders (primary audience) typically work in dark mode.
- Dark mode allows typographic precision to read more clearly against a rich background.
- It signals "built for people who work in terminals" without saying it.

**Palette direction (not hex values — those are implementation details):**

- Background: near-black, not pure black. A very dark neutral (cool or warm slightly,
  not pure gray — has character).
- Surface: a step lighter than background for cards/callout areas.
- Text primary: off-white, high contrast, not pure white (pure white is aggressive).
- Text secondary: mid-gray — for subtitles, captions, supporting copy.
- Accent: one color only. Used for CTAs, active states, links. Options:
  - Electric blue/indigo — signals "system," "compiler," "infrastructure"
  - Amber/warm yellow — signals "lab," "active," "human"
  - Purple — signals "AI," "semantic layer," "abstraction"
    Recommendation: electric indigo/violet. It reads as "infrastructure-grade" without
    being a cliché developer blue. Distinctive. Precise.
- Code blocks: a slightly lighter surface, monospace font, subtle border.

**Light mode:**
Provide a light mode — don't trap people who prefer it. But dark is the designed default.
Light mode palette: off-white background, dark text, same accent color.

---

## Typography

**Heading font:** Geometric sans-serif. Something that reads as precise, modern, minimal.
Options: Inter (safe, excellent), Geist (Vercel's — clean, technical), DM Sans.
Recommendation: Geist — it was designed for developer tooling, reads at all sizes,
available as a web font.

**Body font:** Same family or a paired serif/mono. Keep it simple — one font family
is enough if the weights are good. Geist at multiple weights handles this.

**Monospace font (for code blocks, /start page):** Geist Mono, or JetBrains Mono.
Any good monospace with clear distinction between similar characters (0/O, 1/l).

**Scale direction:**

- Headings: large and confident. Not enormous. The headline should dominate the hero
  but not look like a billboard.
- Body: comfortable reading size (17–18px base). Not cramped.
- Captions / labels: smaller, medium weight, tracking loosened slightly.

**Weight use:**

- Headlines: bold or extrabold
- Subheadings: semibold
- Body: regular
- UI labels (nav, buttons): medium

---

## Spacing and Density

**Generous whitespace.** This is not an information-dense site — it is a focused one.

Each section breathes. No content block runs directly into the next.
Vertical rhythm is consistent. Sections are separated by clear visual breaks (space,
not dividers/rules).

The homepage is not long. Every section earns its presence.
If a section can be cut without losing the argument, cut it.

**Maximum content width:** ~68–72 characters per line for body text.
Wider content areas for layout elements (hero, feature grids) but body text never
stretches past comfortable reading width.

**Mobile:** same spaciousness at 375px. Do not compress to fit more content.
Less content on mobile if needed — don't shrink, remove.

---

## Motion and Animation

**Subtle and purposeful. No decorative animation.**

- Page load: no splash screen, no loading animation. Site should appear instantly.
- On scroll: fade-in for content sections is acceptable if the delay is short (<100ms)
  and the motion is minimal. Not a parallax site. Not a scroll-jacking site.
- Interactive elements: button hover states (color shift, subtle lift), link underlines.
- If a terminal recording of Ada running is used in the hero or /ada page:
  it should autoplay, loop, and be paused when not in view. No sound.
- No animated backgrounds. No particle systems. No moving gradients.

CSS transitions only. No animation library.

---

## Component Patterns

**Buttons:**

- Primary CTA: solid fill with accent color, rounded corners (not pill, not sharp),
  medium weight label
- Secondary: outline or ghost variant
- No icon-only buttons without labels on the marketing site

**Code blocks:**

- Monospace font, slightly lighter surface than page background
- Language label in upper-right (bash, typescript, etc.)
- Copy button — required on /start
- Subtle horizontal rule or border, not a heavy box

**Cards (for feature blocks, roadmap items):**

- Flat. No drop shadows. Subtle border in surface color or a slightly lighter background.
- Tight information hierarchy: label, heading, body.

**Nav:**

- Simple horizontal nav on desktop
- Text links, not buttons (except the primary CTA "Get Started" which is a button)
- Active state: accent color underline or weight change
- Mobile: hamburger or drawer — functional, not animated heavily

---

## Glass Box Reference

Ada's glass-box principle: the user can see Ada thinking in real time.
This is a core product principle — live reasoning, not a spinner.

**On the marketing site:** the glass-box aesthetic can be referenced but not literally
replicated. One place where it could appear: a hero or /ada page inset showing a
terminal recording of Ada running — live reasoning stream visible, elicitation session
visible, blueprint output visible.

This is optional. Only include it if the recording is genuinely compelling.
A mediocre terminal recording is worse than no terminal recording.

**Do not:** fake the terminal UI as a static image pretending to be live.
If it's a recording, it's a recording. Honest.

---

## Reference Energy (calibration, not templates)

These sites have the right energy in some dimension — extract the principle, not the design:

1. **Linear.app** — dark mode done right, high information density without claustrophobia,
   typography at scale, "tool for serious people" aesthetic without being cold.
   Extract: typographic precision, dark surface palette, confident spacing.

2. **Warp.dev** — a terminal that became a product. The site signals "developer-grade"
   without abandoning design quality. Dark mode, technical credibility, real screenshots.
   Extract: showing the actual tool, not hiding it behind marketing imagery.

3. **Oxide Computer** — small team, technical depth, honest about what they're building.
   Writing-forward, no fluff, the engineering ethos is the brand.
   Extract: prose quality as design element, honesty as differentiation.

Explicitly NOT: Midjourney-style AI aesthetic (purple/neon, everything glowing),
startup landing page templates (gradient hero, 6-feature grid, customer logos),
generic SaaS (Lato/Inter on white with teal accents, rounded corners everywhere).

---

## What "Done" Looks Like

A builder who uses Claude Code lands on motherlabs.ai and thinks:

"This is built by someone who actually knows what they're doing.
I can tell what Ada is in 30 seconds.
I want to know more. I'm going to /ada."

Not:
"Wow, great design."
"This looks like every other AI startup."
"I'm not sure what this is."

The design succeeds when it gets out of the way of the content.
