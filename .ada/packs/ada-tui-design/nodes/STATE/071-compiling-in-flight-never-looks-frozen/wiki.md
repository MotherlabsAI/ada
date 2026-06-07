# STATE.071 · Compiling / in-flight — never looks frozen

> ∴ inference · L3 · C2 · area **STATE** · from `docs/SURFACE-DESIGN.md`

## Summary
While the single compile-time model call (A9) is in flight, the heartbeat + stage label + determinate bar prove liveness; the activity row is fixed-height so nothing jumps; ctrl-c is honoured. The one slow network call in the whole app is the one that most needs to feel alive.

## Why it matters
The compile is the only long wait in Ada; visible liveness there is the difference between 'working' and 'hung'.

## Failure if missing
A frozen-looking screen during a 20s compile reads as a crash; the user kills it mid-pack.

## Links
- parents: `FLOW.061`
- children: —
- dependsOn: `MOTION.041`
- siblings: `STATE.072`
- guardedBy: —
