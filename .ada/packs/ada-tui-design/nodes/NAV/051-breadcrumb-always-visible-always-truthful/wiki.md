# NAV.051 · Breadcrumb always visible, always truthful

> ∴ inference · L2 · C3 · area **NAV** · from `docs/SURFACE-DESIGN.md`

## Summary
Once edges cross areas a graph has no canonical parent path; breadcrumb() exists but only feeds the reader. Render the cross-area trail in tree mode too, fed the actual path the user walked, not a fabricated hierarchy.

## Why it matters
In a graph-projected-as-tree the breadcrumb is the only honest 'where am I'; a fabricated parent path is a small lie (A4).

## Failure if missing
The user follows three edges across areas and the breadcrumb still shows the original folder path — orientation is lost.

## Links
- parents: `NAV.050`
- children: —
- dependsOn: —
- siblings: `NAV.052`
- guardedBy: —
