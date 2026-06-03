# Ada Surface Design — knowledge pack

> Compiled by a 6-agent research fan-out (2026-06-02), grounded in the live code + verified Ink 7 APIs.

## Ada Terminal Surface — Knowledge Pack

Ada's CLI must read as Claude Code's *sister*: calm, premium, legible, a little alive. This pack merges six dossiers into one prioritized set of moves, every one grounded in the actual code at `src/tui/ink/` and `src/core/grammar.ts`. Verified against the installed stack (ink@7.0.5, react@19.2.7, Node 22, ESM) — all cited Ink APIs exist in `node_modules/ink/build`.

The brief in one line: **one accent on calm neutrals, one focal point per screen, one moving thing at a time, a frame that never jumps.**

---

### Principles

1. **One accent, everything else dim.** Pick the single brand accent (terracotta `#B8543C`, plum `#6E5ACF` as the secondary identity hue) and let 80%+ of the screen live in muted ink (`#9AA3AF`) and dim. Color is a spotlight, not wallpaper. *Ada violates this today:* `StatusBar.ts` fires terracotta + ink + default-white + green + amber simultaneously; `Welcome.ts` fires terracotta + plum + cyan + ink. Both read busy. Cap any one view at 3–4 distinct hues (the gh-aw "Terminal Stylist" budget).

2. **Color is redundant, never load-bearing.** Every state shown in color must also be shown by a glyph/label, and the app must stay fully usable with color stripped. Ada is already close: `❯` cursor, `✗` rejected, `⊙` flagged, `∵/∴/Ω` truth glyphs (`grammar.ts` `TRUTH_GLYPH`), `◈`/`◦` symbols. Make "every colored state also has a glyph" a documented invariant so it can't regress. Honor `NO_COLOR` (presence only), non-TTY, and `TERM=dumb`; let `FORCE_COLOR`/`--color` override (precedence: flag > config > env).

3. **Spatial consistency: panes never move on their own.** Status line top, body middle, hint/command bar bottom — fixed forever. `App.ts` already nails this skeleton (`StatusBar` / body `Box` / `SlashLine`-or-hint). Protect it: the reader and the tree must render into the *identical* `bodyHeight` box (`rows - 4`) so opening/closing a node deepens the same surface instead of repainting a new screen. Add `flexGrow:1` to the body so the bottom bar truly pins.

4. **Whitespace is structural, density is the absence of decorative noise.** One blank line between logical blocks, 1–2 cells of padding inside any framed box, a fixed spacing rhythm held everywhere. `Welcome.ts` already does this well (`paddingX:2, paddingY:1`, explicit gap rows). Never 0-padding (cramped), never random 1-vs-2 newline mixing.

5. **Progressive disclosure of keybindings.** 3–5 keys in the footer, full map behind `?`. The footer changes with context and only ever shows currently-valid actions. The reader footer today (`Tab cycle · ⏎ follow · ⌫ back · ↑/↓ scroll · b tree · q quit · 3/40`) is a dense single line — trim it to the essentials and move the rest into a `?` overlay (reuse the Welcome rounded box, centered over a dimmed body).

6. **Frame sparingly.** One rounded border (the Welcome box) is a signature; bordering every pane is noise. Inside the workbench, separate regions with the `StatusBar` title and a dim hint line — no nested boxes, no second border style.

7. **Calm motion only, where it means real work.** Animate to signal one of three things: the machine is working (compile/IO in flight), where focus is, or a state transition just happened. Never animate idle chrome. This is the motion-extension of Ada's own AESTH.005 ("colour carries meaning, not decoration"). Claude Code's restraint is the model: essentially one animated element at a time.

8. **Hierarchy by luminance, category by hue.** Hue answers *what area*; dim/normal/bold answers *how important*. Humans rank light/dark reliably but not colors — keeping the two channels separate is what stops a 10-color palette reading as confetti, and it degrades cleanly to mono. Cap simultaneously-visible category colors at ~7; repeat colors rather than invent muddy in-between hues.

