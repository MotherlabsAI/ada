# PALETTE.023 · Capability-aware degradation ladder

> ∴ inference · L3 · C4 · area **PALETTE** · from `src/core/grammar.ts`

## Summary
One codepath owns the fallback truecolor → 256 → 16 → mono. Detect level (supports-color/chalk.level), never hardcode the 16 ANSI indices for brand colours (the base16 remap trap) — use named RGB and let it downsample. tokens.ts already documents a 16-colour fallback per role.

## Why it matters
grammar.ts paint() emits raw 24-bit escapes unconditionally, which wash out over SSH/sudo/256-colour; the ladder makes earthy-and-legible survive every terminal.

## Failure if missing
Brand colours render wrong or invisible on a 256-colour terminal; the user blames Ada for a 'broken' screen.

## Links
- parents: `PALETTE.020`
- children: —
- dependsOn: —
- siblings: `A11Y.081`
- guardedBy: `no_color_no_ansi` (deterministic C)
