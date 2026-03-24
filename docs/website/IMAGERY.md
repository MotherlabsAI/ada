# motherlabs.ai — Imagery Strategy

**Authority:** defines what visual assets appear on the site and why.
Derived from: BRAND.md, DESIGN_DIRECTION.md.
Every decision here traces to a product principle or is cut.

---

## The Governing Constraint

Ada is a CLI tool. Its aesthetic is the terminal.
Imagery that contradicts this signals that the site is selling something
that doesn't exist yet. It undermines the product's credibility.

**The rule:** if an image couldn't appear in a terminal or technical documentation,
explain why it belongs on this site before adding it.

No stock illustration. No floating 3D shapes. No gradient spheres.
No abstract "AI" imagery — neural networks, glowing nodes, brain graphics.
These are the visual equivalent of the dead claims in BRAND.md.

---

## What Ada's Visual Language Is

Typography and glyphs do the work. The terminal is the reference.

- Box-drawing characters as structural elements
- Monospace grids — output that looks like it came from a real compilation
- ◈ as the single identity mark — used sparingly, not decoratively
- Color from the design system only: deep bg, surface stack, steel blue accent, off-white text

This is not minimalism as an aesthetic choice.
It is accuracy: the product looks exactly like this when you run it.

---

## Approved Visual Patterns

### Terminal output blocks

Rendered HTML that looks like a real CLI session.

```
◈ ada compile
  ◦ CTX   reading codebase context
  ◦ INT   structuring intent graph
  ◦ ENT   extracting entities
  ✓ SYN   synthesis complete
  ✓ GOV   governor: APPROVED (0.94)

  output → CLAUDE.md  agents/  hooks/
```

This is the primary visual content on the site.
It shows exactly what the user will see when they run Ada.
No explanation needed. The output is self-documenting.

### CLAUDE.md excerpt

A rendered preview of actual CLAUDE.md output — real content, not Lorem Ipsum.
Shows that the output is readable, structured, and traceable to plain language intent.
Must be from a real compilation, not a fabricated example.
The video demo repo provides this artifact.

### Before / after (no graphics needed)

The contrast is stated in prose, not shown in graphics:

> Before Ada: description in a chat window, forgotten after the session.
> After Ada: CLAUDE.md in the repo root, read by Claude Code every session.

No visualization required. The comparison is factual and specific.

---

## The Video Demo

The video is the primary visual asset. It is not an image — it is proof.

When embedded on the site:

- Thumbnail shows the terminal, not a face or a slide
- No caption that sells the video — just the timestamp (30:00) and the brief
- Embedded after the pipeline explanation, not in the hero
- The GitHub repo link accompanies the embed — the repo is the secondary artifact

Do not manufacture a thumbnail with a red circle and an arrow pointing at something.
The terminal output is interesting enough to be the thumbnail.

---

## Profile / About Image

If a photo of Alex appears anywhere on the site:

- Context: /lab page only — not homepage, not /ada
- No professional headshot aesthetic
- Candid is fine. The lab persona is the person, not the brand.
- If there is no good photo, do not use one. Text is sufficient.

The credibility on /lab comes from specificity ("~400 iterations since late 2024"),
not from a professional image.

---

## What Not to Use

| Asset type                      | Why not                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| Stock photos                    | Contradiction — Ada is built by one person, not a team with a photo budget |
| Illustration of "AI thinking"   | Internal vocabulary made visual — meaningless                              |
| Gradient mesh backgrounds       | Signals consumer product, not developer tool                               |
| Icon sets (Font Awesome, etc.)  | Break the monospace language; add visual noise                             |
| Screenshots with fake data      | Must be real output from real compilations                                 |
| Mockup devices (phone/laptop)   | Ada is a CLI — device framing is inaccurate                                |
| Dark/light mode toggle graphics | Not a feature that needs visual marketing                                  |
| "Team" photos                   | There is no team                                                           |

---

## When New Visual Assets Are Needed

Before adding any visual asset, answer:

1. Does it show something real about the product?
2. Is it derivable from actual CLI output?
3. Does it match the design system palette exactly?
4. Would a developer trust it or dismiss it?

If any answer is no: do not add the asset.

The site grows with real proof artifacts — real CLAUDE.md outputs, real terminal sessions,
real compilation records. Not with designed images that simulate what the product does.
