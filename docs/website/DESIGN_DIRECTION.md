# motherlabs.ai — Design Direction

Derived from: SITE_CONTEXT.md + CONTENT_STRATEGY.md + cli/src/ui/design-system.ts
This is a constraints document. Implementation must not contradict this file.
Version 2 — Frontier.

---

## The Design Challenge

This site has to do something most developer tool sites fail at:
it has to be genuinely beautiful AND feel like a serious tool.

"Behance level" and "tool-grade" are usually opposed. Behance-level design often means
visual spectacle — motion, imagery, production value. Tool-grade design means
information-forward, zero decorative noise, precision over polish.

The resolution: the CLI is already beautiful. motherTUI is a considered design system.
The website IS the CLI aesthetic, translated to the browser. Not inspired by it — derived
from it. The same palette, the same glyph vocabulary, the same typographic discipline.
The user who runs `ada compile` and then visits motherlabs.ai should feel continuity.
One object. One sensibility.

---

## Design System Source: motherTUI

The CLI design-system.ts is the canonical source. Extract everything from it.
Do not approximate. Do not invent new tokens.

### Color tokens (from palette in design-system.ts)

```css
--bg-deep: #0d0d0d; /* page background */
--bg-surface: #151518; /* cards, code blocks, inset areas */
--bg-elevated: #1c1c21; /* hover states, active panels, borders */
--bg-hover: #22222a; /* interactive hover */

--accent: #8ba4c4; /* primary CTA, links, active states */
--accent-dim: #6b8aad; /* secondary accent, subdued */
--accent-pale: #afc3d9; /* accent on dark surface, labels */
--accent-wash: #8ba4c422; /* accent tint for backgrounds */

--text-primary: #e8e6df; /* main body text — warm off-white */
--text-secondary: #9c9a92; /* captions, subtitles, supporting copy */
--text-tertiary: #5e5d58; /* faint labels, separators */
--text-dim: #3d3d3a; /* near-invisible, decorative text */

--verified: #7ab87a; /* success states */
--active: #d4917a; /* active/processing states */
--failure: #c45c4a; /* error states */
--warning: #d4c07a; /* warning states */
--provenance: #a8d4e6; /* provenance / data lineage */
```

