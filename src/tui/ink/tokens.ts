/**
 * Earth-tone role tokens — the 60/30/10 palette for the Ink TUI.
 *
 * WHY ROLE TOKENS (not raw hex): components reference SEMANTIC roles
 * (`tokens.bg`, `tokens.accent`, `tokens.text`) so the whole shell can be
 * re-skinned by editing this one file. The pigment names in COLOUR_HEX
 * (terracotta, clay, amber, plum…) stay the source of truth for *meaning*
 * coloring — truth class, cluster identity, check class — because there
 * colour carries information (grammar.ts / AESTH.005). Tokens are for the
 * *chrome*: the calm field, the structure, and the single warm pop.
 *
 * THE 60/30/10 INTENT (a tasteful first cut — Alex tweaks the hexes live):
 *   • 60% — the BASE: warm dark field the eye rests on. Most of the screen.
 *           `bg` / `surface` / `surfaceAlt`. Nothing competes with it.
 *   • 30% — STRUCTURE & TEXT: mid-earth tones that carry the content.
 *           `text` / `textDim` / `textMuted` / `border`. Legible, quiet.
 *   • 10% — the ACCENT: the ONLY thing that moves or pops. Amber/clay warm.
 *           `accent` / `accentBright` / `focus` / `selection`. Used sparingly:
 *           the focused row, the animated banner, the rotating star.
 *
 * EARTH-ONLY: every role is warm (terracotta family). No blue/cool accent —
 * the cool pigments (cyan/deep_blue/plum) remain in COLOUR_HEX for meaning,
 * never for chrome.
 *
 * GRACEFUL DEGRADE (16-colour fallback): truecolor terminals get the hexes
 * below. On a 16-colour terminal each role maps to its nearest ANSI name
 * (see `TOKEN_FALLBACK_16`): the screen loses nuance but stays earthy and
 * legible — base→black, text→white, accent→yellow, focus→red, success→green,
 * error→red. Ink renders the hex directly; the fallback note is documentation
 * for the day we add a low-colour code path.
 */

/**
 * Semantic role → truecolor hex. The only place chrome colour is decided.
 *
 * THE TREE PALETTE (2026-06-07): nature's own harmony — bark-brown field, leaf-green
 * and sap-gold accents. Brown + green is the most grounded pairing there is (a trunk
 * under its canopy), so the scheme reads as *organic* without anyone naming why.
 * Tones held muted at the "right depth" (no neon), contrast lifted so the 30/10 carry
 * against the 60: text ~14:1, accent ~9:1 on the deepened base.
 *   • 60% bark / soil / shadow — bg / surface / surfaceAlt (the warm dark, + the
 *     `surface` fill that panels the focused group so the screen isn't half-empty).
 *   • 30% heartwood / parchment — text / textDim / textMuted / border.
 *   • 10% sap / clay — accent / accentBright / focus / selection (the one warm pop).
 */
export const tokens = {
  // ── 60% base (bark · soil · shadow — the warm dark field) ──────────────
  bg: "#16110C",
  surface: "#1F1812", // bark — the fill behind the focused column (Gestalt common region)
  surfaceAlt: "#2A2018", // lit bark
  // ── 30% structure & text (heartwood · parchment — NEUTRAL warm, no olive) ──
  text: "#F0E6D6", // parchment — ~14:1 on bg for fast scanning
  textDim: "#C6B4A0", // warm tan — neutral, not olive
  textMuted: "#9E8C7A", // weathered taupe — clears AA on bg, reads grey-warm not green
  border: "#463729", // bark edge
  // ── 10% accent (amber · clay — ONE warm pop, off the mustard/lemon axis) ──
  accent: "#DA8F3A", // amber — warmed toward orange so it reads sap, not mustard
  accentBright: "#EFA851",
  focus: "#C8693F", // clay · bark-red
  selection: "#2E2014", // neutral dark bark — the cursor bar (no olive cast)
  // ── status (tree-semantic, used sparingly) ────────────────────────────
  success: "#6F9258", // forest-moss — cleaner green, less yellow
  warning: "#DA8F3A", // amber — open work
  error: "#C0604D", // rust — true blocker (red reserved for risk only)
} as const;

export type TokenRole = keyof typeof tokens;

