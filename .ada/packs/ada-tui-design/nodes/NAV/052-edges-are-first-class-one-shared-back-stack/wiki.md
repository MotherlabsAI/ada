# NAV.052 · Edges are first-class — one shared back-stack

> ∴ inference · L3 · C3 · area **NAV** · from `docs/SURFACE-DESIGN.md`

## Summary
Ada is a graph projected as a tree; nodes cross cluster boundaries. Following an edge must be as cheap as opening a folder and reversible. The reader's Tab-cycle / ⏎-follow / ⌫-back loop is the right primitive — lift it into the model layer so a key opens a neighbour picker from resolvableLinks() in the TREE too, pushing onto ONE shared backStack.

## Why it matters
Edges are the actual structure; if they're only navigable in the reader, the tree hides the graph's whole point.

## Failure if missing
Edges are invisible in tree mode and the back-stack is reader-only; the user can't traverse the web they were promised.

## Links
- parents: `NAV.050`
- children: —
- dependsOn: `LAYOUT.031`
- siblings: `NAV.051`
- guardedBy: —
