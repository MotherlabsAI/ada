# NAV.050 · Filter-as-you-type that PRUNES the tree

> ∴ inference · L4 · C2 · area **NAV** · from `docs/SURFACE-DESIGN.md`

## Summary
The single biggest upgrade: any printable key in tree mode enters a filter substate that rebuilds the tree from only matching nodes + their ancestor area headers, auto-opens those areas, pre-selects the best match so ⏎ opens immediately, shows the live pattern in the bottom bar, and Esc restores fold state. matchNode() already exists and is unit-tested.

## Why it matters
It is the realistic way to find one of 30+ nodes without knowing its id, and pruning (vs jump-to-first-match) keeps you oriented — you see WHICH area a match lives in.

## Failure if missing
Today's onCommand('search') jumps the cursor and discards structure; the user finds a match but loses the map.

## Links
- parents: `ROOT.000`
- children: `NAV.051`, `NAV.052`, `NAV.053`
- dependsOn: —
- siblings: `NAV.051`, `NAV.052`
- guardedBy: —
