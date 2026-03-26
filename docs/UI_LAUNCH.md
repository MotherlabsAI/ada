# UI_LAUNCH.md — Ada TUI Launch Screen Design

**Authority:** visual and semantic design decisions for the Ada welcome screen (`cli/src/ui/welcome.tsx`).
**Derives from:** `docs/BRAND.md`, `cli/src/ui/design-system.ts`, runtime UI in `cli/src/ui/terminal.tsx`.

---

## What the launch screen is

The welcome screen renders when `ada` or `ada compile` is invoked with no intent argument. It is a waiting compiler, not a greeting. Its job:

1. Establish Ada's identity immediately (visual consistency with runtime)
2. Orient the user: what is about to happen (pipeline preview)
3. Capture intent input

It unmounts the moment the user presses enter. Everything after is the runtime compile UI.

---

## Structure

```
╔══════════════════════════════════════════════════════════╗
║  ◈ ada  v0.1.0                            by motherlabs  ║  ← double border (matches runtime Header)
╚══════════════════════════════════════════════════════════╝
┌──────────────────────────────────────────────────────────┐
│  between what you mean and what gets built,              │  ← recognition: core claim language
│  something gets lost.                                    │
│                                                          │
│  CTX ◇  INT ◇  PER ◇  ENT ◇  PRO ◇  SYN ◇  VER ◇  GOV ◇  │  ← mechanism: 8 stages pending
│  ∴  CLAUDE.md · agents/ · hooks/                        │  ← output: closes the loop
│                                                          │
│  not zero. less.                                         │  ← trust: honest limitation
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  ❯ describe what you're building▌                        │  ← input (border activates on type)
└──────────────────────────────────────────────────────────┘
  esc · exit    enter · compile                  ~/proj…   ← footer (keybinds + truncated cwd)
```

---

## Design decisions

### Header: double border + animated ◈

The runtime compile UI (`terminal.tsx` `Header` component) uses `borderStyle="double"` with `◈ ada  by motherlabs`. The welcome screen uses the identical structure.

The `◈` identity mark animates via `useDiamondBreathe()` — the same hook used in runtime components. Frame sequence: ◇ → ◈ → ◆ → ♦ → ◈ → ◇, eased timing 200/130/100/100/130/200ms. This is the only animation on the welcome screen — deliberate restraint. The compiler is waiting, not performing.

### Context panel: three zones, each answering one question

DESIGN_PSYCHOLOGY.md mandates: "each section answers one question, earns the next." The context panel is structured in three explicit zones:

**Zone 1 — Recognition.** Uses the locked core claim language from BRAND.md: _"between what you mean and what gets built, something gets lost."_ This is user-framing, not product-framing. It names the specific frustration, not a category. The user reads it and feels recognized — their experience with AI-assisted development is named.

**Zone 2 — Mechanism.** All 8 pipeline stages shown as pending (`◇`), followed by `∴  CLAUDE.md · agents/ · hooks/`. The `∴` glyph (glyphs.pipeline.therefore = "∴") means "therefore" — the pipeline therefore produces these artifacts. This closes the loop the pipeline alone leaves open: the user now knows both what will run and what it produces. The `∴` approach avoids hardcoded pixel alignment that would break across terminal widths.

**Zone 3 — Trust.** `"not zero. less."` — the exact phrasing from the locked core claim. DESIGN_PSYCHOLOGY.md calls this the strongest trust signal: "it earns trust by refusing to overclaim." Rendered in `palette.text.dim` — present without demanding attention. The user who reads it feels Ada is being honest with them. The user who doesn't read it isn't distracted.

### Brand vocabulary

The previous implementation used `"semantic compiler · Motherlabs"` on the identity line. BRAND.md invariant: **never use "semantic compiler"** — internal vocabulary that surfaces to users without explanation.

The context panel now uses the locked core claim language directly: "between what you mean and what gets built, something gets lost." This is the correct user-framing. It does not name a product category; it names a pain point.

### Input panel: framed, responsive border

The input prompt is inside a `borderStyle="single"` panel, consistent with all runtime panels. Border responds to input state: `palette.text.ghost` when empty → `palette.accent.dim` when the user has typed. One dynamic element, clear affordance.

### CWD: footer, truncated

Previously shown in the header at the same prominence as identity text. Now in the footer, `palette.text.dim`, truncated to 42 characters from the right. Confirms context without competing.

### Removed: 3×3 diamond logo grid

The previous header used a 3×3 arrangement of `◇ ◆ ◈` glyphs to form a logo. No equivalent in the runtime UI — a standalone design that created inconsistency. The identity mark is now `◈` alone, breathing.

---

## Source files

| File                          | Role                                          |
| ----------------------------- | --------------------------------------------- |
| `cli/src/ui/welcome.tsx`      | Welcome screen component                      |
| `cli/src/ui/design-system.ts` | Palette, glyphs, spinners (canonical source)  |
| `cli/src/ui/hooks.ts`         | `useDiamondBreathe` and other animation hooks |
| `cli/src/ui/terminal.tsx`     | Runtime compile UI — structural reference     |

---

## Key invariants

- Do not use "semantic compiler" anywhere on the welcome screen — BRAND.md prohibits it
- The `◈` identity mark must animate on load via `useDiamondBreathe()` — static is incorrect
- Context panel must use the three-zone structure: recognition → mechanism → trust
- Recognition text must use the locked core claim: "between what you mean and what gets built, something gets lost."
- All 8 pipeline stages must appear as pending (`◇`) followed by `∴  CLAUDE.md · agents/ · hooks/` — the output must close the loop
- `"not zero. less."` must be present and dim — DESIGN_PSYCHOLOGY.md invariant (strongest trust signal)
- Do not use hardcoded `marginLeft` pixel values for pipeline output — use `∴` (glyphs.pipeline.therefore) on its own line
- Border structure must match runtime: `double` for header, `single` for content panels
- Input panel border must respond to input state: ghost when empty → accent.dim when typing
- The cwd must be truncated (42 chars max) and placed in the footer, not the header
