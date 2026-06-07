# UNK.104 · i18n / non-Latin wordmark / RTL — scope or debt?

> Ω residue · L1 · C0 · area **UNK** · from `src/tui/ink/art.ts`

## Summary
The wordmark, tag, and all copy are Latin/English; box-drawing widths assume monospace Latin. Whether Ada ever needs non-Latin labels, RTL layout, or a non-Latin wordmark fallback is undecided — currently latent debt, not a plan.

## Why it matters
Naming the boundary now prevents a silent monolingual assumption from hardening into the layout engine.

## Failure if missing
CJK/RTL support is retrofitted later against width assumptions baked into every box — expensive and fragile.

## Links
- parents: `ROOT.000`
- children: —
- dependsOn: —
- siblings: `UNK.103`
- guardedBy: —
