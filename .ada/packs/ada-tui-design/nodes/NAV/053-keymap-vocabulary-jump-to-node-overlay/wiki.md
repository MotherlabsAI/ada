# NAV.053 · Keymap vocabulary + jump-to-node + `?` overlay

> ∴ inference · L3 · C3 · area **NAV** · from `docs/SURFACE-DESIGN.md`

## Summary
Arrows+hjkl move, l/→/⏎ open, h/← close-or-parent, / filter, Esc clear/back, q quit, ? help. Type trailing id digits or a 2-char hint to teleport in a 30+ node tree. The `?` overlay is GENERATED from a single keymap source of truth so displayed keys can never drift from real bindings. Footer shows only currently-valid keys.

## Why it matters
A single source of truth for keys makes the help overlay provably honest and the footer contextual instead of a dense fixed line.

## Failure if missing
The footer lists keys that don't work in this mode, or the `?` overlay drifts from the real bindings — every shown key is now suspect.

## Links
- parents: `NAV.050`
- children: `UNK.105`
- dependsOn: `A11Y.083`
- siblings: `LAYOUT.034`
- guardedBy: —
