# IDENT.010 · The ADA wordmark — filled block, with fallbacks

> ∵ source · L3 · C3 · area **IDENT** · from `src/tui/ink/art.ts`

## Summary
A 6-row filled-block ADA (art.ts WORDMARK) for wide terminals; a 3-row compact WORDMARK_NARROW under ~90 cols; a plain `ADA · context` line for non-TTY/piped output. Box width is computed from the longest art row, never guessed.

## Why it matters
The wordmark is the first frame the user sees; it must land identically across terminal widths and degrade to clean text in CI.

## Failure if missing
The banner clips, mis-wraps, or spews box-drawing noise into a pipe — the first impression is broken before the product speaks.

## Links
- parents: `ROOT.001`
- children: `IDENT.012`, `IDENT.013`
- dependsOn: —
- siblings: `IDENT.011`, `IDENT.012`, `IDENT.013`
- guardedBy: —