9. **Render in place, no flicker.** Use Ink 7's `alternateScreen` (vim/htop-style clean buffer, restores scrollback on exit) + `incrementalRendering` (redraw only changed lines) + `maxFps:30`. These are confirmed in the installed `render.d.ts` and currently **unused** — `render()` in `cli.ts:168` is called with no options. `windowSlice` already caps output to `bodyHeight`; pairing it with these flags makes the surface feel steady.

10. **The cursor is the only thing fully lit.** One high-contrast focal point per screen. Keep selection unmistakable but stop *throwing away the area hue*: a full-width `inverse` bar (current `renderLine`, `App.ts:68`) strobes during scroll and erases the per-area color on exactly the row you most want to identify. Prefer a `❯` caret + bold label + a dark desaturated area-hue background bar.

---

### Ink techniques cheat-sheet

*(all verified present in `node_modules/ink/build` — ink@7.0.5)*

- **`useWindowSize()` for live resize.** Returns `{rows, columns}` and **re-renders on SIGWINCH**. Replace `const {stdout}=useStdout(); const rows=stdout?.rows??24` (`App.ts:79–83`) with `const {rows,columns}=useWindowSize()`. This fixes a real latent bug: dimensions are read once and never update, so resizing leaves `bodyHeight`, Welcome `width`, and reader wrap stale until some other state change happens to re-render. ~3-line change, satisfies the "responsive to terminal size" requirement.

- **`render(...)` options.** At the call site (`cli.ts:168`): `render(el, { alternateScreen:true, incrementalRendering:true, maxFps:30, exitOnCtrlC:true })`. Zero component changes. Note `interactive` auto-detects CI/non-TTY and `alternateScreen` is ignored when non-interactive — safe with the existing `canRunInk` fallback.

- **`useAnimation({interval, isActive})` — one shared timer.** Returns `{frame, time, delta, reset}`. **All consumers consolidate into one internal timer / one render cycle** (confirmed in the installed d.ts). A spinner + a pulse + a reveal cost one timer, not three. This is why `ink-spinner` is no longer worth a dependency. `isActive:false` stops the clock (and resets values to 0) → an idle Ada renders 0fps.

- **`usePaste(handler, {isActive})`.** Bracketed-paste mode; pasted multi-line text arrives as **one string** instead of being machine-gunned through `useInput` char-by-char. `SlashLine.ts` hand-rolls a char buffer — add `usePaste((t)=>setBuffer(b=>b+t))` so a pasted intent string isn't mangled. Operates on a separate channel from `useInput`.

- **Block cursor via inverse-char trick (zero-dep).** Render the input buffer with the character under the caret wrapped in `<Text inverse>`. ~20 lines lifted from `ink-text-input`'s technique gives `SlashLine` a real caret without the dependency.

- **`<Static items={[...]}>`.** Renders once *above* the live region and is excluded from every subsequent diff. Use for the Welcome banner and for a scrollback of completed compile/check steps (Gatsby/node-tap pattern). **Not** for the tree (it mutates). This is the single biggest throttling win and it's free: the animation timer's re-render then touches only the moving parts.

- **`Box overflow:'hidden'` + `maxHeight` as a clipping safety net.** Wrap the reader body in `<Box height={bodyHeight} overflow='hidden'>` so a mis-sized slice can never spill and corrupt layout. Keep `windowSlice` as the primary mechanism; overflow:hidden is belt-and-suspenders, not the scroller.

- **aria + `useIsScreenReaderEnabled()`.** `Box` accepts `aria-role` (`list`/`listitem`/`tablist`/`textbox`) and `aria-state` (`{selected, expanded, busy}`). Tag the tree container `list`, each row `listitem` + `aria-state.selected`, clusters `aria-state.expanded`, the slash input `textbox`. Gate decorative ASCII (mascot/wordmark) behind `useIsScreenReaderEnabled()` so SR users get content, not box-drawing noise. Ada's users are explicitly non-technical and pay real money — "premium, legible, calm" should include them.