**Light mode:** invert the surface stack. `--bg-deep` becomes near-white (#f5f4f0).
`--text-primary` becomes near-black (#1a1a18). Accent stays the same — it works
on both backgrounds. Keep the warmth in the neutrals (not pure white, not pure black).

### Typography

**Heading font:** Geist — weight 700–800. Used for all headings and display text.
Already in the site. Keep it.

**Body font:** Geist — weight 400. Same family. The weight contrast does the work.

**Monospace font:** Geist Mono — weight 400–500. Used for:

- Code blocks
- Command examples (`ada compile`)
- Pipeline stage labels (INT → ENT → GOV)
- Any data that should read as structured output
- The identity glyph ◈ — always render in Geist Mono

**Scale:**

- Display (hero headline): clamp(2.5rem, 5vw, 4rem) — confident, not oversized
- H1: clamp(2rem, 4vw, 3rem)
- H2: 1.5rem, weight 600
- H3: 1.1rem, weight 600, letter-spacing: 0.08em, UPPERCASE (matches TUI panel titles)
- Body: 1.0625rem (17px), line-height 1.75
- Caption: 0.875rem, text-secondary
- Code / monospace: 0.9rem, Geist Mono

**Text rules (from textRules in design-system.ts):**

- Panel/section labels: UPPERCASE (matches TUI `panelTitles: "UPPERCASE"`)
- Body: sentence case (matches TUI `bodyText: "sentence"`)
- No pure white (#fff) — use --text-primary (#e8e6df)
- No pure black (#000) — use --bg-deep (#0d0d0d)
- No emoji

---

## The Signature: Ada's Identity Glyph

The diamond glyph ◈ (`\u25C8`) is Ada's identity mark — the core glyph in the CLI.
It appears in the spinner (◇ → ◈ → ◆ → ♦), in gate status, in the pipeline display.

On the website, ◈ functions as structural punctuation:

- The favicon: ◈ in accent blue on dark background (replace current "m" favicon)
- Section separator: a single ◈ in --text-tertiary between major sections
- Pipeline step indicator: ◇ (pending) → ◈ (current) → ◆ (complete)
- CTA label prefix: `◈ Get started`
- Active nav item indicator

**Render ◈ in Geist Mono always.** The proportional sans-serif breaks its geometry.

The diamond breathe animation (CSS only, no library):

```css
@keyframes diamond-breathe {
  0%,
  100% {
    opacity: 0.3;
    content: "◇";
  }
  25% {
    opacity: 0.7;
    content: "◈";
  }
  50% {
    opacity: 1;
    content: "◆";
  }
  75% {
    opacity: 0.7;
    content: "◈";
  }
}
```

Use this sparingly — one instance on the page. The hero ◈ or a loading state.

---

## Layout Grammar

**The TUI border vocabulary on the web**

The CLI uses box-drawing characters (┌ ─ ┐ │ └ ─ ┘) to create panel boundaries.
On the web, translate this as: `border: 1px solid var(--bg-elevated)`.
No border-radius > 4px. No drop shadows. No gradients. Borders only — clean lines.

The surface stack creates depth:

- Page: `--bg-deep` (#0d0d0d)
- Content blocks / cards: `--bg-surface` (#151518) — 1px lighter
- Insets / code: `--bg-elevated` (#1c1c21) — 1px lighter still
- Hover: `--bg-hover` (#22222a)

This is the same layering the TUI uses for panels. The user feels the system.

**Layout structure:**

- Max content width: 740px for body text (matches TUI compact breakpoint × browser scale)
- Max layout width: 1100px for full-width sections
- Horizontal padding: clamp(1.5rem, 5vw, 4rem)
- Section vertical rhythm: 6rem between major sections (TUI `sectionGap` scaled up)

**Single-column spine.** Not a grid site. Not a feature card grid.
The homepage reads like a well-typeset document — one column, deliberate line breaks,
sections that breathe. Wide layouts are used ONLY where the content demands it
(the pipeline diagram, the artifact table).

---

## Signature Visual Elements

### 1. The Pipeline Diagram

On the homepage and /ada: render Ada's pipeline as a horizontal flow using the actual
glyph vocabulary from the CLI:

```
◇ INT  →  ◇ ENT  →  ◇ PRO  →  ◇ SYN  →  ◇ VER  →  ◈ GOV
```

Use `--text-tertiary` for inactive stages, `--accent` for the active/current one.
Render in Geist Mono. No icons, no boxes, no illustrations.
The pipeline is described by its own symbols.

### 2. The Terminal Inset

On /ada: a static code block (not faked as live) showing a real Ada session:

```
$ ada compile

◈ Ada 0.1.0 — semantic compiler
  Motherlabs

◇ INT  Excavating intent...
  goal: build a task management system for solo developers
  unknowns: 2 blocking

◈ ENT  Mapping entities...
  Task, Project, Tag, Status — 4 entities extracted
  provenance: intact

◆ GOV  Blueprint sealed
  ML.GOV.3f8a9c12/v1 — ready for execution
```

This is honest product communication — it shows the actual output, not a mockup.
The design challenge is making it beautiful. Use: `--bg-surface` background,
`--accent` for the ◈ glyphs, `--text-secondary` for labels, `--text-primary` for values.

### 3. The Separator Language

Between sections, instead of horizontal rules or cards, use a single centered line:

```
    ◈
```

In `--text-tertiary`. 1.5rem font-size, Geist Mono. Nothing else.
This is the TUI's `pipeline.separator` (·) elevated to structural punctuation.

---

## Motion

All motion: CSS transitions only. No library.

- Hover on interactive elements: `transition: color 120ms ease, background 120ms ease`
- Link underlines: animate width from 0 to 100% on hover (`::after` pseudo-element)
- Section entrance: `opacity 0 → 1` with `translateY(8px → 0)` at 200ms, no delay
- The diamond breathe: only on the hero ◈, loops continuously at low opacity

No scroll-jacking. No parallax. No animated backgrounds.

---

## What the Hero Actually Is

The hero is not a gradient. It is not a product screenshot behind a marketing headline.
It is type on dark. That is all.

Structure:

```
[section label in UPPERCASE monospace, --text-tertiary]

[display headline — 2–3 lines max, weight 800]

[1–2 sentence subheadline, --text-secondary]

[◈ Get started]  [Read the docs →]

[pipeline diagram: ◇ INT → ◇ ENT → ◇ PRO → ◇ SYN → ◇ VER → ◈ GOV]
```

The section label (e.g. `MOTHERLABS / ADA`) gives the hero a journalistic structure —
like a magazine header, not a billboard. The label is small, monospace, widely tracked.

The pipeline diagram below the CTA is the first product signal. No words needed —
the stages speak for themselves to the target audience.

---

## What "Frontier" Means Here

Frontier is not a visual effect. It is the refusal to use visual effects as a substitute
for meaning.

Frontier is:

- Using the actual CLI glyph vocabulary as web design tokens
- A color palette with character (the steel-blue accent, the warm off-white text)
- Type that is sized and weighted with editorial intention, not template defaults
- A site where every visual decision traces back to the product it represents
- No single element you could copy-paste from a Framer template

Frontier is NOT:

- Glassmorphism
- Gradient meshes
- Animated hero backgrounds
- 3D product mockups
- Neon glow effects
- "AI aesthetic" purple gradients
- Anything Midjourney-generated

The standard: a designer who works at Linear or Vercel should look at this
and recognize it as peer-level work — not because it looks like their work,
but because it is as considered as their work.

---

## Reference Energy

Extract the principle, not the design:

1. **Linear.app** — dark mode mastery, type at scale, tool aesthetic without coldness.
   Extract: confidence in negative space, high contrast without harshness.

2. **Warp.dev** — developer tool that became a beautiful product without losing
   its tool identity. Shows the actual product, doesn't hide behind metaphors.
   Extract: honesty about what the product is, CLI aesthetic as brand.

3. **Oxide Computer** — writing as design. Engineering ethos is the brand.
   Extract: prose quality = design quality. No decoration to compensate for weak copy.

4. **Vercel CLI** — monospace + proportional interplay, clean command UI.
   Extract: Geist Mono as a design element, not just code formatting.

5. **Stripe API docs** — not a marketing site, but the best information hierarchy
   in the industry. Every label, every indent, every weight decision is intentional.
   Extract: typographic hierarchy as the primary design tool.

NOT: any site that uses hero gradients, stock illustration, icon grids, or
the words "revolutionize," "unlock," "unleash," or "empower."

---

## Done Looks Like

A senior engineer at a developer tools company lands on motherlabs.ai and thinks:

"Whoever built this understands what they're building.
The design is an argument about the product — not decoration on top of it.
I want to read every word."

Not:
"Nice design." (decorative — means it's divorced from the product)
"This looks like a YC startup." (means it borrowed a template)
"I don't know what this does." (means design failed its job)
