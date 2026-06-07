# STATE.074 · Non-TTY / CI / piped — clean fallback

> ∵ source · L2 · C4 · area **STATE** · from `src/cli.ts`

## Summary
canRunInk gates the interactive shell; non-TTY/CI/piped output degrades to plain lines (no box-drawing, no ANSI, no animation). alternateScreen is auto-ignored when non-interactive. The wordmark falls back to `ADA · context`.

## Why it matters
Ada is a CLI that must compose in pipes and CI; a TUI that corrupts piped output isn't a good Unix citizen.

## Failure if missing
Piping `ada` into a file captures escape soup and box-drawing characters instead of readable text.

## Links
- parents: `LAYOUT.030`
- children: —
- dependsOn: `A11Y.081`
- siblings: `STATE.073`
- guardedBy: `no_color_no_ansi` (deterministic C)
