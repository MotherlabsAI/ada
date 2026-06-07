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

/** Semantic role → truecolor hex. The only place chrome colour is decided. */
export const tokens = {
  // ── 60% base (the calm warm-dark field) ───────────────────────────────
  bg: "#1B1410",
  surface: "#251D16",
  surfaceAlt: "#2F2419",
  // ── 30% structure & text (mid earth) ──────────────────────────────────
  text: "#ECDDC9",
  textDim: "#B49B80",
  textMuted: "#968063", // lifted from #7A6650 (3.33:1) → 4.82:1 to clear AA for body text (PALETTE.022)
  border: "#4A3A2C",
  // ── 10% accent (the warm pop — the only thing that moves) ──────────────
  accent: "#D59632", // amber
  accentBright: "#E8A94A",
  focus: "#C66A43", // clay
  selection: "#3A281C", // selected-row background tint
  // ── status (warm-leaning, used sparingly) ─────────────────────────────
  success: "#3E8F5A",
  warning: "#D59632",
  error: "#B65A6B",
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
