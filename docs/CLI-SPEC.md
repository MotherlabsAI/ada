# Ada CLI — build contract (DRAFT — Alex owns this vision)

> The CLI's one job: **navigate a compiled meaning-graph easily.** It is Claude Code's
> sister — same loop and feel, calm and low-noise, a different face. This doc is the
> target for the `/goal` build. Keys are _proposed_; adjust to taste. Open questions for
> Alex are marked `?ALEX`.

## The model

A pack is a graph, not a list. The CLI must make it three things a list isn't:

1. **A graph you traverse** — walk edges, not just up/down a flat list.
2. **A set you filter** — find the relevant slice of hundreds of nodes instantly.
3. **A map you orient in** — always know where you are and see the shape.

…and then a **surface you shape**: flag what matters, resolve/defer unknowns, export.

## Current state (committed)

Single pane, viewport-clamped (no frame-stacking), aligned tree → scrollable reader.
`↑/↓` move · `⏎` read · `b` back · `space` flag · `x` reject · `g` flagged · `/` cmd · `q` quit.
Good base. Not there yet. The features below are the gap.

## Features (ranked; P0 = the two that change the feel)

### P0 — the feel-changers

1. **Follow the edges (traverse).** In the reader, a node's links are live and selectable
   (parent / child / sibling / compiles-to / verified-by). Press to jump; a **back-stack +
   breadcrumb** (`ROOT ▸ L2C ▸ L2C.001`) means you never get lost.
   _Proposed:_ number the links `1..n`, press the number to jump; `⌫`/`←` pops the stack.
   _Why:_ the value of context is the connections; traversal IS navigation.
2. **Live fuzzy filter (find).** Incremental filter of the tree by id/label/summary; matches
   highlight, `⏎` jumps. _Proposed key:_ `/` opens the filter (move slash-commands to `:`),
   `?ALEX` — or keep `/` for commands and use a different trigger?
   _Why:_ the only thing that keeps the CLI usable as packs reach hundreds of nodes.

### P1 — orientation + shaping

3. **Collapse clusters / shape view.** Fold clusters to header+count; expand one branch.
   `Tab`/`←→` collapse-expand. _Why:_ see the forest before the tree.
4. **Lenses + legend.** One-key filters: flagged ⊙ · residue Ω · checkable κ · gated ! ·
   by truth class. `?` opens a legend decoding glyphs+colours. _Why:_ shape by lens; kill the
   "what does this symbol mean?" friction.

### P2 — depth + authoring

5. **Navigate inside a fat node.** Jump to a node's sections (Residue / C-candidates / Links)
   and open its sub-files (entity-candidates, c-candidates). _Why:_ fat nodes (L2C.001) have
   internal structure worth moving through, not just scrolling.
6. **Flagged tray + residue queue** (the two-section feel). A view of the pack you're
   assembling (one-key export) + a calm queue to resolve-or-defer unknowns. _Why:_ navigation
   becomes authoring — flag what matters, answer the few real questions. Not an interrogation.
7. **Trust strip.** A thin always-on bar: `κ N · Ω M · ! K · ⊙ F`. _Why:_ the pack's trust
   state at a glance — the product's spine, visible.

## Aesthetic constraints (non-negotiable — from AESTH.\*)

- One primary glyph per node. Low glyph density. Colour carries meaning.
- Calm > busy. No mouse, no animation, no multi-pane clutter, no live-recompile-in-TUI (yet).
- Fixed columns, aligned. Truncate, don't wrap, in the tree.
- Feels like Claude Code's sister: same launch, same calm, earthy + plum/deep-blue.

## ?ALEX — the specifics only you hold

- Filter trigger key, and does `/` stay for commands or move to `:`?
- Edge-follow: numbered links, or `Tab`-cycle through a node's links, or both?
- Is the "answer questions" section a separate screen (your two-section idea) or a queue
  inside the same view?
- "I'm Feeling Lucky" export — in scope for the CLI, or later?
- Anything in your head not listed here?

## Build sequence (for /goal)

P0 (#1 follow-edges + breadcrumb, #2 live-filter) → P1 (#3 collapse, #4 lenses+legend) →
P2 (#5 in-node nav, #6 flagged tray + residue queue, #7 trust strip). Each slice ships
behind the existing `node:test` + ink-testing-library harness; pure logic (filter match,
edge resolution, breadcrumb stack) is unit-tested; render is reasoned (no TTY in CI).
