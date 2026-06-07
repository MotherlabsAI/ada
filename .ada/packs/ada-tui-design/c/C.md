# C — Deterministic Verification Layer (ada-tui-design)

C is the set of executable checks that state what _correct_ means for the
**checkable** parts of this design. A C check is a runnable pass/fail predicate —
not a prompt, not a model, not subjective judgment (AXIOM A3).

A design pack is unusual: most of what it asserts ("calm", "premium", "one focal
point") is irreducibly subjective and must NOT be forged into a brittle predicate.
So C here is small and sharp — it pins only the design properties that are genuinely
deterministic, and it audits the **live tokens** (read from `../tokens.jsonld`, which
is projected from `src/tui/ink/tokens.ts`). This lints the real surface, not a copy.

## Registry

| check                      | class | invariant                                                                                                                                                                                                                     |
| -------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contrast_aa`              | C5    | Every role token used for text meets WCAG AA contrast on `bg #1B1410`: body text (`text`,`textDim`,`textMuted`) ≥ 4.5:1; marks/large (`accent`,`focus`,`success`,`warning`,`error`) ≥ 3:1. Pure ratio math on the hex pair.   |
| `no_color_no_ansi`         | C4    | Under `NO_COLOR`, the paint path emits zero ANSI SGR colour escapes. Presence-only styling is allowed; colour is not. Guards the A11Y.081 / STATE.074 contract.                                                               |
| `color_has_glyph`          | C4    | Every state communicated by a colour token also carries a non-colour glyph + label, so meaning survives colour-strip and colour-blindness. Audits all 16 projected StateTokens (state/confidence/recency/activity). A11Y.080. |
| `state_color_paired`       | C4    | No status-tier colour is status-only — every status role is carried by ≥1 glyph-bearing state, and no state points at an unknown role. The Slice-1 "rejects unknown status-only colours" rule. A11Y.080 / STATE.074.          |
| `motion_has_reduced`       | C4    | Every motion token declares a reduced-motion alternative, a state reason (no idle/decorative motion), and a calm cadence ≥ 16ms. Motion is never the only carrier. A11Y.081.                                                  |
| `density_budget_monotonic` | C4    | Each graph-density tier caps edges-per-node with a non-colour line weight; budgets increase strictly across tiers, so "too busy" is a checkable threshold, not taste.                                                         |

## Run it

```bash
# from this pack:
node c/checks/verify.mjs            # audit the live tokens
node c/checks/verify.mjs --json     # machine-readable report
node c/checks/verify.mjs --defect   # plant an egregious failure (proves the checks bite)
```

## Current verdict — all green (the Slice-1 acceptance gate is met)

All six checks pass on the live projection (`node c/checks/verify.mjs` → exit 0).
The contrast defect that this pack recorded is **fixed**: `textMuted` was lifted
`#7A6650` (3.33:1) → `#968063` (4.82:1), clearing the 4.5:1 AA floor for body text
(node **PALETTE.022** / **ROOT.002**). `error #B65A6B` (4.04:1) stays fine for marks
but must never be used as body text.

The token contract was projected from `src/tui/ink/tokens.ts` by
`scripts/project-tokens.mjs` on the last build: **14 role · 10 pigment · 16 state
(state/confidence/recency/activity) · 3 density · 5 motion**. Because the jsonld is
a projection, not a hand-authored copy, the checks always lint the real surface —
the "map drifts away from compiler law" failure cannot recur silently.

Run `node c/checks/verify.mjs --defect` to confirm every check still bites (exit 1).

## What is deliberately NOT a check (A3/A4)

Calm, premium, "one accent", "one focal point", tasteful motion, good microcopy —
these are real requirements but **subjective**. They route to rubric scoring (C2) or
**Alex's human gate** (C1), never into C. Forging a non-binary aesthetic rule into a
deterministic predicate is itself the A3 violation. A hole is better than a lie.

## How C grows

A missed failure is the source of new C. When the surface ships something current
checks pass but is still wrong (a layout that jumps, a state with no glyph, a hue
budget blown), that defect is generalised into a new invariant, scope-critiqued
(too narrow / too broad), and added here.
