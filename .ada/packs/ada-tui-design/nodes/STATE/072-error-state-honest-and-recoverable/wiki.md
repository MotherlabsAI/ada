# STATE.072 · Error state — honest and recoverable

> ∴ inference · L3 · C2 · area **STATE** · from `src/cli.ts`

## Summary
When a compile fails (e.g. model returns prose around the JSON — the tolerant-extraction path), the surface says what failed in plain language, preserves any partial work, and offers the next step (retry / open partial / report). A hole is better than a lie (A4): never fake a finished pack.

## Why it matters
How software behaves when it breaks is most of how trustworthy it feels; honesty under failure is the premium signal.

## Failure if missing
A raw stack trace or a silently empty pack; the non-technical user is stranded with no recoverable next step.

## Links
- parents: `FLOW.061`
- children: —
- dependsOn: —
- siblings: `STATE.071`
- guardedBy: —