/**
 * STATE TOKENS — the semantic-state layer.
 *
 * The spine rule (A11Y.080 / AESTH.005): **colour is never load-bearing.** Every
 * state the surface communicates in colour must ALSO carry a non-colour signal —
 * a glyph, a word, and a weight — so meaning survives `NO_COLOR`, colour-blindness,
 * and a mono terminal. This layer is the single source of that pairing; the
 * verifier audits the projection of it, so the map can never drift into colour-only.
 *
 * Each entry binds a colour `role` (from `tokens`) to its non-colour carriers.
 * Vocabulary follows the design law: blockers_not_errors, evidence_not_lore.
 */
export interface StateToken {
  /** non-colour glyph — the primary carrier when colour is stripped */
  glyph: string;
  /** non-colour word — shown in the inspector / audit text */
  label: string;
  /** which role colour paints this state (must be a `TokenRole`) */
  color: TokenRole;
  /** luminance weight — the second non-colour channel (hierarchy in mono) */
  weight: "normal" | "bold" | "dim";
}

export const stateTokens = {
  // ── provenance / truth class (A2) ─────────────────────────────────────
  source: { glyph: "∵", label: "source", color: "accent", weight: "normal" },
  inferred: {
    glyph: "∴",
    label: "inferred",
    color: "textDim",
    weight: "normal",
  },
  residue: { glyph: "Ω", label: "residue", color: "warning", weight: "normal" },
  // ── verification (A3) ─────────────────────────────────────────────────
  check: { glyph: "κ", label: "check", color: "success", weight: "normal" },
  failure: { glyph: "✗", label: "failure", color: "error", weight: "bold" },
  // ── navigation / focus ────────────────────────────────────────────────
  cursor: { glyph: "❯", label: "focus", color: "focus", weight: "bold" },
  flagged: { glyph: "⊙", label: "flagged", color: "accent", weight: "normal" },
  node: { glyph: "◇", label: "node", color: "text", weight: "normal" },
  // ── governance: a blocker is a state, not an error (blockers_not_errors) ─
  blocked: { glyph: "▲", label: "blocked", color: "error", weight: "bold" },
} as const satisfies Record<string, StateToken>;

export type StateName = keyof typeof stateTokens;

/**
 * CONFIDENCE TOKENS — the confidence/completeness dimension.
 *
 * A node's confidence is never carried by colour alone (A11Y.080). The primary
 * carrier is a filled-bar GLYPH ramp (▰▰▰ → ▰▱▱) plus a luminance `weight`, so
 * the level survives `NO_COLOR` and a mono terminal. Colour only reinforces the
 * ramp; it does not encode it. These are StateTokens so the same verifier loop
 * audits the colour↔non-colour pairing.
 */
export const confidenceTokens = {
  certain: { glyph: "▰▰▰", label: "certain", color: "text", weight: "bold" },
  probable: {
    glyph: "▰▰▱",
    label: "probable",
    color: "textDim",
    weight: "normal",
  },
  tentative: {
    glyph: "▰▱▱",
    label: "tentative",
    color: "textMuted",
    weight: "dim",
  },
} as const satisfies Record<string, StateToken>;

export type ConfidenceName = keyof typeof confidenceTokens;

/**
 * RECENCY TOKENS — the recency/change dimension.
 *
 * "Just changed" must read without colour: the ✦ glyph + bold carry novelty,
 * the · glyph + dim carry settled. A diff view that signalled change in colour
 * only would vanish under NO_COLOR — forbidden by the spine rule.
 */
export const recencyTokens = {
  changed: {
    glyph: "✦",
    label: "changed",
    color: "accentBright",
    weight: "bold",
  },
  settled: { glyph: "·", label: "settled", color: "textMuted", weight: "dim" },
} as const satisfies Record<string, StateToken>;

export type RecencyName = keyof typeof recencyTokens;

/**
 * ACTIVITY TOKENS — the agent-activity dimension (the static counterpart to the
 * `compileHeartbeat` motion token).
 *
 * Motion signals "working" while it is on screen; but reduced-motion strips the
 * pulse, so the activity state must ALSO exist as a glyph (◐ working / ○ idle).
 * Together motion + state mean the machine is never silently frozen-looking.
 */
