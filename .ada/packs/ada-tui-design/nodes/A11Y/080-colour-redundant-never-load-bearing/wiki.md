# A11Y.080 · Colour redundant, never load-bearing

> ∵ source · L4 · C4 · area **A11Y** · from `src/core/grammar.ts`

## Summary
Every state shown in colour is ALSO shown by a glyph/label, and the app stays fully usable with colour stripped. Ada is close: ❯ cursor, ✗ rejected, ⊙ flagged, ∵/∴/Ω truth glyphs, ◈/◦ symbols. Make 'every coloured state also has a glyph' a DOCUMENTED, checkable invariant so it can't regress.

## Why it matters
It's the foundation of both colourblind access and NO_COLOR legibility — and the AESTH.005 rule (colour carries meaning, not decoration) taken to its logical floor.

## Failure if missing
A status communicated by colour alone vanishes for ~8% of men and 100% of NO_COLOR users; meaning is silently lost.

## Links
- parents: `ROOT.002`
- children: `A11Y.081`, `A11Y.082`, `A11Y.083`
- dependsOn: —
- siblings: `A11Y.081`, `A11Y.082`
- guardedBy: `color_has_glyph` (deterministic C)
