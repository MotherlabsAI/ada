/**
 * Colour + symbol grammar (spec §2/§3). Colours carry meaning, not decoration
 * (AESTH.005). Truecolor ANSI, honouring NO_COLOR and non-TTY output.
 */
import type { Colour, TruthClass, CheckClass } from "./types.js";

export const COLOUR_HEX: Record<Colour, string> = {
  clay: "#C66A43",
  terracotta: "#B8543C",
  plum: "#6E5ACF",
  deep_blue: "#4E7FB5",
  sage: "#7E9A66",
  amber: "#E3A53C", // sap — harmonised with the tree palette (tokens.warning)
  green: "#7C9A55", // moss · lichen — settled/checkable, matches tokens.success
  rose: "#B65A6B",
  slate: "#8893A6",
  cyan: "#2F8FA3",
  ink: "#9AA3AF", // lightened for legibility on dark terminals
};

const colourEnabled =
  !process.env["NO_COLOR"] && Boolean(process.stdout && process.stdout.isTTY);

function rgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

export function paint(text: string, colour: Colour): string {
  if (!colourEnabled) return text;
  const [r, g, b] = rgb(COLOUR_HEX[colour]);
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

export function dim(text: string): string {
  return colourEnabled ? `\x1b[2m${text}\x1b[0m` : text;
}

export function bold(text: string): string {
  return colourEnabled ? `\x1b[1m${text}\x1b[0m` : text;
}

export const TRUTH_GLYPH: Record<TruthClass, string> = {
  source: "∵",
  inference: "∴",
  residue: "Ω",
};

export const CHECK_LABEL: Record<CheckClass, string> = {
  C0: "uncheckable",
  C1: "human review",
  C2: "rubric/LLM",
  C3: "deterministic",
  C4: "property-based",
  C5: "static/db",
};