export const activityTokens = {
  working: { glyph: "◐", label: "working", color: "accent", weight: "normal" },
  idle: { glyph: "○", label: "idle", color: "textMuted", weight: "dim" },
} as const satisfies Record<string, StateToken>;

export type ActivityName = keyof typeof activityTokens;

/**
 * DENSITY TOKENS — the graph-density / edge-visibility budget.
 *
 * Distinct shape from a StateToken: density is a LAYOUT budget, not a painted
 * state. Each tier caps edges-per-node and names a non-colour `lineWeight`, so
 * "the map got too busy" is a checkable threshold (edge_budget / line_weight_budget
 * from the visual spec), not a matter of taste. A semantic-zoom layer chooses a
 * tier by how much of the graph is in view; the verifier enforces monotonicity.
 */
export interface DensityToken {
  /** non-colour glyph standing in for the tier in legends/status */
  glyph: string;
  /** non-colour word shown in the inspector */
  label: string;
  /** hard cap on visible edges per node at this tier (the edge budget) */
  maxEdgesPerNode: number;
  /** rendered line weight — the non-colour carrier of density */
  lineWeight: "hairline" | "thin" | "regular";
}

export const densityTokens = {
  sparse: {
    glyph: "·",
    label: "sparse",
    maxEdgesPerNode: 3,
    lineWeight: "hairline",
  },
  balanced: {
    glyph: "∶",
    label: "balanced",
    maxEdgesPerNode: 6,
    lineWeight: "thin",
  },
  dense: {
    glyph: "⁞",
    label: "dense",
    maxEdgesPerNode: 10,
    lineWeight: "regular",
  },
} as const satisfies Record<string, DensityToken>;

export type DensityName = keyof typeof densityTokens;

/**
 * MOTION TOKENS — calm motion, every animation declared with its reason and its
 * reduced-motion fallback.
 *
 * The law (calm_motion, every_motion_has_a_state_reason): the surface only moves
 * to signal one of three real states — work in flight, where focus is, or a state
 * transition just happened. No idle chrome animation, no strobing. Every token
 * therefore carries (a) the state `reason` it exists for and (b) a `reduced`
 * alternative for `ADA_REDUCED_MOTION` / `NO_COLOR` / CI, so motion is never the
 * only carrier and can always be switched off without losing information.
 */
export interface MotionToken {
  kind: "pulse" | "breath" | "reveal" | "flash" | "draw-in";
  /** cadence in ms: period for cyclic motion, per-char for reveal, duration for one-shot */
  ms: number;
  /** what renders when motion is suppressed — the reduced-motion alternative */
  reduced: "static" | "static-glyph" | "instant" | "final" | "none";
  /** the state this motion signals (no idle/decorative animation is legal) */
  reason: string;
}

export const motionTokens = {
  compileHeartbeat: {
    kind: "pulse",
    ms: 90,
    reduced: "static-glyph",
    reason: "a compile stage is in flight (machine is working, not frozen)",
  },
  welcomeBreath: {
    kind: "breath",
    ms: 1400,
    reduced: "static",
    reason:
      "the idle welcome banner is alive (one breath, killed on first nav)",
  },
  reveal: {
    kind: "reveal",
    ms: 18,
    reduced: "instant",
    reason: "a node body is being disclosed (any keypress jumps to settled)",
  },
  cursorFlash: {
    kind: "flash",
    ms: 150,
    reduced: "none",
    reason: "focus just landed here (the move itself is the feedback)",
  },
  areaOpen: {
    kind: "draw-in",
    ms: 150,
    reduced: "static",
    reason: "an area expanded (one-shot, completes to a static tree)",
  },
} as const satisfies Record<string, MotionToken>;

export type MotionName = keyof typeof motionTokens;

/**
 * 16-colour fallback per role: the nearest ANSI name for terminals without
 * truecolor. Documented now; a future low-colour path can consume it directly.
 */
export const TOKEN_FALLBACK_16: Record<TokenRole, string> = {
  bg: "black",
  surface: "black",
  surfaceAlt: "black",
  text: "white",
  textDim: "gray",
  textMuted: "gray",
  border: "gray",
  accent: "yellow",
  accentBright: "yellowBright",
  focus: "red",
  selection: "black",
  success: "green",
  warning: "yellow",
  error: "red",
};
