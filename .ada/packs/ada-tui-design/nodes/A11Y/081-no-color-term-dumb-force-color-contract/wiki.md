# A11Y.081 · NO_COLOR / TERM=dumb / FORCE_COLOR contract

> ∴ inference · L3 · C4 · area **A11Y** · from `src/core/grammar.ts`

## Summary
Honour NO_COLOR (presence only), TERM=dumb, non-TTY; let FORCE_COLOR and --color/--no-color override with precedence flag > config > env. grammar.ts checks NO_COLOR+isTTY (correct but incomplete) — add the rest and snapshot-test tree+reader at FORCE_COLOR=3/1 and NO_COLOR=1 so 'degrades gracefully' is verified, not hoped.

## Why it matters
The colour contract is a published convention; honouring it precisely is part of being a well-behaved, premium CLI.

## Failure if missing
NO_COLOR is ignored or FORCE_COLOR can't force colour back; power users and accessibility users both get the wrong output.

## Links
- parents: `A11Y.080`
- children: —
- dependsOn: —
- siblings: `PALETTE.023`
- guardedBy: `no_color_no_ansi` (deterministic C)
