# CLAUDE.md — Ada TUI Surface (governed design context)

You are building or refactoring **Ada's own terminal surface** (`src/tui/ink/`, Ink 7 /
React 19 / Node 22, ESM, `.ts` with `createElement` — no `.tsx`). This file is the
compiled context for that work. Operate from it, not from a raw prompt. It is exploratory
context (A1): the C checks in `c/` are the only deterministic part.

## The one-line brief

One warm accent on calm earth neutrals, one focal point per screen, one moving thing at a
time, a frame that never jumps — Claude Code's calm, premium **sister**. Terracotta/plum
is ours; match the restraint, never copy the hue. It must stay fully legible with colour
stripped, because Ada's users are non-technical and paying (ROOT.001, ROOT.002).

## Non-negotiable invariants (verify before you call any change done)

1. **Colour is redundant, never load-bearing** (A11Y.080). Every state shown in colour
   ALSO has a glyph/label. The app is fully usable with colour stripped.
   → enforced by `color_has_glyph`.
2. **AA contrast on all text** (PALETTE.022). Body text ≥ 4.5:1, marks ≥ 3:1 on `bg`.
   → enforced by `contrast_aa`. **Known live defect:** `textMuted #7A6650` = 3.33:1, fails.
   Fixing it (lift toward `#8C7458`+) is the acceptance gate.
3. **NO_COLOR / TERM=dumb / non-TTY emit zero ANSI colour** (A11Y.081, STATE.074).
   Precedence: flag > config > env. → enforced by `no_color_no_ansi`.
4. **The frame never jumps** (LAYOUT.030/031, MOTION.043). Status top / body `flexGrow:1` /
   footer pinned bottom; the activity row is fixed-height whether or not it animates.
5. **One clock, one moving thing** (MOTION.040/044). A single shared timer; never animate
   idle chrome, stats counts, or selection beyond its highlight; `isActive:false` when idle.
6. **No new runtime deps for identity/motion** (IDENT/MOTION). Gradient, block cursor, and
   spinner are owned in `art.ts` (~15–20 lines each) — not `ink-gradient`/`ink-spinner`/`ink-big-text`.
7. **Sovereignty** (A9). Runs and exits; the only outbound call is the single compile-time
   model invocation. No telemetry, no notifications that phone home.

## The two-tier colour system (do not collapse it)

- **Role tokens** (`tokens.ts`) skin the **chrome** (`bg`/`text`/`accent`/`focus`…), 60/30/10.
  Re-skin the whole shell from this one file.
- **Pigments** (`grammar.ts` `COLOUR_HEX`) carry **meaning** (truth class, cluster, check).
  Category and meaning never share a token (PALETTE.020). Hue = "what area"; luminance
  (dim/normal/bold) = "how important"; cap simultaneous hues at ~7, repeat don't invent.

## Where to start (high-value nodes)

- `MOTION.041` compile heartbeat — the 9 stages (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) made
  visible with a determinate bar. THE trust moment; a bar, not a spinner (total is known).
- `NAV.050` filter-as-you-type that **prunes** the tree (not jump-to-first-match). Highest
  leverage; `matchNode()` already exists and is unit-tested.
- `LAYOUT.034` one focal point — replace the full-width inverse selection bar with
  `❯` caret + bold label + a dark desaturated area-hue background bar.
- `FLOW.060` welcome = recognition over recall (actions shown, sidebar narrates, contextual hints).

## How to work

- Read `wiki/index.md` → `wiki/data-model.md` → the relevant area's nodes before editing.
- Make a change → run `node c/checks/verify.mjs` → it must pass (or you must be fixing the
  one known live defect). Subjective calls (calm/premium/one-focal-point) are **Alex's gate**
  (A4) — surface them, don't decide them silently.
- Honour the residue: UNK.100–107 are open. If your change touches one (light mode, mouse,
  editable playground, first-run, i18n, chat-input, notifications, theming), say so and
  propose — don't quietly bake an assumption into the layout engine.

## Acceptance

A change is done when: the three C checks pass (or progress a known defect), the surface is
legible under `NO_COLOR` and at 80×24, nothing in the frame jumps on resize or during
animation, and any subjective/identity decision has been surfaced for the human gate.
