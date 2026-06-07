# Ada TUI Surface — Design World Model

> The recursively-excavated UI/UX problem space for Ada's own terminal surface — the calm, premium, earth-toned sister to Claude Code. Every node traces to code (`src/tui/ink/`) or the research dossier (`docs/SURFACE-DESIGN.md`); open questions are honest residue (Ω).

**Map.** 51 nodes · 77 edges · 3 deterministic checks · 8 residue · 11 areas.

## Start here (high-value nodes)
- ∴ **ROOT.000** Ada Surface Design World Model — The bounded design context for Ada's own terminal surface — not everything about TUIs, only what an executor needs to build/refactor THIS shell: identity, palette, layout, motion, nav, flow, state, a11y, voice, and honest residue.
- ∵ **ROOT.001** North-star: Claude Code's calm, premium sister — The brief in one line: one accent on calm earth neutrals, one focal point per screen, one moving thing at a time, a frame that never jumps.
- ∵ **ROOT.002** The paying non-technical user is the design constraint — Ada's users are explicitly non-technical and pay real money (Motherlabs vision; A8).
- ∵ **PALETTE.020** Two tiers: role tokens (chrome) vs pigment (meaning) — tokens.
- ∴ **MOTION.041** Compile heartbeat — the 9 stages made visible — THE place Ada should feel alive: a heartbeat (· ✢ ✳ ✶ ✻ ✽, ~80–100ms, plum) paired with the REAL current pipeline stage (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) and a determinate bar `stage 4/9` — a bar, not a spinner, because the total is known.
- ∴ **NAV.050** Filter-as-you-type that PRUNES the tree — The single biggest upgrade: any printable key in tree mode enters a filter substate that rebuilds the tree from only matching nodes + their ancestor area headers, auto-opens those areas, pre-selects the best match so ⏎ opens immediately, shows the live pattern in the bottom bar, and Esc restores fold state.
- ∵ **FLOW.060** Welcome home — recognition over recall — The home screen SHOWS the actions (Compile / Open / Interview / Browse / Settings) with an arrow-nav menu, a sidebar that narrates the focused item, and a 'your projects' panel of packs on disk with node/κ/Ω counts — not a memorized command list.
- ∴ **FLOW.061** Compile journey — a sentence becomes a pack — The core trust moment: one sentence of intent → the 9-stage heartbeat (visible, determinate) → a finished pack the user can open.
- ∵ **A11Y.080** Colour redundant, never load-bearing — Every state shown in colour is ALSO shown by a glyph/label, and the app stays fully usable with colour stripped.

## Areas
- **ROOT** — Design world model & north-star (3 nodes)
- **IDENT** — Visual identity — wordmark, mascot, gradient (4 nodes)
- **PALETTE** — Colour system — tokens, contrast, degradation (5 nodes)
- **LAYOUT** — Spatial structure — skeleton, whitespace, focus (5 nodes)
- **MOTION** — Calm motion — one clock, heartbeat, restraint (5 nodes)
- **NAV** — Navigation — prune-filter, edges, keymap (4 nodes)
- **FLOW** — Journeys — welcome, compile, open, reader (4 nodes)
- **STATE** — States & edge cases — empty, error, resize, non-TTY (5 nodes)
- **A11Y** — Accessibility — colour-free legibility, SR, keyboard (4 nodes)
- **VOICE** — Voice & microcopy — calm, premium, honest (4 nodes)
- **UNK** — Unknown-unknowns — open design residue (Ω) (8 nodes)

## Sections
- [Glossary](glossary.md)
- [Data model](data-model.md) — the token + component contract
- [Workflows](workflows.md) — the journeys
- [C checks](c-checks.md)
- [Open questions](open-questions.md) — the unknown-unknowns
- [Risks](risks.md)