- **`useFocus`/`useFocusManager` — defer.** With today's one-pane-at-a-time model (welcome/tree/reader), a single mode-keyed `useInput` is simpler and bug-free (`App.ts` proves it). Adopt `useFocusManager.activeId` only when the persistent chat-input-beside-the-tree milestone lands and two interactive regions are on screen at once.

- **`useBoxMetrics(ref)` — use sparingly.** Real post-layout `{width, height, hasMeasured}` for content-driven sizing (e.g. a sidebar that fits its widest row, or reader wrap width from the real content column). Costs a layout-read per pass — measure one or two structural boxes, not every row.

- **Disambiguated keys.** Ink 7 stopped conflating `backspace`/`delete` and `escape`/meta. `App.ts:310` can bind Esc→home cleanly without swallowing Alt-combos. Adopt the kitty protocol only for held-key UX (hold-arrow-to-scroll-fast).

---

### Animation — do / don't

**DO**

- **One clock.** A single `AnimationProvider` at the App root owns the only `useAnimation({interval:80})` and exposes `{frame,time}` via context. `isActive = isTTY && !NO_COLOR && (compiling || revealing || welcomeIdle)`. Everything that pulses reads from context.
- **Compile heartbeat.** Claude-adjacent asterisk glyphs `· ✢ ✳ ✶ ✻ ✽` at ~80–100ms in `theme.plum`, paired with the *real* current pipeline-stage verb (CTX → INT → PER → ENT → PRO → SYN → VER → GOV → BLD) and a determinate bar `stage 4/9` (you know the total — use a bar, not a spinner for known progress). Anchor in the status row; emit each finished stage into `<Static>`. This is THE place Ada should feel alive: a real semantic compiler surfacing real multi-stage work both reassures (not frozen) and informs.
- **One welcome breath.** A slow ~1.4s sine on *either* the terracotta border *or* the owl mascot, quantized to 3 palette steps: `brightness=(Math.sin(time/1400*Math.PI*2)+1)/2`. Kill it (`isActive:false`) the instant `view` flips to `graph`.
- **Discrete vs continuous.** `frame % n` for indexed glyph sequences; `time`-based sine for breathing, quantized to 3–5 palette steps (not 256).
- **Slowest rate that reads as alive.** Spinners 80ms (12.5fps), breathing 100–120ms, reveal 12–25ms/char. Never 16ms/60fps — the terminal can't paint it cleanly and you gain nothing.
- **Reserve the space.** The status/activity row holds a fixed height whether or not it's animating (render a blank line when idle). A spinner appearing must never push the layout down (gemini-cli's "Layout Stabilization").
- **Reduced-motion escape hatch.** `ADA_REDUCED_MOTION` (also honor `NO_COLOR`/CI) forces `isActive:false` everywhere: spinners → static glyph, reveals → instant, bars → final. Any keypress during a reveal jumps to settled state.

**DON'T**

- Don't animate the tree connector lines as a permanent effect (a one-shot ~150ms draw-in on area-open is the absolute max, and must complete to a static tree).
- Don't animate selection beyond the existing highlight (a faint single-step pulse of the row glyph on a ≥150ms beat is the ceiling; stop it the moment the cursor moves — the move *is* the feedback).
- Don't animate the stats counts.
- Don't animate anything while the chat input has focus or the reader is scrolling — those are quiet zones; competing motion next to a cursor the user drives makes typing feel laggy.
- Don't run two breathing elements at once (border *or* mascot, never both).
- Don't spin up per-component `setInterval` — that's the #1 source of out-of-phase flicker and CPU burn.

---

### ASCII wordmark + mascot guidance

