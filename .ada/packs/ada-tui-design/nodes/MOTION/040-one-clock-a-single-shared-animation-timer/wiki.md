# MOTION.040 · One clock — a single shared animation timer

> ∴ inference · L3 · C3 · area **MOTION** · from `docs/SURFACE-DESIGN.md`

## Summary
A single AnimationProvider at the App root owns the only timer and exposes {frame,time} via context; a spinner + a pulse + a reveal cost one timer, not three. isActive = isTTY && !NO_COLOR && (compiling||revealing||welcomeIdle); an idle Ada renders at 0fps.

## Why it matters
Per-component setInterval is the #1 source of out-of-phase flicker and CPU burn; one clock is what makes motion phase-coherent and free when idle.

## Failure if missing
Three timers drift out of phase, the banner and spinner stutter against each other, and a 'calm' surface jitters.

## Links
- parents: `ROOT.001`
- children: `MOTION.041`, `MOTION.042`, `MOTION.043`, `MOTION.044`
- dependsOn: —
- siblings: `MOTION.041`, `MOTION.042`
- guardedBy: —
