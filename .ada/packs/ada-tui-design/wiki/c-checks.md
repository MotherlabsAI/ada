# C checks — the deterministic floor

Only properties with a runnable pass/fail predicate live here (A3). Run: `node c/checks/verify.mjs`.

| check | class | invariant | guards |
|---|---|---|---|
| `contrast_aa` | C5 | Every role token used for TEXT (text, textDim, textMuted, accent, focus, success, warning, error) meets WCAG AA contrast on bg #1B1410: ≥4. | PALETTE.022 |
| `no_color_no_ansi` | C4 | With NO_COLOR set (or a non-TTY stream), the rendered surface emits zero ANSI SGR colour escapes (no \x1b[3#m / \x1b[38;2;…m). | PALETTE.023, STATE.074, A11Y.081 |
| `color_has_glyph` | C4 | Every state communicated by a colour token is ALSO carried by a non-colour glyph or label, so meaning survives colour-strip and colour-blindness. | LAYOUT.034, A11Y.080, VOICE.092 |

## What is deliberately NOT a check
Calm, premium, "one focal point", tasteful motion — these are real requirements but subjective; they route to rubric (C2) or Alex's human gate (C1), never forged into a brittle predicate. Forging a non-binary rule into C is itself the A3 violation.
