# MOTION.043 · Reduced motion + reserve the space

> ∴ inference · L3 · C4 · area **MOTION** · from `docs/SURFACE-DESIGN.md`

## Summary
ADA_REDUCED_MOTION (and NO_COLOR/CI) forces isActive:false everywhere: spinners→static glyph, reveals→instant, bars→final; any keypress during a reveal jumps to settled state. The status/activity row holds a FIXED height whether or not it's animating, so a spinner appearing never pushes layout down.

## Why it matters
Motion is an accessibility hazard for some users and a layout-jitter hazard for everyone; both escape hatches are non-negotiable for 'premium'.

## Failure if missing
A spinner appears, the layout jumps a row, and motion-sensitive users get no way to turn it off.

## Links
- parents: `MOTION.040`
- children: —
- dependsOn: `A11Y.081`
- siblings: `MOTION.044`
- guardedBy: —
