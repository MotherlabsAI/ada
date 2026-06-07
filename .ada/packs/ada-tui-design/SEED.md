# ⟦ SEED ⟧

**Root intent.** The design / UI / UX of Ada's _own_ terminal surface — the TUI a
non-technical, paying builder meets when they run `ada`. It must read as Claude
Code's calm, premium **sister**: one warm accent on earth neutrals, one focal point
per screen, one moving thing at a time, a frame that never jumps. Terracotta / plum
is ours — match Claude Code's restraint, never copy its hue. And it must stay **fully
legible with colour stripped** (`NO_COLOR`, screen reader, 80×24), because "premium,
legible, calm" has to include everyone who paid, not just the designer's truecolor iTerm.

**Domain.** Terminal UI/UX design for a local-first semantic compiler (Ink 7 / React 19 / Node 22, ESM).
**User role.** A non-technical builder (the normal case) returning to, or meeting, Ada for the first time.

**Build objective.** Compile the design problem space so an executor refactors/extends
the surface from a governed world model (identity, palette, layout, motion, nav, flow,
state, a11y, voice) — not from taste-of-the-day.
**Knowledge objective.** A navigable, compounding model of the surface across 11 areas
(ROOT, IDENT, PALETTE, LAYOUT, MOTION, NAV, FLOW, STATE, A11Y, VOICE, UNK).
**Trust objective.** Deterministic C checks where the surface is checkable (contrast,
colour-strip legibility, glyph redundancy); honest residue (Ω) where it is taste (A3/A4).

## Known context (the excavation sources)

- `src/tui/ink/` — the live shell: `tokens.ts` (60/30/10 role tokens), `theme.ts`,
  `art.ts` (wordmark / eye mascot / gradient / star), `Welcome.ts` (compiled home),
  `StatusBar.ts`, `App.ts` (status/body/footer skeleton).
- `src/core/grammar.ts` — the meaning-colour pigments + truth glyphs (∵ ∴ Ω κ).
- `docs/SURFACE-DESIGN.md` — a 6-agent research fan-out (2026-06-02) grounded in the
  live code + verified Ink 7 APIs. The primary design dossier.
- `AXIOMS.md` — frozen-v2: A1 (determinism boundary), A2 (excavation/provenance),
  A3 (C contains no model), A4 (humans govern), A9 (sovereignty / no phone-home).

## Unknown context (residue — the unknown-unknowns, cluster UNK / Ω)

- **Light mode / adaptive theme** — every contrast figure is measured on one dark
  reference; a light-terminal user gets dark-tuned earth tones (UNK.100).
- **Mouse / OSC-8 hyperlinks** — clickable pack paths vs deliberate keyboard-purity (UNK.101).
- **The editable playground (A1/D3)** — spawning nodes / dragging edges in a TUI has
  zero surface design yet; the "playground" promise is currently hollow (UNK.102).
- **True first-run onboarding** — recognition-over-recall is tuned for returning Alex,
  not a stranger who's never seen a graph/pack/node (UNK.103).
- **i18n / non-Latin wordmark / RTL** — all copy + box widths assume monospace Latin (UNK.104).
- **Persistent chat-input beside the tree** — the named next architectural step; two
  focus regions, `useFocusManager`, unexcavated (UNK.105).
- **Notifications on long compile vs A9 sovereignty** — any out-of-band signal risks
  phoning home or shattering the calm (UNK.106).
- **Theme-ability vs identity dilution** — the token system invites re-skinning; the
  base16 trap erases the recognisable Ada (UNK.107).

## Assumptions

- Ink 7.0.5 / React 19 / Node 22 / ESM (verified against `node_modules/ink/build`).
- Dark terminal background is the reference surface (see UNK.100 for the gap).
- One interactive pane at a time today (welcome | graph | reader) — a deliberate
  simplification with a known expansion point (UNK.105).

## Constraints

- Local-first; the only outbound call is the single compile-time model invocation (A9).
- No subjective claim promoted to deterministic C (A3). Taste is human-gated (A4).
- Zero new runtime deps for identity/motion — the gradient, cursor, and spinner are
  ~15–20 lines each, owned in-repo (`art.ts`), not `ink-gradient`/`ink-spinner`/`ink-big-text`.

## Risks

- Confetti: per-row colour on every tree line + multi-hue chrome reads busy (PALETTE.024, LAYOUT.034).
- Frame jitter: spinners/toasts pushing layout down; stale dims on resize (MOTION.043, STATE.073).
- Colour-only meaning: any state shown only in colour vanishes under NO_COLOR/colour-blindness (A11Y.080).

> Provenance: Excavated from one intent (Ada's own TUI) by the design compiler; grounded
> in `src/tui/ink/` + `docs/SURFACE-DESIGN.md`. Exploratory layer (A1); every node carries
> a truth class + `from` pointer (A2). Deterministic checks in `c/`; honest residue in UNK.
