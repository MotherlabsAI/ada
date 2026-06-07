# LAYOUT.030 · Fixed skeleton: status / body / footer

> ∵ source · L3 · C3 · area **LAYOUT** · from `docs/SURFACE-DESIGN.md`

## Summary
Status line top, body middle (flexGrow:1), hint/command bar pinned bottom — fixed forever. App.ts already nails this; protect it so the bottom bar truly pins and the body owns all slack.

## Why it matters
Spatial constancy is the cheapest trust signal in a TUI: the user always knows where identity, content, and actions live.

## Failure if missing
Panes drift between screens; the footer floats mid-body; the user re-reads the layout every transition.

## Links
- parents: `ROOT.000`
- children: `LAYOUT.031`, `LAYOUT.032`, `LAYOUT.033`, `STATE.073`, `STATE.074`
- dependsOn: —
- siblings: `LAYOUT.031`
- guardedBy: —
