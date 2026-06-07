# PALETTE.022 · Contrast is law — AA on every text role

> ∴ inference · L3 · C5 · area **PALETTE** · from `docs/SURFACE-DESIGN.md`

## Summary
Every token used for TEXT must meet WCAG AA on bg #1B1410 (≥4.5:1 body, ≥3:1 large). This is pure math on the hex pair — checkable, no taste. The research already flags real failures (textMuted, slate-as-text, deep_blue).

## Why it matters
Legibility is the floor of 'premium'; a beautiful unreadable label is a defect, and contrast is the one design property that is fully deterministic.

## Failure if missing
textMuted #7A6650 (~3.4:1) ships as body text on bg and low-vision users — who paid — cannot read the metadata.

## Links
- parents: `PALETTE.020`
- children: —
- dependsOn: —
- siblings: `A11Y.081`
- guardedBy: `contrast_aa` (deterministic C)
