/**
 * Compiling — the "working" state shown while the home's Compile flow drives `engineCompile`.
 *
 * Motion is the approved one: the rotating star (`starFrame`, ~180ms/step, the same glyph the
 * Welcome banner uses) plus a live line of what's happening (proposing areas → excavating →
 * writing). The phase line is driven by the parent (it advances as the pipeline progresses) so
 * this component stays a pure renderer with ONE timer (the star), unref'd so the suite can't
 * hang. Earth-tone role `tokens` only — no restyle. Authored as `.ts` with createElement.
 *
 * On error the parent swaps this out for an inline message; this view itself never decides
 * failure — it only shows forward motion.
 */
import { createElement as h, useState, useEffect } from "react";
import { Box, Text } from "ink";
import { tokens } from "./theme.js";
import { starFrame } from "./art.js";

export interface CompilingProps {
  /** The intent being compiled (echoed so the user sees what's in flight). */
  intent: string;
  /** The live status line: "proposing areas", "excavating", "writing the pack", … */
  phase: string;
}

export function Compiling(p: CompilingProps) {
  const [starStep, setStarStep] = useState(0);

  // The rotating star — the approved "working" motion. Unref'd: never keeps node alive.
  useEffect(() => {
    const star = setInterval(() => setStarStep((s) => s + 1), 180);
    (star as { unref?: () => void }).unref?.();
    return () => clearInterval(star);
  }, []);

  // Trim a long intent so the working view stays calm and one-line.
  const shown =
    p.intent.length > 72 ? p.intent.slice(0, 71).trimEnd() + "…" : p.intent;

  return h(
    Box,
    { flexDirection: "column", paddingX: 1, paddingY: 1 },
    h(
      Box,
      { flexDirection: "row" },
      h(Text, { color: tokens.accentBright, bold: true }, starFrame(starStep)),
      h(Text, { color: tokens.text, bold: true }, "  compiling…"),
    ),
    h(Text, { key: "g1" }, " "),
    h(Text, { color: tokens.textDim }, `“${shown}”`),
    h(Text, { key: "g2" }, " "),
    // The live phase line — the accent is the only thing that moves/pops.
    h(
      Box,
      { flexDirection: "row" },
      h(Text, { color: tokens.accent }, "› "),
      h(Text, { color: tokens.text }, p.phase),
    ),
    h(Text, { key: "g3" }, " "),
    h(
      Text,
      { color: tokens.textMuted },
      "one compile-time model call per area · the key never leaves your machine",
    ),
  );
}