**Keep ZERO extra runtime deps.** Do **not** add `ink-big-text` (wraps `cfonts`, last published 2023, fixed glyph set A–Z/0–9 only — *cannot* render the box-drawing "context" tag or a mascot, pulls `cfonts`+`prop-types`+~15 transitives) or `ink-gradient` (compatible but its only job is ~20 lines you can own, and a gradient wordmark fights AESTH.005). Keep the hand-authored `art.ts` arrays.

**Wordmark.** Upgrade `WORDMARK` in `art.ts` to a **filled-block "ADA"** (full-block `█`, 5 rows) for wide terminals (`cols >= 72`) — the Claude Code / oh-my-logo "filled block + gradient" genre — and **keep the existing 3-row box-drawing version** for narrow terminals. Pad all rows to equal width; compute the box width from the longest art row (not a guess). Add a plain `ADA · context` single-line fallback for `!isTTY` so piped/CI output stays clean. This is a data swap + a width branch — `Welcome.ts` already does `WORDMARK.map` and clamps width.

**Gradient (dependency-free, ~15 lines).** `hexToRgb` + `lerp`, then per-row map line index `i` to `t=i/(rows-1)`, interpolate `terracotta #B8543C → plum #6E5ACF` (from `COLOUR_HEX`), and render each row as `<Text color={hex}>` (Ink accepts hex directly — `theme.ts` already relies on this). **Vertical (per-row) gradient is the default** — a tall filled block reads as one coherent object; per-character horizontal gradients look noisy on a block. Coalesce same-color runs if you ever hand-emit ANSI.

