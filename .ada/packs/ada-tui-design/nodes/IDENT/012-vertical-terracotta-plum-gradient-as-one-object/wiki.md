# IDENT.012 · Vertical terracotta→plum gradient as one object

> ∵ source · L3 · C2 · area **IDENT** · from `src/tui/ink/art.ts`

## Summary
The wordmark is ramped top→bottom terracotta→clay→amber (art.ts bannerGradient, ~250ms/step triangle wave) — vertical/per-row, so the tall block reads as one coherent object. Dependency-free (~15 lines hexToRgb+lerp); no ink-gradient.

## Why it matters
A per-row ramp keeps the block legible as a single mark; per-character horizontal gradients look noisy and fight AESTH.005.

## Failure if missing
A rainbow per-letter wordmark turns the signature mark into confetti and adds a dependency for 20 lines of owned code.

## Links
- parents: `IDENT.010`
- children: —
- dependsOn: `PALETTE.021`
- siblings: `IDENT.011`
- guardedBy: —
