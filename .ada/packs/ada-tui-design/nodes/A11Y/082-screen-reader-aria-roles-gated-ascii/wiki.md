# A11Y.082 · Screen reader — aria roles + gated ASCII

> ∴ inference · L3 · C3 · area **A11Y** · from `docs/SURFACE-DESIGN.md`

## Summary
Ink Box accepts aria-role (list/listitem/tablist/textbox) and aria-state ({selected,expanded,busy}). Tag the tree 'list', each row 'listitem'+selected, clusters expanded, the slash input 'textbox'; gate decorative ASCII (mascot/wordmark) behind useIsScreenReaderEnabled() so SR users get content, not box-drawing noise.

## Why it matters
Ada's users are explicitly non-technical and pay real money — 'premium, legible, calm' must include screen-reader users, not just sighted ones.

## Failure if missing
A screen reader reads the box-drawing wordmark character by character and never reaches the actual menu.

## Links
- parents: `A11Y.080`
- children: —
- dependsOn: —
- siblings: `A11Y.083`
- guardedBy: —
