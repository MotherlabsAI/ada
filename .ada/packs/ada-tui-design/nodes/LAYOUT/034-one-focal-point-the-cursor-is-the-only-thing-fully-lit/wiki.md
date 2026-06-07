# LAYOUT.034 · One focal point — the cursor is the only thing fully lit

> ∴ inference · L3 · C2 · area **LAYOUT** · from `docs/SURFACE-DESIGN.md`

## Summary
One high-contrast focal point per screen. Replace the full-width inverse bar (which strobes on scroll and erases the row's area hue) with a ❯ caret + bold label + a dark desaturated area-hue background bar, so selection is unmistakable AND the area colour survives on the selected row.

## Why it matters
A single lit focus is how the eye is led; throwing the whole row to inverse destroys the one colour you most want to read.

## Failure if missing
During scroll the inverse bar strobes and the selected node loses its identity colour exactly when you're trying to identify it.

## Links
- parents: `ROOT.001`
- children: —
- dependsOn: `PALETTE.024`
- siblings: `NAV.053`
- guardedBy: `color_has_glyph` (deterministic C)
