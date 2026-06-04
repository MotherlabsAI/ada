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
  textMuted: "#7A6650",
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
