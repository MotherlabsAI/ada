# LAYOUT.031 · Panes never move on their own

> ∴ inference · L3 · C2 · area **LAYOUT** · from `docs/SURFACE-DESIGN.md`

## Summary
The reader and the tree render into the IDENTICAL bodyHeight box (rows−4). Opening/closing a node deepens the same surface instead of repainting a new screen; transitions feel like focus changes, not page loads.

## Why it matters
A surface that stays put under interaction feels solid and premium; one that repaints feels like a web page in a terminal.

## Failure if missing
Following an edge swaps the whole screen; the user loses their place and their sense of where they are.

## Links
- parents: `LAYOUT.030`
- children: —
- dependsOn: `STATE.073`
- siblings: `NAV.052`
- guardedBy: —
