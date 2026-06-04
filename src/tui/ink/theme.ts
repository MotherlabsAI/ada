/**
 * Ink colour theme — the TUI's projection of the spec colour grammar
 * (src/core/grammar.ts, AESTH.005: colour carries meaning, not decoration).
 *
 * Earthy + plum / deep-blue: deliberately Claude-Code-adjacent — a sister to
 * the terracotta family, not a clone (memory feedback_motherlabs_design).
 * Ink accepts hex strings directly for `color`/`backgroundColor`, so we re-export
 * the single source of truth (COLOUR_HEX) rather than re-typing the palette.
 */
import { COLOUR_HEX } from "../../core/grammar.js";
import type { Colour } from "../../core/types.js";

/** Ink colour map keyed by the semantic colour names from the grammar. */
export const theme: Record<Colour, string> = { ...COLOUR_HEX };

/** Convenience: the hex for a semantic colour (Ink accepts it for `color`). */
export function colour(name: Colour): string {
  return theme[name];
}

/**
 * Re-export the earth-tone role tokens (60/30/10). Chrome (the shell layout)
 * references these roles; the pigment `theme` map stays for meaning-coloring.
 */
export { tokens, TOKEN_FALLBACK_16 } from "./tokens.js";
export type { TokenRole } from "./tokens.js";
