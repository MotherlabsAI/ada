# Workflows — the journeys

## Welcome home — recognition over recall
The home screen SHOWS the actions (Compile / Open / Interview / Browse / Settings) with an arrow-nav menu, a sidebar that narrates the focused item, and a 'your projects' panel of packs on disk with node/κ/Ω counts — not a memorized command list. Key hints are the 3–5 keys that matter right now.

*Why:* Recognition-over-recall is what makes a TUI usable by a non-technical user on first run; they pick from what they see, not what they remember.

## Compile journey — a sentence becomes a pack
The core trust moment: one sentence of intent → the 9-stage heartbeat (visible, determinate) → a finished pack the user can open. Input is usable immediately (no blocking intro >3s); completed stages scroll into <Static>; the end state hands off to the graph, not a dead 'done'.

*Why:* This is A8 made tangible — the one journey that must feel like a real compiler doing real work, because it's where the product earns its price.

## Open / Browse / Resume — pick up where you left off
Open targets the most-recent pack by default; Browse/Resume jumps back into it and restores position. The sidebar lists recent packs with the active one marked. The default action is always the thing the user most likely wants next.

*Why:* Returning users should re-enter their work in one keystroke; a compiler people pay for is a tool they come back to.

## Reader — full-width capsule + neighbour strip
Nodes carry 200+ word capsules that need full width, so the reader is a full-screen overlay (not a cramped split). A tiny one-hop neighbour strip in area colours sits in the header (◦ATT.004 ─┬─▶ ◦ATT.007(here) ◀─── ◦ATT.006) so a node's position in the web reads BEFORE its body.

*Why:* Position-before-prose lets the user orient in the graph before committing to 200 words; the strip is the cheapest map of local structure.

## State coverage
- **Empty state — no packs yet** — With zero packs the projects panel reads 'no packs yet — Compile an idea' and the default action is Compile.
- **Compiling / in-flight — never looks frozen** — While the single compile-time model call (A9) is in flight, the heartbeat + stage label + determinate bar prove liveness; the activity row is fixed-height so nothing jumps; ctrl-c is honoured.
- **Error state — honest and recoverable** — When a compile fails (e.
- **Resize / SIGWINCH — dimensions stay live** — Use Ink's useWindowSize() (re-renders on SIGWINCH) instead of reading stdout.
- **Non-TTY / CI / piped — clean fallback** — canRunInk gates the interactive shell; non-TTY/CI/piped output degrades to plain lines (no box-drawing, no ANSI, no animation).
