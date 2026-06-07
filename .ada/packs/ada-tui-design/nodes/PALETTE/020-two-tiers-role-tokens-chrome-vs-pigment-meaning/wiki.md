# PALETTE.020 · Two tiers: role tokens (chrome) vs pigment (meaning)

> ∵ source · L4 · C3 · area **PALETTE** · from `src/tui/ink/tokens.ts`

## Summary
tokens.ts splits the namespace: role tokens (bg/text/accent/focus…) skin the CHROME and can re-theme the whole shell from one file; the pigment palette in grammar.ts COLOUR_HEX carries MEANING (truth class, cluster identity, check class). Category and meaning never share a token.

## Why it matters
Keeping the two channels separate is what stops a 10-colour graph reading as confetti and lets the shell be re-skinned without touching meaning-colour.

## Failure if missing
Roles borrow from the area palette (today slate=body, rose=failure, cyan=link) so restyling the chrome silently changes what colours MEAN.

## Links
- parents: `ROOT.000`
- children: `PALETTE.021`, `PALETTE.022`, `PALETTE.023`, `UNK.107`
- dependsOn: —
- siblings: `PALETTE.021`
- guardedBy: —
