# STATE.073 · Resize / SIGWINCH — dimensions stay live

> ∴ inference · L2 · C4 · area **STATE** · from `docs/SURFACE-DESIGN.md`

## Summary
Use Ink's useWindowSize() (re-renders on SIGWINCH) instead of reading stdout.rows once. Today dims are read once and never update, so resizing leaves bodyHeight/banner-width/reader-wrap stale until some unrelated state change repaints. A ~3-line fix that satisfies 'responsive to terminal size'.

## Why it matters
A surface that breaks on resize feels fragile; live dimensions are table stakes for 'works in any terminal'.

## Failure if missing
The user resizes their terminal and the layout is wrong until they press a key — a visible, latent bug.

## Links
- parents: `LAYOUT.030`
- children: —
- dependsOn: —
- siblings: `STATE.074`
- guardedBy: —