**Mascot — pick ONE, animate ONE detail.** `art.ts` already has a `MASCOTS` record + `mascot()` selector. The `owl` or a refined "node-eye" reads best at the small grid and is *groundable to Ada's function* — a context compiler's mascot as an eye/node that watches your graph, not decoration. Store `open` + `blink` frames, keep rows 1 and 3 byte-identical so only the eye row changes (Copilot CLI's "animate one detail" → stable silhouette, flicker-free). Drive the blink off the shared clock (~150ms blink, every ~4–6s), and disable when `!isTTY`/`NO_COLOR`/screen-reader. Color the mascot in plum to contrast the terracotta→plum wordmark; tint the eyes one accent (cyan) on blink-open so the single moving part also carries the only color change. Map these as named roles (`frame`/`eyes`), not inline hex, so a 256/16/mono downgrade is a one-place change.

**Launch budget.** Reveal under ~3s, non-blocking — the input must be usable immediately (Copilot CLI capped its intro at 3s/~13fps so it never delays startup). A subtle idle blink after the reveal is the "a little alive."

**Snapshot-test the art** with `ink-testing-library` (already a devDependency, test pattern exists next to `smoke.test`/`App.test`): (1) wide render shows 5-row filled ADA + mascot, all rows equal width; (2) `NO_COLOR` render contains zero ANSI escapes; (3) narrow render falls back to compact wordmark. This proves the monochrome/accessibility fallback — the part the Copilot team found was 90% of the work.

---

### Tree / graph-nav patterns

- **One focused pane, not a multi-window grid.** lazygit's 5-panel layout assumes a fixed small schema; Ada nodes carry 200+ word capsules that need full width. `App.ts` already made this call right (`view = welcome|graph`, reader is a full-screen overlay). Reserve a second column only as an *optional, width-gated* preview, never a permanent split.

- **broot-style filter-as-you-type that PRUNES the tree in place** — the single biggest upgrade available. Today `onCommand('search')` (`App.ts:194`) jumps the cursor to the first match and discards structure. Instead: any printable keystroke in tree mode enters a filter substate; rebuild `graphTree()` from only matching nodes + their ancestor area headers, auto-open those areas, pre-select the best match so `⏎` opens immediately, show the live pattern in the bottom bar, `Esc` restores fold state. **`matchNode()` already exists and is unit-tested** (`lines.ts:59`) — this is the realistic way to find one of 30+ nodes without knowing its ID, and it keeps you oriented (you see *which area* a match lives in).

- **Edges are first-class.** Ada is a graph projected as a tree: nodes cross cluster boundaries (e.g. SEO.118 parents = META.05 + SEO.124; ATT.007 parents = ATT.004 + ATT.006). Following an edge must be as cheap as opening a folder, and reversible. The reader already does this (`Tab` cycle / `⏎` follow / `⌫` back, `App.ts:237–259`) with a back-stack — the right primitive. The gap: edges are invisible in tree mode and the back-stack is reader-only. Lift the loop into the model layer so a key (e.g. `g`) opens a neighbor picker from `resolvableLinks()` (already exists, `lines.ts:68`) from the tree too, pushing onto **one shared `backStack`**.

- **Breadcrumb always visible, always truthful.** Once edges cross areas, a graph has no canonical parent path — `breadcrumb()` exists (`lines.ts:87`) but only feeds the reader. Render it in tree mode too, fed the cross-area trail.

- **Soften the cursor.** Replace full-row `inverse` (`App.ts:68`) with `❯` caret + bold label in the row's own area color + a dark desaturated area-hue background bar. Verified contrasts on `#2A2350` (plum bar): cream `#EDE7DC` = 11.7:1, ink `#9AA3AF` = 5.7:1 — both pass comfortably, and the area hue survives inside the selection. Keep `❯` as the non-color cue so selection reads under `NO_COLOR`.

- **Quiet the per-area color.** `graphTree()` currently sets `colour` on *every* row (cluster header AND each fully-tinted node line, `lines.ts:163,179`) → a many-cluster graph reads as confetti. Pull color back to the identity carriers only — the dot `●`/`◦` and the cluster header — and render connectors, ids, and labels in neutral cream/ink. One colored anchor per area; calm body.

- **Connectors + indent guides.** Keep `├─`/`└─` but add the vertical continuation guide `│` so deep areas read as one continuous tree. Stick to the light single-line set (U+2500–253C) — never mix heavy/light — for consistency across Terminal.app, iTerm2, Alacritty, VS Code. IDs are already padded to a column (`idW`), giving a poor-man's miller column.

- **Optional miller preview (width-gated, `cols >= 100`).** Right pane (~40%) previews the cursor node's capsule via truncated `readerLines()`, updating on cursor move; collapse to single-pane below threshold. yazi/ranger's signature "alive" navigation, free of the 80-col risk. Higher effort (two-column layout + second `windowSlice` region).

- **One-hop neighbor strip in the reader header** (serie/Cosmo idea): a tiny ASCII relationship strip in area colors, e.g. `◦ATT.004 ─┬─▶ ◦ATT.007(here) ◀─── ◦ATT.006`, so a node's position in the web reads before 200 words of body. Keep to immediate neighbors.

- **Jump-to-node + `?` overlay.** Type trailing ID digits (IDs are already `ATT.004`-style) or a 2-char hint to teleport the cursor — eliminates long arrow runs in a 30+ node tree. A mode-driven `?` overlay generated from a single keymap source of truth guarantees displayed keys never drift. The hint string already branches by mode (`App.ts:328,331`) — formalize it.

- **Keybinding vocabulary.** Arrows + `hjkl` move, `l`/`→`/`⏎` open, `h`/`←` close-or-parent, `/` filter, `Esc` clear/back, `q` quit, `?` help. Add `j`/`k` as arrow aliases (near-zero cost). Gate single-letter motions behind a clear "navigation has focus" state so letters never fire motions while the chat/filter line owns focus — `App.ts`'s `commandMode` short-circuit is the existing model.

---

### Palette

**Two tiers.** Separate *role* (fixed) from *category* (rotating) — this is Lip Gloss `CompleteColor` / Claude Code's ~60-token model. Today roles borrow from the area palette (slate=body text, rose=failure, cyan=link), so category and meaning share one namespace.

**Tier 1 — fixed semantic/surface tokens** (verified contrast on a `#1E1E1E` dark reference):

| token | hex | contrast | role |
|---|---|---|---|
| bg | `#1E1E1E` | — | reference dark background |
| panel | `#232323` | — | selection/panel fill base |
| text.primary | `#EDE7DC` (cream) | 13.6:1 | body text |
| text.muted | `#9AA3AF` (ink) | 6.5:1 | metadata, ids, dim lines |
| text.ghost | `~#6B7280` | — | de-emphasized |
| accent | `#B8543C` (terracotta) | — | brand, the one active thing |
| accent.2 | `#6E5ACF` (plum) | — | secondary identity (mascot, compile heartbeat) |
| status.ok | `#3E8F5A` (green) | — | checks/candidates |
| status.warn | `#D59632` (amber) | — | unknowns/residue |
| status.danger | `#B65A6B` (rose) | — | failure-if-missing |
| link | `#2F8FA3` (cyan) | — | followable edges |
| selectionBg | `#2A2350` | cream 11.7:1 / ink 5.7:1 | cursor-row bar (dark plum) |

**Tier 2 — area-hue rotation** (cluster identity only): plum, terracotta, cyan, sage, amber, green, slate, clay, deep_blue, rose. Cap simultaneously-visible at ~7; repeat rather than invent muddy hues.

**Two measured legibility bugs to fix in `grammar.ts` `COLOUR_HEX`:**
- `deep_blue #25476A` → **`#4E7FB5`** (1.74:1 → 3.99:1, AA-large). It's in the `CLUSTER_PALETTE` rotation.
- `slate #4E5968` → **`#8893A6`** (2.34:1 → 5.4:1, AA) *for text use*. `slate` paints the "⊢ compiles to" line (`readerLines.ts:233`). Keep the dark navy/slate only as a selection-bar **background** (where cream sits on top at 10–13:1), never as a foreground.

**Capability-aware output.** `grammar.ts` `paint()` unconditionally emits truecolor `\x1b[38;2;r;g;bm` — which renders wrong/washed-out on 256-color terminals and over SSH/sudo where `COLORTERM` isn't forwarded. Detect level via `supports-color`/Chalk and emit truecolor → 256 (`\x1b[38;5;N`) → 16 → plain, or route the static path through Chalk so one codepath owns degradation. The Ink path is already safe (Chalk downsamples hex). Never hardcode the 16 ANSI *indices* for fixed brand colors — users remap them (the base16/ngrok trap); use named RGB and let it downsample, reserving ANSI names only for things that *should* follow the user's theme (a generic error red).

**Three-step ladder per hue.** A `tone(colour, 'primary'|'secondary'|'ghost')` helper: normal = palette hex, secondary = Ink `dim` (or ~30% darker), primary/focused = Ink `bold` (brightens). Hierarchy then reads even in mono. `theme.ts` should grow into this lipgloss-style sheet (it currently just re-exports `COLOUR_HEX`).

**No-color contract.** `grammar.ts` checks `NO_COLOR + isTTY` (correct but incomplete). Add `TERM=dumb`, honor `FORCE_COLOR` and `--color/--no-color` (flag > config > env). Add snapshot tests rendering tree+reader at `FORCE_COLOR=3`, `FORCE_COLOR=1`, `NO_COLOR=1` so "degrades gracefully" is verified, not hoped.

---

### References table — app → what to steal

| App | What to steal for Ada |
|---|---|
| **Claude Code** (the explicit "sister") | Radical restraint: ~one animated element at a time. The thinking heartbeat (`· ✢ ✳ ✶ ✻ ✽`, ~80ms, gentle shimmer) → model for Ada's compile pulse. "One warm accent on calm neutrals" over cream-on-dark. ~60 named semantic tokens with Dark/Light/Daltonized/ANSI variants + an `ansi256FromRgb` downsampler → mirror this token structure. Colorblind-first: every color state also has a glyph. Filled-block wordmark in a tight bordered box with usable input directly below. **Match the restraint; own terracotta/plum, don't copy the hue.** |
| **lazygit** | Spatial consistency + contextual footer that shows only valid actions. Exactly-one-focused-view discipline + a mandatory `?` overlay. Number-key jump to a panel → maps to area/node jump. Flat↔tree layout toggle → an Ada "group by area ⟷ flat list" toggle. |
| **broot** | Filter-as-you-type that **prunes the live tree** (not a separate result list), best match pre-selected so `⏎` acts immediately, `Esc` clears. Highest-leverage borrow — directly replaces `App.ts`'s jump-to-first-match. Also "focus a subtree as the new root" for drilling into one dense area. |
| **k9s** | Drill-down stack with a visible breadcrumb trail; browser-like back-stack progression across linked nodes. Ada has `backStack` + `breadcrumb()` — surface the breadcrumb prominently. |
| **yazi / ranger** | Miller-columns preview-on-cursor-move (adopt width-gated, `>=100` cols). `hjkl`-as-directions (`h`=parent/close, `l`=enter/open). ranger's parent\|current\|preview as the "context left, detail right" mental model. |
| **btop** | Density-as-craft via fixed regions + fractional/braille glyphs (`▏▎▍`) for smooth visuals in tight space — use for any coverage/count bars instead of ASCII bars. Sub-cell precision, not more color. |
| **serie / Cosmo** | Graph drawn with Unicode connectors + color reads well in a terminal → a small one-hop neighbor strip in Ada's reader header so a node's position in the web is visible before its body. |
| **Charm (lipgloss/gum/glow)** | `CompleteColor` (exact value per truecolor/256/16 profile) + `AdaptiveColor` + the framework (not call sites) owning the fallback ladder. Rounded border used **once** as a rare signature. `theme.ts` should become this semantic sheet. |
| **chalk / supports-color** | The level model (0 none / 1 = 16 / 2 = 256 / 3 = truecolor) and detection that already reads `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`, `TERM=dumb`, TTY. Don't reimplement — branch on `chalk.level` instead of emitting raw 24-bit escapes. |
| **gh CLI** | Output invariance: identical in light/dark, legible with `NO_COLOR`, glyphs carry meaning. Adopt as Ada's acceptance bar — premium only if still parseable with color off. |
| **GitHub Copilot CLI** | The engineering discipline: hard ~3s intro cap so it never blocks startup; role→color mapping (eyes/goggles/border → named colors) not hardcoded RGB; mascot personality from blinking eyes (animate one detail, stable silhouette); banner skipped entirely in screen-reader mode; segment-grouping same-color cells. |
| **oh-my-logo** | Vertical gradient as the **default** for filled ASCII (reads as one object); 80-col/60-col wordmark variants; named multi-stop palettes (build Ada equivalents from `COLOUR_HEX`). Confirms the canonical stack is figlet + gradient-string → decide to reimplement the ~15–20 line gradient instead of taking the dep. |
| **gemini-cli** | "Layout Stabilization": reserve vertical space for the status/footer so the frame never jitters when a spinner/toast appears or while typing. One unified fixed-height live region folding notifications + thinking into one row; a `loadingPhrases`-style toggle to turn motion/phrases off. |
| **cfonts** (cautionary) | Its fixed glyph set is exactly why hand-authored `string[]` art wins for Ada — you need the box-drawing "context" tag, custom kerning, and a mascot, none of which figlet-class engines produce. |

---

### What NOT to add
- `ink-spinner` — `useAnimation`'s single shared timer makes an in-house spinner trivial.
- `ink-big-text` — `cfonts`-based, fixed glyph set, can't render the tag or mascot, heavy transitive tree.
- `ink-gradient` — compatible, but its one job is ~20 lines you can own; a gradient wordmark also fights AESTH.005.
- `ink-text-input` — the ~20-line inverse-char cursor trick replaces it with zero deps.
- A permanent miller split below 100 cols — starves both tree labels and 200-word capsules on 80-col.
