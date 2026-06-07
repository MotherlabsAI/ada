#!/usr/bin/env node
/**
 * compile.mjs — the reproducible compiler for the `ada-tui-design` pack.
 *
 * This is provenance, not magic: the design problem space for Ada's own terminal
 * surface is authored ONCE as a typed node/edge/token graph below, then projected
 * deterministically into every artifact (YAML, JSON, JSON-LD, per-node capsules,
 * wiki, manifest, token sheets). Re-running it reproduces the pack byte-for-byte.
 *
 * AXIOM A5: the world model is filesystem-backed and inspectable.
 * AXIOM A2: every node carries a truth class (∵ source / ∴ inferred / Ω residue)
 *           and a provenance pointer (`from`) back to code or the research dossier.
 * AXIOM A1: graph + wiki are EXPLORATORY; only c/ is deterministic.
 *
 *   run:  node .ada/packs/ada-tui-design/compile.mjs
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SLUG = "ada-tui-design";

// ─────────────────────────────────────────────────────────────────────────────
// SOURCES (provenance anchors — every node `from` points at one of these)
// ─────────────────────────────────────────────────────────────────────────────
const SRC = {
  SEED: "SEED (root intent)",
  SURFACE: "docs/SURFACE-DESIGN.md",
  TOKENS: "src/tui/ink/tokens.ts",
  ART: "src/tui/ink/art.ts",
  WELCOME: "src/tui/ink/Welcome.ts",
  STATUS: "src/tui/ink/StatusBar.ts",
  GRAMMAR: "src/core/grammar.ts",
  CLI: "src/cli.ts",
  AXIOMS: "AXIOMS.md",
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — the two-tier system, lifted from src/tui/ink/tokens.ts (∵).
// tier 1 = role/chrome (60/30/10), tier 2 = pigment/meaning category palette.
// `onBg` is the measured WCAG contrast ratio vs bg #1B1410 (computed at emit).
// ─────────────────────────────────────────────────────────────────────────────
const BG = "#1B1410";

const roleTokens = [
  ["bg",           "#1B1410", "base",      "60% — the calm warm-dark field the eye rests on"],
  ["surface",      "#251D16", "base",      "60% — raised field for panels/cards"],
  ["surfaceAlt",   "#2F2419", "base",      "60% — secondary raised field"],
  ["text",         "#ECDDC9", "structure", "30% — primary body text"],
  ["textDim",      "#B49B80", "structure", "30% — secondary text"],
  ["textMuted",    "#7A6650", "structure", "30% — metadata, ids, dim lines"],
  ["border",       "#4A3A2C", "structure", "30% — hairlines, the one rounded frame"],
  ["accent",       "#D59632", "accent",    "10% — amber: the one thing that pops"],
  ["accentBright", "#E8A94A", "accent",    "10% — amber hover/move flash"],
  ["focus",        "#C66A43", "accent",    "10% — clay: the focused/cursor mark"],
  ["selection",    "#3A281C", "accent",    "10% — selected-row background tint"],
  ["success",      "#3E8F5A", "status",    "checks pass / candidates (κ)"],
  ["warning",      "#D59632", "status",    "unknowns / residue (Ω)"],
  ["error",        "#B65A6B", "status",    "failure-if-missing"],
];

// pigment / meaning palette (category identity) — from grammar.ts COLOUR_HEX (∵)
const pigmentTokens = [
  ["terracotta", "#B8543C", "brand identity / active area"],
  ["plum",       "#6E5ACF", "secondary identity (mascot, compile heartbeat)"],
  ["clay",       "#C66A43", "warm area hue"],
  ["amber",      "#D59632", "warm area hue / warning"],
  ["sage",       "#7E9C76", "cool-neutral area hue"],
  ["green",      "#3E8F5A", "check ok"],
  ["cyan",       "#2F8FA3", "followable edge / link"],
  ["slate",      "#8893A6", "compiles-to / structural (AA-fixed)"],
  ["deep_blue",  "#4E7FB5", "area hue (AA-large fixed)"],
  ["rose",       "#B65A6B", "failure"],
];

// truth glyphs as language (∵ grammar.ts TRUTH_GLYPH)
const GLYPHS = {
  source: "∵", inferred: "∴", residue: "Ω", check: "κ", node: "◇", dot: "●",
};

// ─────────────────────────────────────────────────────────────────────────────
// CLUSTERS
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTERS = {
  ROOT:    { colour: "terracotta", title: "Design world model & north-star" },
  IDENT:   { colour: "plum",       title: "Visual identity — wordmark, mascot, gradient" },
  PALETTE: { colour: "amber",      title: "Colour system — tokens, contrast, degradation" },
  LAYOUT:  { colour: "clay",       title: "Spatial structure — skeleton, whitespace, focus" },
  MOTION:  { colour: "plum",       title: "Calm motion — one clock, heartbeat, restraint" },
  NAV:     { colour: "cyan",       title: "Navigation — prune-filter, edges, keymap" },
  FLOW:    { colour: "terracotta", title: "Journeys — welcome, compile, open, reader" },
  STATE:   { colour: "sage",       title: "States & edge cases — empty, error, resize, non-TTY" },
  A11Y:    { colour: "green",      title: "Accessibility — colour-free legibility, SR, keyboard" },
  VOICE:   { colour: "amber",      title: "Voice & microcopy — calm, premium, honest" },
  UNK:     { colour: "slate",      title: "Unknown-unknowns — open design residue (Ω)" },
};

// ─────────────────────────────────────────────────────────────────────────────
// NODES — the recursively-explored design problem space.
// Each: id, label, truth(source|inference|residue), depth(L1..L5),
//   check(C0..C5), from(SRC.*), summary, why, fail,
//   parents[], dependsOn[], siblings[], guardedBy[]
// ─────────────────────────────────────────────────────────────────────────────
const N = [];
const node = (o) => { N.push(o); return o.id; };

// ── ROOT ──────────────────────────────────────────────────────────────────
node({ id:"ROOT.000", cluster:"ROOT", label:"Ada Surface Design World Model", truth:"inference", depth:"L5", check:"C0", from:SRC.SEED,
  summary:"The bounded design context for Ada's own terminal surface — not everything about TUIs, only what an executor needs to build/refactor THIS shell: identity, palette, layout, motion, nav, flow, state, a11y, voice, and honest residue.",
  why:"The map the surface is built inside. Without it, the TUI is restyled from taste-of-the-day instead of a governed model.",
  fail:"Each screen gets designed in isolation; the shell drifts into confetti and inconsistency.",
  parents:[], dependsOn:[], siblings:[], guardedBy:[] });

node({ id:"ROOT.001", cluster:"ROOT", label:"North-star: Claude Code's calm, premium sister", truth:"source", depth:"L4", check:"C1", from:SRC.SURFACE,
  summary:"The brief in one line: one accent on calm earth neutrals, one focal point per screen, one moving thing at a time, a frame that never jumps. Terracotta/plum is OURS — match Claude Code's restraint, never copy its hue.",
  why:"It is the single tie-breaker for every later decision; when two designs are both 'fine', the calmer one wins.",
  fail:"The surface reads as a LangChain-clone dashboard — busy, cool-toned, generic — and the premium promise breaks on first contact.",
  parents:["ROOT.000"], dependsOn:[], siblings:["ROOT.002"], guardedBy:[] });

node({ id:"ROOT.002", cluster:"ROOT", label:"The paying non-technical user is the design constraint", truth:"source", depth:"L4", check:"C1", from:SRC.AXIOMS,
  summary:"Ada's users are explicitly non-technical and pay real money (Motherlabs vision; A8). 'Premium, legible, calm' is therefore not decoration — it must hold under NO_COLOR, a screen reader, and an 80×24 terminal, or it isn't premium for everyone who paid.",
  why:"It promotes accessibility and degradation from 'nice-to-have' to a load-bearing product requirement.",
  fail:"The surface is beautiful only on the designer's 120-col truecolor iTerm; everyone else gets a broken first impression.",
  parents:["ROOT.000"], dependsOn:[], siblings:["ROOT.001"], guardedBy:[] });

// ── IDENT ─────────────────────────────────────────────────────────────────
node({ id:"IDENT.010", cluster:"IDENT", label:"The ADA wordmark — filled block, with fallbacks", truth:"source", depth:"L3", check:"C3", from:SRC.ART,
  summary:"A 6-row filled-block ADA (art.ts WORDMARK) for wide terminals; a 3-row compact WORDMARK_NARROW under ~90 cols; a plain `ADA · context` line for non-TTY/piped output. Box width is computed from the longest art row, never guessed.",
  why:"The wordmark is the first frame the user sees; it must land identically across terminal widths and degrade to clean text in CI.",
  fail:"The banner clips, mis-wraps, or spews box-drawing noise into a pipe — the first impression is broken before the product speaks.",
  parents:["ROOT.001"], dependsOn:[], siblings:["IDENT.011","IDENT.012","IDENT.013"], guardedBy:[] });

node({ id:"IDENT.011", cluster:"IDENT", label:"The eye/node mascot — animate ONE detail", truth:"source", depth:"L3", check:"C3", from:SRC.ART,
  summary:"The default mascot is an eye (art.ts DEFAULT_MASCOT='eye') — groundable to Ada's function: a context compiler that watches your graph, not arbitrary decoration. Rows 1 and 3 are byte-identical to the blink frame; only the eye row changes (◉→═), so the silhouette is stable and flicker-free.",
  why:"Personality from a single moving detail is the cheapest, calmest way to feel 'a little alive' without violating the one-moving-thing rule.",
  fail:"A fully animated mascot competes with the cursor and the compile heartbeat — three moving things, the opposite of calm.",
  parents:["ROOT.001"], dependsOn:["MOTION.040"], siblings:["IDENT.010"], guardedBy:[] });

node({ id:"IDENT.012", cluster:"IDENT", label:"Vertical terracotta→plum gradient as one object", truth:"source", depth:"L3", check:"C2", from:SRC.ART,
  summary:"The wordmark is ramped top→bottom terracotta→clay→amber (art.ts bannerGradient, ~250ms/step triangle wave) — vertical/per-row, so the tall block reads as one coherent object. Dependency-free (~15 lines hexToRgb+lerp); no ink-gradient.",
  why:"A per-row ramp keeps the block legible as a single mark; per-character horizontal gradients look noisy and fight AESTH.005.",
  fail:"A rainbow per-letter wordmark turns the signature mark into confetti and adds a dependency for 20 lines of owned code.",
  parents:["IDENT.010"], dependsOn:["PALETTE.021"], siblings:["IDENT.011"], guardedBy:[] });

node({ id:"IDENT.013", cluster:"IDENT", label:"The `context` tag as identity anchor", truth:"source", depth:"L2", check:"C3", from:SRC.WELCOME,
  summary:"`c o n t e x t` under the wordmark plus the subtitle 'a semantic compiler for context' (Welcome.ts) state the category in three words. It is the verbal half of the identity: the mark says ADA, the tag says what ADA is.",
  why:"A non-technical user needs the category named, not inferred; the tag does that without a sentence of marketing.",
  fail:"The user stares at a pretty ADA block with no idea what it compiles or why they should trust it.",
  parents:["IDENT.010"], dependsOn:[], siblings:["VOICE.090"], guardedBy:[] });

// ── PALETTE ─────────────────────────────────────────────────────────────────
node({ id:"PALETTE.020", cluster:"PALETTE", label:"Two tiers: role tokens (chrome) vs pigment (meaning)", truth:"source", depth:"L4", check:"C3", from:SRC.TOKENS,
  summary:"tokens.ts splits the namespace: role tokens (bg/text/accent/focus…) skin the CHROME and can re-theme the whole shell from one file; the pigment palette in grammar.ts COLOUR_HEX carries MEANING (truth class, cluster identity, check class). Category and meaning never share a token.",
  why:"Keeping the two channels separate is what stops a 10-colour graph reading as confetti and lets the shell be re-skinned without touching meaning-colour.",
  fail:"Roles borrow from the area palette (today slate=body, rose=failure, cyan=link) so restyling the chrome silently changes what colours MEAN.",
  parents:["ROOT.000"], dependsOn:[], siblings:["PALETTE.021"], guardedBy:[] });

node({ id:"PALETTE.021", cluster:"PALETTE", label:"60/30/10 earth discipline", truth:"source", depth:"L3", check:"C2", from:SRC.TOKENS,
  summary:"60% warm-dark base the eye rests on (bg/surface), 30% mid-earth structure & text, 10% accent that is the ONLY thing that pops or moves (accent/focus/selection). Every role is warm (terracotta family); cool pigments stay for meaning, never chrome.",
  why:"A fixed ratio is what makes restraint reproducible instead of a vibe — it tells you when you've spent your accent budget.",
  fail:"Accent leaks past 10% and the 'one warm pop' becomes wallpaper; nothing draws the eye because everything does.",
  parents:["PALETTE.020"], dependsOn:[], siblings:["PALETTE.024"], guardedBy:[] });

node({ id:"PALETTE.022", cluster:"PALETTE", label:"Contrast is law — AA on every text role", truth:"inference", depth:"L3", check:"C5", from:SRC.SURFACE,
  summary:"Every token used for TEXT must meet WCAG AA on bg #1B1410 (≥4.5:1 body, ≥3:1 large). This is pure math on the hex pair — checkable, no taste. The research already flags real failures (textMuted, slate-as-text, deep_blue).",
  why:"Legibility is the floor of 'premium'; a beautiful unreadable label is a defect, and contrast is the one design property that is fully deterministic.",
  fail:"textMuted #7A6650 (~3.4:1) ships as body text on bg and low-vision users — who paid — cannot read the metadata.",
  parents:["PALETTE.020"], dependsOn:[], siblings:["A11Y.081"], guardedBy:["contrast_aa"] });

node({ id:"PALETTE.023", cluster:"PALETTE", label:"Capability-aware degradation ladder", truth:"inference", depth:"L3", check:"C4", from:SRC.GRAMMAR,
  summary:"One codepath owns the fallback truecolor → 256 → 16 → mono. Detect level (supports-color/chalk.level), never hardcode the 16 ANSI indices for brand colours (the base16 remap trap) — use named RGB and let it downsample. tokens.ts already documents a 16-colour fallback per role.",
  why:"grammar.ts paint() emits raw 24-bit escapes unconditionally, which wash out over SSH/sudo/256-colour; the ladder makes earthy-and-legible survive every terminal.",
  fail:"Brand colours render wrong or invisible on a 256-colour terminal; the user blames Ada for a 'broken' screen.",
  parents:["PALETTE.020"], dependsOn:[], siblings:["A11Y.081"], guardedBy:["no_color_no_ansi"] });

node({ id:"PALETTE.024", cluster:"PALETTE", label:"Category hues capped at ~7 — repeat, don't invent", truth:"inference", depth:"L2", check:"C2", from:SRC.SURFACE,
  summary:"Cluster identity rotates through a fixed pigment set (plum, terracotta, cyan, sage, amber, green, slate, clay, deep_blue, rose); cap simultaneously-visible at ~7 and REPEAT a hue rather than invent a muddy in-between. Hue answers 'what area'; luminance (dim/normal/bold) answers 'how important'.",
  why:"Humans rank light/dark reliably but not colours; separating the two channels is what stops a many-cluster graph reading as confetti and degrades cleanly to mono.",
  fail:"Each new area mints a new near-duplicate hue; at 10 clusters the tree is indistinguishable noise.",
  parents:["PALETTE.021"], dependsOn:[], siblings:["LAYOUT.034"], guardedBy:[] });

// ── LAYOUT ────────────────────────────────────────────────────────────────
node({ id:"LAYOUT.030", cluster:"LAYOUT", label:"Fixed skeleton: status / body / footer", truth:"source", depth:"L3", check:"C3", from:SRC.SURFACE,
  summary:"Status line top, body middle (flexGrow:1), hint/command bar pinned bottom — fixed forever. App.ts already nails this; protect it so the bottom bar truly pins and the body owns all slack.",
  why:"Spatial constancy is the cheapest trust signal in a TUI: the user always knows where identity, content, and actions live.",
  fail:"Panes drift between screens; the footer floats mid-body; the user re-reads the layout every transition.",
  parents:["ROOT.000"], dependsOn:[], siblings:["LAYOUT.031"], guardedBy:[] });

node({ id:"LAYOUT.031", cluster:"LAYOUT", label:"Panes never move on their own", truth:"inference", depth:"L3", check:"C2", from:SRC.SURFACE,
  summary:"The reader and the tree render into the IDENTICAL bodyHeight box (rows−4). Opening/closing a node deepens the same surface instead of repainting a new screen; transitions feel like focus changes, not page loads.",
  why:"A surface that stays put under interaction feels solid and premium; one that repaints feels like a web page in a terminal.",
  fail:"Following an edge swaps the whole screen; the user loses their place and their sense of where they are.",
  parents:["LAYOUT.030"], dependsOn:["STATE.073"], siblings:["NAV.052"], guardedBy:[] });

node({ id:"LAYOUT.032", cluster:"LAYOUT", label:"Whitespace is structural, not decorative", truth:"source", depth:"L2", check:"C2", from:SRC.WELCOME,
  summary:"One blank line between logical blocks, 1–2 cells padding inside any framed box, a fixed spacing rhythm held everywhere (Welcome.ts paddingX:2 / explicit gap rows). Never 0-padding (cramped), never random 1-vs-2 newline mixing.",
  why:"Density is the absence of decorative noise, not the absence of space; rhythm is what makes a dense screen still feel calm.",
  fail:"Inconsistent gaps make the screen feel hand-assembled and cheap, even with a perfect palette.",
  parents:["LAYOUT.030"], dependsOn:[], siblings:["LAYOUT.033"], guardedBy:[] });

node({ id:"LAYOUT.033", cluster:"LAYOUT", label:"Frame sparingly — one border is the signature", truth:"inference", depth:"L2", check:"C2", from:SRC.SURFACE,
  summary:"One rounded border (the Welcome box / `?` overlay) is a signature; bordering every pane is noise. Inside the workbench, separate regions with the StatusBar title and a dim hint line — no nested boxes, no second border style.",
  why:"Borders are expensive attention; spending them once makes that one frame meaningful.",
  fail:"Every pane gets a box; the screen becomes a grid of cells and the signature frame loses all weight.",
  parents:["LAYOUT.030"], dependsOn:[], siblings:["LAYOUT.032"], guardedBy:[] });

node({ id:"LAYOUT.034", cluster:"LAYOUT", label:"One focal point — the cursor is the only thing fully lit", truth:"inference", depth:"L3", check:"C2", from:SRC.SURFACE,
  summary:"One high-contrast focal point per screen. Replace the full-width inverse bar (which strobes on scroll and erases the row's area hue) with a ❯ caret + bold label + a dark desaturated area-hue background bar, so selection is unmistakable AND the area colour survives on the selected row.",
  why:"A single lit focus is how the eye is led; throwing the whole row to inverse destroys the one colour you most want to read.",
  fail:"During scroll the inverse bar strobes and the selected node loses its identity colour exactly when you're trying to identify it.",
  parents:["ROOT.001"], dependsOn:["PALETTE.024"], siblings:["NAV.053"], guardedBy:["color_has_glyph"] });

// ── MOTION ────────────────────────────────────────────────────────────────
node({ id:"MOTION.040", cluster:"MOTION", label:"One clock — a single shared animation timer", truth:"inference", depth:"L3", check:"C3", from:SRC.SURFACE,
  summary:"A single AnimationProvider at the App root owns the only timer and exposes {frame,time} via context; a spinner + a pulse + a reveal cost one timer, not three. isActive = isTTY && !NO_COLOR && (compiling||revealing||welcomeIdle); an idle Ada renders at 0fps.",
  why:"Per-component setInterval is the #1 source of out-of-phase flicker and CPU burn; one clock is what makes motion phase-coherent and free when idle.",
  fail:"Three timers drift out of phase, the banner and spinner stutter against each other, and a 'calm' surface jitters.",
  parents:["ROOT.001"], dependsOn:[], siblings:["MOTION.041","MOTION.042"], guardedBy:[] });

node({ id:"MOTION.041", cluster:"MOTION", label:"Compile heartbeat — the 9 stages made visible", truth:"inference", depth:"L4", check:"C2", from:SRC.SURFACE,
  summary:"THE place Ada should feel alive: a heartbeat (· ✢ ✳ ✶ ✻ ✽, ~80–100ms, plum) paired with the REAL current pipeline stage (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) and a determinate bar `stage 4/9` — a bar, not a spinner, because the total is known. Each finished stage emits into <Static>.",
  why:"A real semantic compiler surfacing real multi-stage work both reassures (not frozen) and informs (where am I); it is the product's signature trust moment.",
  fail:"A generic spinner hides the work; the user can't tell a 9-stage compile from a hang and loses trust at the exact moment it's earned.",
  parents:["MOTION.040"], dependsOn:["FLOW.061"], siblings:["MOTION.042"], guardedBy:[] });

node({ id:"MOTION.042", cluster:"MOTION", label:"One welcome breath — border OR mascot, never both", truth:"source", depth:"L2", check:"C2", from:SRC.WELCOME,
  summary:"A slow breath on EITHER the banner gradient OR the mascot eye-blink — never two breathing elements at once. Welcome.ts runs the gradient ramp (~250ms) + a single eye blink (open ~3.8s/shut ~140ms); kill all of it the instant view flips to graph.",
  why:"Two competing breaths read as nervousness; one slow breath reads as calm presence.",
  fail:"Border and mascot pulse simultaneously and the home screen feels anxious instead of inviting.",
  parents:["MOTION.040"], dependsOn:[], siblings:["MOTION.043"], guardedBy:[] });

node({ id:"MOTION.043", cluster:"MOTION", label:"Reduced motion + reserve the space", truth:"inference", depth:"L3", check:"C4", from:SRC.SURFACE,
  summary:"ADA_REDUCED_MOTION (and NO_COLOR/CI) forces isActive:false everywhere: spinners→static glyph, reveals→instant, bars→final; any keypress during a reveal jumps to settled state. The status/activity row holds a FIXED height whether or not it's animating, so a spinner appearing never pushes layout down.",
  why:"Motion is an accessibility hazard for some users and a layout-jitter hazard for everyone; both escape hatches are non-negotiable for 'premium'.",
  fail:"A spinner appears, the layout jumps a row, and motion-sensitive users get no way to turn it off.",
  parents:["MOTION.040"], dependsOn:["A11Y.081"], siblings:["MOTION.044"], guardedBy:[] });

node({ id:"MOTION.044", cluster:"MOTION", label:"What NEVER animates", truth:"inference", depth:"L2", check:"C2", from:SRC.SURFACE,
  summary:"Don't animate: idle chrome, the stats counts, tree connector lines as a permanent effect (one-shot ~150ms draw-in max), selection beyond the existing highlight, or anything while the input has focus or the reader is scrolling. The cursor MOVE is the feedback — don't decorate it.",
  why:"Motion means 'real work, focus, or a just-happened transition'; animating anything else spends the user's attention on nothing.",
  fail:"Twitching counts and pulsing idle borders train the user to ignore motion — so they miss it when it finally means something.",
  parents:["MOTION.040"], dependsOn:[], siblings:["MOTION.043"], guardedBy:[] });

// ── NAV ─────────────────────────────────────────────────────────────────────
node({ id:"NAV.050", cluster:"NAV", label:"Filter-as-you-type that PRUNES the tree", truth:"inference", depth:"L4", check:"C2", from:SRC.SURFACE,
  summary:"The single biggest upgrade: any printable key in tree mode enters a filter substate that rebuilds the tree from only matching nodes + their ancestor area headers, auto-opens those areas, pre-selects the best match so ⏎ opens immediately, shows the live pattern in the bottom bar, and Esc restores fold state. matchNode() already exists and is unit-tested.",
  why:"It is the realistic way to find one of 30+ nodes without knowing its id, and pruning (vs jump-to-first-match) keeps you oriented — you see WHICH area a match lives in.",
  fail:"Today's onCommand('search') jumps the cursor and discards structure; the user finds a match but loses the map.",
  parents:["ROOT.000"], dependsOn:[], siblings:["NAV.051","NAV.052"], guardedBy:[] });

node({ id:"NAV.051", cluster:"NAV", label:"Breadcrumb always visible, always truthful", truth:"inference", depth:"L2", check:"C3", from:SRC.SURFACE,
  summary:"Once edges cross areas a graph has no canonical parent path; breadcrumb() exists but only feeds the reader. Render the cross-area trail in tree mode too, fed the actual path the user walked, not a fabricated hierarchy.",
  why:"In a graph-projected-as-tree the breadcrumb is the only honest 'where am I'; a fabricated parent path is a small lie (A4).",
  fail:"The user follows three edges across areas and the breadcrumb still shows the original folder path — orientation is lost.",
  parents:["NAV.050"], dependsOn:[], siblings:["NAV.052"], guardedBy:[] });

node({ id:"NAV.052", cluster:"NAV", label:"Edges are first-class — one shared back-stack", truth:"inference", depth:"L3", check:"C3", from:SRC.SURFACE,
  summary:"Ada is a graph projected as a tree; nodes cross cluster boundaries. Following an edge must be as cheap as opening a folder and reversible. The reader's Tab-cycle / ⏎-follow / ⌫-back loop is the right primitive — lift it into the model layer so a key opens a neighbour picker from resolvableLinks() in the TREE too, pushing onto ONE shared backStack.",
  why:"Edges are the actual structure; if they're only navigable in the reader, the tree hides the graph's whole point.",
  fail:"Edges are invisible in tree mode and the back-stack is reader-only; the user can't traverse the web they were promised.",
  parents:["NAV.050"], dependsOn:["LAYOUT.031"], siblings:["NAV.051"], guardedBy:[] });

node({ id:"NAV.053", cluster:"NAV", label:"Keymap vocabulary + jump-to-node + `?` overlay", truth:"inference", depth:"L3", check:"C3", from:SRC.SURFACE,
  summary:"Arrows+hjkl move, l/→/⏎ open, h/← close-or-parent, / filter, Esc clear/back, q quit, ? help. Type trailing id digits or a 2-char hint to teleport in a 30+ node tree. The `?` overlay is GENERATED from a single keymap source of truth so displayed keys can never drift from real bindings. Footer shows only currently-valid keys.",
  why:"A single source of truth for keys makes the help overlay provably honest and the footer contextual instead of a dense fixed line.",
  fail:"The footer lists keys that don't work in this mode, or the `?` overlay drifts from the real bindings — every shown key is now suspect.",
  parents:["NAV.050"], dependsOn:["A11Y.083"], siblings:["LAYOUT.034"], guardedBy:[] });

// ── FLOW ─────────────────────────────────────────────────────────────────────
node({ id:"FLOW.060", cluster:"FLOW", label:"Welcome home — recognition over recall", truth:"source", depth:"L4", check:"C2", from:SRC.WELCOME,
  summary:"The home screen SHOWS the actions (Compile / Open / Interview / Browse / Settings) with an arrow-nav menu, a sidebar that narrates the focused item, and a 'your projects' panel of packs on disk with node/κ/Ω counts — not a memorized command list. Key hints are the 3–5 keys that matter right now.",
  why:"Recognition-over-recall is what makes a TUI usable by a non-technical user on first run; they pick from what they see, not what they remember.",
  fail:"A blank prompt expecting a command the user has never been taught — the non-technical user bounces immediately.",
  parents:["ROOT.002"], dependsOn:[], siblings:["FLOW.061","FLOW.062"], guardedBy:[] });

node({ id:"FLOW.061", cluster:"FLOW", label:"Compile journey — a sentence becomes a pack", truth:"inference", depth:"L4", check:"C1", from:SRC.SURFACE,
  summary:"The core trust moment: one sentence of intent → the 9-stage heartbeat (visible, determinate) → a finished pack the user can open. Input is usable immediately (no blocking intro >3s); completed stages scroll into <Static>; the end state hands off to the graph, not a dead 'done'.",
  why:"This is A8 made tangible — the one journey that must feel like a real compiler doing real work, because it's where the product earns its price.",
  fail:"The compile feels like a black-box spinner; the user can't distinguish progress from a hang and never trusts the output.",
  parents:["FLOW.060"], dependsOn:["MOTION.041","STATE.071"], siblings:["FLOW.062"], guardedBy:[] });

node({ id:"FLOW.062", cluster:"FLOW", label:"Open / Browse / Resume — pick up where you left off", truth:"source", depth:"L2", check:"C3", from:SRC.WELCOME,
  summary:"Open targets the most-recent pack by default; Browse/Resume jumps back into it and restores position. The sidebar lists recent packs with the active one marked. The default action is always the thing the user most likely wants next.",
  why:"Returning users should re-enter their work in one keystroke; a compiler people pay for is a tool they come back to.",
  fail:"Every return starts from a cold menu with no memory of the last session; the tool feels stateless and disposable.",
  parents:["FLOW.060"], dependsOn:[], siblings:["FLOW.063"], guardedBy:[] });

node({ id:"FLOW.063", cluster:"FLOW", label:"Reader — full-width capsule + neighbour strip", truth:"inference", depth:"L3", check:"C2", from:SRC.SURFACE,
  summary:"Nodes carry 200+ word capsules that need full width, so the reader is a full-screen overlay (not a cramped split). A tiny one-hop neighbour strip in area colours sits in the header (◦ATT.004 ─┬─▶ ◦ATT.007(here) ◀─── ◦ATT.006) so a node's position in the web reads BEFORE its body.",
  why:"Position-before-prose lets the user orient in the graph before committing to 200 words; the strip is the cheapest map of local structure.",
  fail:"The capsule opens with no sense of where it sits; the reader becomes a wall of text disconnected from the graph.",
  parents:["FLOW.060"], dependsOn:["NAV.052"], siblings:["FLOW.062"], guardedBy:[] });

// ── STATE ─────────────────────────────────────────────────────────────────
node({ id:"STATE.070", cluster:"STATE", label:"Empty state — no packs yet", truth:"source", depth:"L2", check:"C3", from:SRC.WELCOME,
  summary:"With zero packs the projects panel reads 'no packs yet — Compile an idea' and the default action is Compile. The empty state TEACHES the next step instead of showing a void.",
  why:"The first-ever run is the highest-stakes empty state; it must point at the one action that creates value.",
  fail:"A new user sees an empty panel and a blinking cursor with no idea that 'Compile an idea' is the way in.",
  parents:["FLOW.060"], dependsOn:[], siblings:["STATE.071"], guardedBy:[] });

node({ id:"STATE.071", cluster:"STATE", label:"Compiling / in-flight — never looks frozen", truth:"inference", depth:"L3", check:"C2", from:SRC.SURFACE,
  summary:"While the single compile-time model call (A9) is in flight, the heartbeat + stage label + determinate bar prove liveness; the activity row is fixed-height so nothing jumps; ctrl-c is honoured. The one slow network call in the whole app is the one that most needs to feel alive.",
  why:"The compile is the only long wait in Ada; visible liveness there is the difference between 'working' and 'hung'.",
  fail:"A frozen-looking screen during a 20s compile reads as a crash; the user kills it mid-pack.",
  parents:["FLOW.061"], dependsOn:["MOTION.041"], siblings:["STATE.072"], guardedBy:[] });

node({ id:"STATE.072", cluster:"STATE", label:"Error state — honest and recoverable", truth:"inference", depth:"L3", check:"C2", from:SRC.CLI,
  summary:"When a compile fails (e.g. model returns prose around the JSON — the tolerant-extraction path), the surface says what failed in plain language, preserves any partial work, and offers the next step (retry / open partial / report). A hole is better than a lie (A4): never fake a finished pack.",
  why:"How software behaves when it breaks is most of how trustworthy it feels; honesty under failure is the premium signal.",
  fail:"A raw stack trace or a silently empty pack; the non-technical user is stranded with no recoverable next step.",
  parents:["FLOW.061"], dependsOn:[], siblings:["STATE.071"], guardedBy:[] });

node({ id:"STATE.073", cluster:"STATE", label:"Resize / SIGWINCH — dimensions stay live", truth:"inference", depth:"L2", check:"C4", from:SRC.SURFACE,
  summary:"Use Ink's useWindowSize() (re-renders on SIGWINCH) instead of reading stdout.rows once. Today dims are read once and never update, so resizing leaves bodyHeight/banner-width/reader-wrap stale until some unrelated state change repaints. A ~3-line fix that satisfies 'responsive to terminal size'.",
  why:"A surface that breaks on resize feels fragile; live dimensions are table stakes for 'works in any terminal'.",
  fail:"The user resizes their terminal and the layout is wrong until they press a key — a visible, latent bug.",
  parents:["LAYOUT.030"], dependsOn:[], siblings:["STATE.074"], guardedBy:[] });

node({ id:"STATE.074", cluster:"STATE", label:"Non-TTY / CI / piped — clean fallback", truth:"source", depth:"L2", check:"C4", from:SRC.CLI,
  summary:"canRunInk gates the interactive shell; non-TTY/CI/piped output degrades to plain lines (no box-drawing, no ANSI, no animation). alternateScreen is auto-ignored when non-interactive. The wordmark falls back to `ADA · context`.",
  why:"Ada is a CLI that must compose in pipes and CI; a TUI that corrupts piped output isn't a good Unix citizen.",
  fail:"Piping `ada` into a file captures escape soup and box-drawing characters instead of readable text.",
  parents:["LAYOUT.030"], dependsOn:["A11Y.081"], siblings:["STATE.073"], guardedBy:["no_color_no_ansi"] });

// ── A11Y ────────────────────────────────────────────────────────────────────
node({ id:"A11Y.080", cluster:"A11Y", label:"Colour redundant, never load-bearing", truth:"source", depth:"L4", check:"C4", from:SRC.GRAMMAR,
  summary:"Every state shown in colour is ALSO shown by a glyph/label, and the app stays fully usable with colour stripped. Ada is close: ❯ cursor, ✗ rejected, ⊙ flagged, ∵/∴/Ω truth glyphs, ◈/◦ symbols. Make 'every coloured state also has a glyph' a DOCUMENTED, checkable invariant so it can't regress.",
  why:"It's the foundation of both colourblind access and NO_COLOR legibility — and the AESTH.005 rule (colour carries meaning, not decoration) taken to its logical floor.",
  fail:"A status communicated by colour alone vanishes for ~8% of men and 100% of NO_COLOR users; meaning is silently lost.",
  parents:["ROOT.002"], dependsOn:[], siblings:["A11Y.081","A11Y.082"], guardedBy:["color_has_glyph"] });

node({ id:"A11Y.081", cluster:"A11Y", label:"NO_COLOR / TERM=dumb / FORCE_COLOR contract", truth:"inference", depth:"L3", check:"C4", from:SRC.GRAMMAR,
  summary:"Honour NO_COLOR (presence only), TERM=dumb, non-TTY; let FORCE_COLOR and --color/--no-color override with precedence flag > config > env. grammar.ts checks NO_COLOR+isTTY (correct but incomplete) — add the rest and snapshot-test tree+reader at FORCE_COLOR=3/1 and NO_COLOR=1 so 'degrades gracefully' is verified, not hoped.",
  why:"The colour contract is a published convention; honouring it precisely is part of being a well-behaved, premium CLI.",
  fail:"NO_COLOR is ignored or FORCE_COLOR can't force colour back; power users and accessibility users both get the wrong output.",
  parents:["A11Y.080"], dependsOn:[], siblings:["PALETTE.023"], guardedBy:["no_color_no_ansi"] });

node({ id:"A11Y.082", cluster:"A11Y", label:"Screen reader — aria roles + gated ASCII", truth:"inference", depth:"L3", check:"C3", from:SRC.SURFACE,
  summary:"Ink Box accepts aria-role (list/listitem/tablist/textbox) and aria-state ({selected,expanded,busy}). Tag the tree 'list', each row 'listitem'+selected, clusters expanded, the slash input 'textbox'; gate decorative ASCII (mascot/wordmark) behind useIsScreenReaderEnabled() so SR users get content, not box-drawing noise.",
  why:"Ada's users are explicitly non-technical and pay real money — 'premium, legible, calm' must include screen-reader users, not just sighted ones.",
  fail:"A screen reader reads the box-drawing wordmark character by character and never reaches the actual menu.",
  parents:["A11Y.080"], dependsOn:[], siblings:["A11Y.083"], guardedBy:[] });

node({ id:"A11Y.083", cluster:"A11Y", label:"Keyboard-only, one keymap source", truth:"inference", depth:"L2", check:"C3", from:SRC.SURFACE,
  summary:"The surface is fully operable by keyboard with no mouse dependency; every action has a key, and all keys come from a single source of truth that also generates the footer and `?` overlay. Single-letter motions are gated behind a 'navigation has focus' state so letters never fire motions while an input owns focus.",
  why:"A TUI is keyboard-first by nature; a single keymap source is what keeps help, footer, and bindings provably in sync.",
  fail:"A letter motion fires while the user is typing an intent, mangling their input — the classic modal-TUI bug.",
  parents:["A11Y.080"], dependsOn:["NAV.053"], siblings:["A11Y.082"], guardedBy:[] });

// ── VOICE ─────────────────────────────────────────────────────────────────
node({ id:"VOICE.090", cluster:"VOICE", label:"Tone — calm, premium, never condescending", truth:"source", depth:"L3", check:"C1", from:SRC.WELCOME,
  summary:"Copy speaks to a capable adult who happens not to code: 'Welcome back, Alex' / 'a semantic compiler for context' / 'Turn a sentence of intent into a governed context pack.' Plain, warm, specific. No jargon walls, no baby-talk, no exclamation-mark hype.",
  why:"Tone is the audible half of 'premium'; the non-technical user judges trustworthiness by whether the words respect them.",
  fail:"Either a wall of compiler jargon (alienating) or cutesy hand-holding (insulting); both break the premium contract.",
  parents:["ROOT.002"], dependsOn:[], siblings:["VOICE.091","VOICE.093"], guardedBy:[] });

node({ id:"VOICE.091", cluster:"VOICE", label:"The verbs — Compile / Open / Interview / Browse", truth:"source", depth:"L2", check:"C3", from:SRC.WELCOME,
  summary:"The home actions are concrete verbs with a one-line describe each (MENU_ITEMS): Compile an idea, Open a pack, Interview (ctx init), Browse/resume, Settings. The verb says what happens; the describe says why you'd pick it. Naming is the interface.",
  why:"For a non-technical user the verb labels ARE the mental model of what Ada can do; precise verbs prevent wrong turns.",
  fail:"Vague labels ('Start', 'Go', 'New') force the user to guess; the menu stops being self-explanatory.",
  parents:["VOICE.090"], dependsOn:[], siblings:["VOICE.092"], guardedBy:[] });

node({ id:"VOICE.092", cluster:"VOICE", label:"Truth glyphs as language", truth:"source", depth:"L3", check:"C3", from:SRC.GRAMMAR,
  summary:"The glyphs are vocabulary, not decoration: ∵ source-backed, ∴ inferred, Ω residue/gap, κ check, ◈/◦ pack/node. The surface teaches this alphabet once and reuses it everywhere (counts read `κ 3 · Ω 8`), so provenance is legible at a glance and survives NO_COLOR.",
  why:"A tiny consistent glyph alphabet lets the surface show epistemic status (A2) without prose and without colour — meaning that degrades to mono.",
  fail:"Provenance is shown only in colour or only in words; under NO_COLOR or at a glance the user can't tell a fact from a guess.",
  parents:["VOICE.090"], dependsOn:[], siblings:["A11Y.080"], guardedBy:["color_has_glyph"] });

node({ id:"VOICE.093", cluster:"VOICE", label:"Error & empty microcopy — a hole, not a lie", truth:"inference", depth:"L2", check:"C1", from:SRC.AXIOMS,
  summary:"Failure and empty copy follow A4 in language: name the gap, never fabricate completion. 'no packs yet — Compile an idea', 'couldn't parse the model's output — retry or open the partial'. A deferred question beats a fabricated answer, in the words as much as the engine.",
  why:"Microcopy is where the governance axioms become felt; honest copy under failure is what makes the trust claim credible.",
  fail:"Cheerful copy papers over a failure ('All done!') and the user discovers the lie later — the worst trust outcome.",
  parents:["VOICE.090"], dependsOn:["STATE.072"], siblings:["VOICE.092"], guardedBy:[] });

// ── UNK — the unknown-unknowns / residue layer (Ω) ──────────────────────────
node({ id:"UNK.100", cluster:"UNK", label:"Light mode / adaptive theme — only a dark reference exists", truth:"residue", depth:"L1", check:"C0", from:SRC.SURFACE,
  summary:"Every token and contrast figure is measured against one dark reference (#1B1410 / #1E1E1E). Whether Ada needs a light-terminal theme — and whether AdaptiveColor (lipgloss) is worth the complexity — is unanswered. A user on a light terminal today gets earth tones tuned for dark.",
  why:"A meaningful slice of terminals run light backgrounds; the surface's legibility there is currently unverified.",
  fail:"Earth tones tuned for dark wash out on a light terminal and the premium feel inverts into a muddy mess.",
  parents:["ROOT.000"], dependsOn:["PALETTE.022"], siblings:["UNK.101"], guardedBy:[] });

node({ id:"UNK.101", cluster:"UNK", label:"Mouse / OSC-8 hyperlinks — adopt or stay keyboard-pure?", truth:"residue", depth:"L1", check:"C0", from:SRC.SEED,
  summary:"Modern terminals support mouse events and OSC-8 hyperlinks (clickable node ids, file paths to the pack on disk). Whether Ada adopts any pointer affordance or stays deliberately keyboard-pure is an open identity decision, not just a feature toggle.",
  why:"Clickable pack paths could make A5 (filesystem-backed) tangible; mouse could also dilute the keyboard-first identity.",
  fail:"Either a half-mouse surface that works in some terminals and not others, or a missed cheap win (clickable .ada/ paths).",
  parents:["ROOT.000"], dependsOn:["A11Y.083"], siblings:["UNK.100"], guardedBy:[] });

node({ id:"UNK.102", cluster:"UNK", label:"The editable playground (A1 D3) — how does it FEEL in a TUI?", truth:"residue", depth:"L1", check:"C0", from:SRC.AXIOMS,
  summary:"Axiom A1/D3 makes the exploratory graph USER-EDITABLE: spawn nodes, drag edges, push deeper, co-excavating alongside the engine. What the verbs, gestures, and feedback for that look like in a terminal — and how user-authored ∵ nodes visually differ from engine ∴/Ω — is entirely unexcavated.",
  why:"This is a load-bearing product capability with zero surface design yet; it could be the most important screen Ada doesn't have.",
  fail:"The editable layer ships as raw file editing because no interaction model was designed; the 'playground' promise is hollow.",
  parents:["ROOT.000"], dependsOn:["NAV.052"], siblings:["UNK.105"], guardedBy:[] });

node({ id:"UNK.103", cluster:"UNK", label:"True first-run onboarding — is recognition enough?", truth:"residue", depth:"L1", check:"C0", from:SRC.SEED,
  summary:"The welcome assumes the user knows what a 'pack', a 'node', a 'graph' is. For a genuine first-ever run (never seen Ada, non-technical) recognition-over-recall may not be enough — there may need to be a one-time guided compile. Unverified whether the menu alone carries a true novice.",
  why:"First-run is where non-technical users are won or lost; the current design is optimised for the returning 'Alex', not the stranger.",
  fail:"A first-time non-technical user recognises the buttons but not the concepts, compiles nothing, and leaves.",
  parents:["FLOW.060"], dependsOn:[], siblings:["UNK.104"], guardedBy:[] });

node({ id:"UNK.104", cluster:"UNK", label:"i18n / non-Latin wordmark / RTL — scope or debt?", truth:"residue", depth:"L1", check:"C0", from:SRC.ART,
  summary:"The wordmark, tag, and all copy are Latin/English; box-drawing widths assume monospace Latin. Whether Ada ever needs non-Latin labels, RTL layout, or a non-Latin wordmark fallback is undecided — currently latent debt, not a plan.",
  why:"Naming the boundary now prevents a silent monolingual assumption from hardening into the layout engine.",
  fail:"CJK/RTL support is retrofitted later against width assumptions baked into every box — expensive and fragile.",
  parents:["ROOT.000"], dependsOn:[], siblings:["UNK.103"], guardedBy:[] });

node({ id:"UNK.105", cluster:"UNK", label:"Persistent chat-input beside the tree — two focus regions", truth:"residue", depth:"L1", check:"C0", from:SRC.SURFACE,
  summary:"The research defers useFocusManager until 'the persistent chat-input-beside-the-tree milestone lands and two interactive regions are on screen at once.' That milestone's layout, focus-cycling, and motion-quiet-zones are unexcavated — today's one-pane model is a deliberate simplification with a known expansion point.",
  why:"It's the named next architectural step for the surface; designing it early prevents the one-pane assumptions from calcifying.",
  fail:"Two interactive regions get bolted on without a focus model and single-letter motions start firing into the chat input.",
  parents:["NAV.053"], dependsOn:["A11Y.083"], siblings:["UNK.102"], guardedBy:[] });

node({ id:"UNK.106", cluster:"UNK", label:"Notifications on long compile vs sovereignty (A9)", truth:"residue", depth:"L1", check:"C0", from:SRC.AXIOMS,
  summary:"A long compile might warrant a terminal bell or OS notification when done. But A9 (no phone-home, runs-and-exits) and the calm-motion ethic both push back. Whether ANY out-of-band signal fits Ada — and how it stays local-only — is unresolved.",
  why:"It sits on a real tension between attentiveness and Ada's sovereignty/calm identity; resolving it wrong violates an axiom or annoys the user.",
  fail:"A notification feature quietly reaches for an OS service that phones home, breaching A9; or a bell shatters the calm.",
  parents:["MOTION.044"], dependsOn:[], siblings:["UNK.107"], guardedBy:[] });

node({ id:"UNK.107", cluster:"UNK", label:"Theme-ability vs identity dilution — the base16 trap", truth:"residue", depth:"L1", check:"C0", from:SRC.TOKENS,
  summary:"tokens.ts is built to re-skin the whole shell from one file — inviting user themes. But the more a user remaps, the less Ada looks like Ada (the base16/ngrok identity trap the palette work warns about). How much customization the surface should expose before the brand dissolves is an open product line.",
  why:"It's a direct tension between the token system's flexibility and the 'sister to Claude Code' identity that flexibility could erase.",
  fail:"Full theme exposure turns every install into a different-looking tool; the recognisable Ada identity evaporates.",
  parents:["PALETTE.020"], dependsOn:["PALETTE.023"], siblings:["UNK.106"], guardedBy:[] });

// ─────────────────────────────────────────────────────────────────────────────
// C CHECKS — deterministic, A3-honest (runnable, no model, no taste-as-C).
// ─────────────────────────────────────────────────────────────────────────────
const CHECKS = [
  { id:"contrast_aa", cls:"C5",
    invariant:"Every role token used for TEXT (text, textDim, textMuted, accent, focus, success, warning, error) meets WCAG AA contrast on bg #1B1410: ≥4.5:1 for body, ≥3:1 for large/icon use. Pure ratio math on the hex pair — no judgment." },
  { id:"no_color_no_ansi", cls:"C4",
    invariant:"With NO_COLOR set (or a non-TTY stream), the rendered surface emits zero ANSI SGR colour escapes (no \\x1b[3#m / \\x1b[38;2;…m). Presence-only styling is allowed; colour is not." },
  { id:"color_has_glyph", cls:"C4",
    invariant:"Every state communicated by a colour token is ALSO carried by a non-colour glyph or label, so meaning survives colour-strip and colour-blindness. The cursor(❯), checks(κ), residue(Ω), and truth classes(∵/∴) each have a glyph." },
];

// ─────────────────────────────────────────────────────────────────────────────
// WCAG contrast (used to annotate tokens at emit + drive contrast_aa)
// ─────────────────────────────────────────────────────────────────────────────
function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const m = hex.replace("#", "");
    const c = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hexA), b = lum(hexB);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
const r2 = (x) => Math.round(x * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// Minimal YAML emitter (strings always quoted; handles the shapes we use)
// ─────────────────────────────────────────────────────────────────────────────
function yaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return " []";
    return "\n" + value.map((v) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const body = yamlObj(v, indent + 1);
        return `${pad}-\n${body}`;
      }
      return `${pad}- ${scalar(v)}`;
    }).join("\n");
  }
  if (value && typeof value === "object") return "\n" + yamlObj(value, indent);
  return " " + scalar(value);
}
function yamlObj(obj, indent) {
  const pad = "  ".repeat(indent);
  return Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) return `${pad}${k}:${yaml(v, indent + 1)}`;
    if (v && typeof v === "object") return `${pad}${k}:${yaml(v, indent + 1)}`;
    return `${pad}${k}: ${scalar(v)}`;
  }).join("\n");
}
function scalar(v) {
  if (v === null || v === undefined) return '""';
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTORS
// ─────────────────────────────────────────────────────────────────────────────
const TRUTH_GLYPH = { source: "∵", inference: "∴", residue: "Ω" };
const out = (rel, content) => {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
};
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

function nodeRecord(n) {
  return {
    id: n.id,
    label: n.label,
    glyph: TRUTH_GLYPH[n.truth] === "Ω" ? "Ω" : "◇",
    colour: CLUSTERS[n.cluster].colour,
    status: "finished",
    depth: n.depth,
    truth: n.truth,
    role: { cluster: n.cluster, nodeType: n.cluster === "UNK" ? "residue" : "design_capsule",
      compileTargets: ["graph", "wiki", "claude", "blueprint"] },
    localContext: { summary: n.summary, whyItMatters: n.why, failureIfMissing: n.fail },
    worldLinks: {
      parents: n.parents, children: childrenOf(n.id), siblings: n.siblings,
      dependsOn: n.dependsOn, exportsTo: ["CLAUDE.md", "CONTEXT.md"], guardedBy: n.guardedBy },
    epistemics: { claimClass: n.cluster === "UNK" ? "open_question" : "design_principle",
      confidence: n.truth === "residue" ? "open" : (n.truth === "source" ? "high" : "medium"),
      sourceStatus: n.truth === "residue" ? "unexcavated" : "excavated", from: n.from },
    checkability: { class: n.check,
      explanation: n.check === "C0" ? "Exploratory / open; not a deterministic guarantee."
        : n.check.startsWith("C4") || n.check === "C5" ? "Has a deterministic predicate (see c/)."
        : "Subjective or human-gated (A3/A4); rubric or Alex decides, not C." },
    ui: { visibleBadges: [n.depth, n.check, TRUTH_GLYPH[n.truth]], openPriority: n.depth === "L4" || n.depth === "L5" ? "high" : "normal" },
  };
}
function childrenOf(id) { return N.filter((m) => m.parents.includes(id)).map((m) => m.id); }

// graph.yaml + graph.json
const graph = {
  id: `graph-${SLUG}`, version: "0.1.0", packSlug: SLUG,
  nodes: N.map(nodeRecord),
  edges: N.flatMap((n) => [
    ...n.parents.map((p) => ({ from: p, to: n.id, kind: "parent" })),
    ...n.dependsOn.map((d) => ({ from: n.id, to: d, kind: "dependsOn" })),
    ...n.guardedBy.map((g) => ({ from: n.id, to: `check:${g}`, kind: "guardedBy" })),
  ]),
  checks: CHECKS,
};
out("graph.yaml", yamlObj(graph, 0) + "\n");
out("graph.json", JSON.stringify(graph, null, 2) + "\n");

// graph.jsonld — the linked-data projection
const VOCAB = "https://motherlabs.dev/ns/ada-design#";
const nref = (id) => ({ "@id": `ada:node/${id}` });
const jsonld = {
  "@context": {
    "@vocab": VOCAB, ada: VOCAB, schema: "http://schema.org/",
    id: "@id", type: "@type", label: "schema:name", summary: "schema:description",
    cluster: "ada:cluster", truth: "ada:truthClass", checkClass: "ada:checkClass",
    from: "ada:provenance", depth: "ada:depth",
    parent: { "@id": "ada:parent", "@type": "@id" },
    child: { "@id": "ada:child", "@type": "@id" },
    dependsOn: { "@id": "ada:dependsOn", "@type": "@id" },
    sibling: { "@id": "ada:sibling", "@type": "@id" },
    guardedBy: { "@id": "ada:guardedBy", "@type": "@id" },
    invariant: "ada:invariant",
  },
  "@graph": [
    { "@id": `ada:pack/${SLUG}`, "@type": "ada:DesignPack",
      label: "Ada TUI Surface — Design Context Pack",
      summary: "The recursively-excavated UI/UX problem space for Ada's own terminal surface.",
      "ada:cluster": Object.keys(CLUSTERS) },
    ...N.map((n) => ({
      "@id": `ada:node/${n.id}`,
      "@type": n.cluster === "UNK" ? "ada:OpenQuestion" : "ada:DesignCapsule",
      label: n.label, summary: n.summary, cluster: n.cluster,
      truth: n.truth, checkClass: n.check, depth: n.depth, from: n.from,
      "ada:whyItMatters": n.why, "ada:failureIfMissing": n.fail,
      parent: n.parents.map((p) => `ada:node/${p}`),
      child: childrenOf(n.id).map((c) => `ada:node/${c}`),
      dependsOn: n.dependsOn.map((d) => `ada:node/${d}`),
      sibling: n.siblings.map((s) => `ada:node/${s}`),
      guardedBy: n.guardedBy.map((g) => `ada:check/${g}`),
    })),
    ...CHECKS.map((c) => ({
      "@id": `ada:check/${c.id}`, "@type": "ada:DeterministicCheck",
      label: c.id, checkClass: c.cls, invariant: c.invariant,
    })),
  ],
};
out("graph.jsonld", JSON.stringify(jsonld, null, 2) + "\n");

// tokens.yaml + tokens.jsonld — the design-token artifacts
const roleTokenRecords = roleTokens.map(([name, hex, tier, role]) => {
  const isText = ["text", "textDim", "textMuted", "accent", "focus", "success", "warning", "error"].includes(name);
  return { name, value: hex, tier, role, ...(isText ? { contrastOnBg: r2(contrastRatio(hex, BG)),
    aa: contrastRatio(hex, BG) >= 4.5, aaLarge: contrastRatio(hex, BG) >= 3 } : {}) };
});
const tokensDoc = {
  pack: SLUG, reference: { bg: BG, note: "contrast ratios are WCAG 2.x relative luminance vs bg" },
  tiers: { base: "60% — calm field", structure: "30% — text & structure", accent: "10% — the one warm pop", status: "sparingly used state colour" },
  roleTokens: roleTokenRecords,
  pigmentPalette: pigmentTokens.map(([name, hex, role]) => ({ name, value: hex, role })),
  glyphAlphabet: GLYPHS,
};
out("tokens.yaml", yamlObj(tokensDoc, 0) + "\n");
out("tokens.jsonld", JSON.stringify({
  "@context": { "@vocab": VOCAB, dtcg: "https://www.w3.org/community/design-tokens/#",
    id: "@id", type: "@type", value: "ada:value", role: "ada:role", tier: "ada:tier",
    contrastOnBg: "ada:contrastOnBg" },
  "@graph": [
    ...roleTokenRecords.map((t) => ({ "@id": `ada:token/role/${t.name}`, "@type": "ada:RoleToken",
      value: t.value, tier: t.tier, role: t.role, ...(t.contrastOnBg ? { contrastOnBg: t.contrastOnBg, "ada:wcagAA": t.aa } : {}) })),
    ...pigmentTokens.map(([name, hex, role]) => ({ "@id": `ada:token/pigment/${name}`, "@type": "ada:PigmentToken", value: hex, role })),
  ],
}, null, 2) + "\n");

// manifest.json
const clusterCounts = Object.keys(CLUSTERS).map((c) => [c, N.filter((n) => n.cluster === c).length]);
out("manifest.json", JSON.stringify({
  slug: SLUG, product: "Ada by Motherlabs — terminal surface",
  schemaVersion: "0.1.0",
  createdNote: "Excavated from one intent (Ada's own TUI surface) by the design compiler; grounded in src/tui/ink/ + docs/SURFACE-DESIGN.md. Exploratory layer (A1); provenance via truth-class + from (A2).",
  nodeCount: N.length,
  edgeCount: graph.edges.length,
  checkCount: CHECKS.length,
  residueCount: N.filter((n) => n.truth === "residue").length,
  clusters: Object.keys(CLUSTERS),
  clusterCounts: Object.fromEntries(clusterCounts),
}, null, 2) + "\n");

// per-node capsules: nodes/<CLUSTER>/<nnn>-<slug>/{wiki.md,edges.yaml,export.yaml}
for (const n of N) {
  const seq = n.id.split(".")[1];
  const dir = `nodes/${n.cluster}/${seq}-${slugify(n.label)}`;
  const g = TRUTH_GLYPH[n.truth];
  out(`${dir}/wiki.md`, [
    `# ${n.id} · ${n.label}`, "",
    `> ${g} ${n.truth} · ${n.depth} · ${n.check} · area **${n.cluster}** · from \`${n.from}\``, "",
    `## Summary`, n.summary, "",
    `## Why it matters`, n.why, "",
    `## Failure if missing`, n.fail, "",
    `## Links`,
    `- parents: ${n.parents.map((x) => `\`${x}\``).join(", ") || "—"}`,
    `- children: ${childrenOf(n.id).map((x) => `\`${x}\``).join(", ") || "—"}`,
    `- dependsOn: ${n.dependsOn.map((x) => `\`${x}\``).join(", ") || "—"}`,
    `- siblings: ${n.siblings.map((x) => `\`${x}\``).join(", ") || "—"}`,
    `- guardedBy: ${n.guardedBy.map((x) => `\`${x}\` (deterministic C)`).join(", ") || "—"}`, "",
  ].join("\n"));
  out(`${dir}/edges.yaml`, yamlObj({
    id: n.id,
    parents: n.parents, children: childrenOf(n.id), dependsOn: n.dependsOn,
    siblings: n.siblings, guardedBy: n.guardedBy,
  }, 0) + "\n");
  out(`${dir}/export.yaml`, yamlObj({
    compileTargets: ["graph", "wiki", "claude", "blueprint"],
    exportsTo: ["CLAUDE.md", "CONTEXT.md"],
    truth: n.truth, checkClass: n.check, provenance: n.from,
  }, 0) + "\n");
}

// c/registry.yaml
out("c/registry.yaml", yamlObj({
  pack: SLUG,
  checks: CHECKS.map((c) => ({ id: c.id, class: c.cls, invariant: c.invariant,
    guards: N.filter((n) => n.guardedBy.includes(c.id)).map((n) => n.id) })),
  note: "Subjective design properties (calm, premium, one-focal-point) are NOT here — they route to rubric/human-gate (A3/A4). Only deterministic predicates live in C.",
}, 0) + "\n");

// ── wiki projection ─────────────────────────────────────────────────────────
const byCluster = (c) => N.filter((n) => n.cluster === c);
const highValue = N.filter((n) => n.depth === "L4" || n.depth === "L5");

out("wiki/index.md", [
  `# Ada TUI Surface — Design World Model`, "",
  `> The recursively-excavated UI/UX problem space for Ada's own terminal surface — the calm, premium, earth-toned sister to Claude Code. Every node traces to code (\`src/tui/ink/\`) or the research dossier (\`docs/SURFACE-DESIGN.md\`); open questions are honest residue (Ω).`, "",
  `**Map.** ${N.length} nodes · ${graph.edges.length} edges · ${CHECKS.length} deterministic checks · ${N.filter((n) => n.truth === "residue").length} residue · ${Object.keys(CLUSTERS).length} areas.`, "",
  `## Start here (high-value nodes)`,
  ...highValue.map((n) => `- ${TRUTH_GLYPH[n.truth]} **${n.id}** ${n.label} — ${n.summary.split(".")[0]}.`), "",
  `## Areas`,
  ...Object.entries(CLUSTERS).map(([c, meta]) => `- **${c}** — ${meta.title} (${byCluster(c).length} nodes)`), "",
  `## Sections`,
  `- [Glossary](glossary.md)`,
  `- [Data model](data-model.md) — the token + component contract`,
  `- [Workflows](workflows.md) — the journeys`,
  `- [C checks](c-checks.md)`,
  `- [Open questions](open-questions.md) — the unknown-unknowns`,
  `- [Risks](risks.md)`, "",
].join("\n"));

out("wiki/glossary.md", [
  `# Glossary`, "",
  `Design-surface vocabulary. The glyph alphabet is shared with the running TUI so meaning survives NO_COLOR.`, "",
  `| term | meaning |`, `|---|---|`,
  `| **role token** | a chrome colour referenced by purpose (\`bg\`,\`text\`,\`accent\`); re-skins the whole shell from one file (\`tokens.ts\`) |`,
  `| **pigment / category** | a meaning colour (\`terracotta\`,\`plum\`…) carrying truth/cluster/check identity (\`grammar.ts\`) |`,
  `| **60/30/10** | base / structure / accent budget — the accent (10%) is the only thing that pops or moves |`,
  `| **the heartbeat** | the compile animation: 9 named stages CTX→…→BLD with a determinate bar |`,
  `| **prune-filter** | filter-as-you-type that rebuilds the tree from matches + ancestors, not jump-to-first-match |`,
  `| **the reader** | the full-screen capsule overlay with a one-hop neighbour strip |`,
  `| **∵ ∴ Ω** | truth classes: source-backed / inferred / residue (open gap) |`,
  `| **κ** | a deterministic C check; **Ω** doubles as the residue/unknowns marker |`,
  `| **focal point** | the single fully-lit thing per screen (the cursor) |`,
  `| **degradation ladder** | truecolor → 256 → 16 → mono fallback owned by one codepath |`, "",
].join("\n"));

out("wiki/data-model.md", [
  `# Data model — the design contract`, "",
  `## Role tokens (60/30/10 chrome) — contrast measured on bg \`${BG}\``, "",
  `| token | hex | tier | contrast↑bg | AA |`, `|---|---|---|---|---|`,
  ...roleTokenRecords.map((t) => `| \`${t.name}\` | ${t.value} | ${t.tier} | ${t.contrastOnBg ?? "—"} | ${t.contrastOnBg ? (t.aa ? "✓ AA" : (t.aaLarge ? "△ AA-large" : "✗ fail")) : "—"} |`), "",
  `> ✗/△ rows are exactly what the \`contrast_aa\` check pins. \`textMuted\` as body text is the headline defect.`, "",
  `## Pigment palette (meaning / category)`, "",
  `| pigment | hex | role |`, `|---|---|---|`,
  ...pigmentTokens.map(([n, h, r]) => `| \`${n}\` | ${h} | ${r} |`), "",
  `## Components (live, in \`src/tui/ink/\`)`, "",
  `- \`Welcome.ts\` — compiled home (banner + menu + sidebar + projects + hints)`,
  `- \`StatusBar.ts\` — workbench top row (pack identity + counts)`,
  `- \`art.ts\` — wordmark, mascot, gradient, star frames`,
  `- \`tokens.ts\` / \`theme.ts\` — the two-tier colour system`,
  `- \`App.ts\` — the fixed status/body/footer skeleton + mode-keyed input`, "",
].join("\n"));

out("wiki/workflows.md", [
  `# Workflows — the journeys`, "",
  ...byCluster("FLOW").map((n) => `## ${n.label}\n${n.summary}\n\n*Why:* ${n.why}\n`),
  `## State coverage`,
  ...byCluster("STATE").map((n) => `- **${n.label}** — ${n.summary.split(".")[0]}.`), "",
].join("\n"));

out("wiki/c-checks.md", [
  `# C checks — the deterministic floor`, "",
  `Only properties with a runnable pass/fail predicate live here (A3). Run: \`node c/checks/verify.mjs\`.`, "",
  `| check | class | invariant | guards |`, `|---|---|---|---|`,
  ...CHECKS.map((c) => `| \`${c.id}\` | ${c.cls} | ${c.invariant.split(".")[0]}. | ${N.filter((n) => n.guardedBy.includes(c.id)).map((n) => n.id).join(", ") || "—"} |`), "",
  `## What is deliberately NOT a check`,
  `Calm, premium, "one focal point", tasteful motion — these are real requirements but subjective; they route to rubric (C2) or Alex's human gate (C1), never forged into a brittle predicate. Forging a non-binary rule into C is itself the A3 violation.`, "",
].join("\n"));

out("wiki/open-questions.md", [
  `# Open questions — the unknown-unknowns (Ω)`, "",
  `These are honest residue: design decisions the surface cannot yet answer. Naming them is the point — an unexamined assumption is more dangerous than a marked gap (A4).`, "",
  ...byCluster("UNK").map((n) => `## ${TRUTH_GLYPH[n.truth]} ${n.id} · ${n.label}\n${n.summary}\n\n*Why it's load-bearing:* ${n.why}\n\n*If ignored:* ${n.fail}\n`),
].join("\n"));

out("wiki/risks.md", [
  `# Risks`, "",
  `The failure modes each cluster guards against, distilled.`, "",
  ...Object.keys(CLUSTERS).filter((c) => c !== "UNK").map((c) => {
    const ns = byCluster(c);
    return `## ${c} — ${CLUSTERS[c].title}\n` + ns.map((n) => `- ${n.fail}`).join("\n");
  }), "",
].join("\n"));

console.log(`compiled ${SLUG}: ${N.length} nodes, ${graph.edges.length} edges, ${CHECKS.length} checks, ${N.filter((n)=>n.truth==="residue").length} residue across ${Object.keys(CLUSTERS).length} areas`);
