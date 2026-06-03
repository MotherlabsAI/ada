/**
 * Welcome — the opening page, full-window. Claude Code's sister: the card (ADA wordmark +
 * mascot + pack stats) is vertically + horizontally centered in the whole terminal, with a
 * chat-style input line and command bar pinned at the bottom. Adaptive to terminal size.
 */
import { createElement as h } from "react";
import { Box, Text } from "ink";
import { theme } from "./theme.js";
import { WORDMARK, mascot } from "./art.js";

export interface WelcomeProps {
  slug: string;
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
  cols: number;
  rows: number;
  mascotName?: string;
}

export function Welcome(p: WelcomeProps) {
  const m = mascot(p.mascotName);
  const cardW = Math.max(40, Math.min(p.cols - 8, 88));
  const height = Math.max(8, p.rows - 1);

  return h(
    Box,
    { flexDirection: "column", height },
    // Centered card region — fills all space above the pinned bottom rows.
    h(
      Box,
      {
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      },
      h(
        Box,
        {
          flexDirection: "column",
          borderStyle: "round",
          borderColor: theme.terracotta,
          paddingX: 3,
          paddingY: 1,
          width: cardW,
        },
        ...WORDMARK.map((l, i) =>
          h(Text, { key: "w" + i, color: theme.terracotta, bold: true }, l),
        ),
        h(Text, { key: "gap" }, " "),
        h(
          Box,
          { key: "row", flexDirection: "row" },
          h(
            Box,
            { flexDirection: "column", marginRight: 3 },
            ...m.map((l, i) => h(Text, { key: "m" + i, color: theme.plum }, l)),
          ),
          h(
            Box,
            { flexDirection: "column" },
            h(Text, { key: "hi", bold: true }, "Welcome back, Alex"),
            h(
              Text,
              { key: "tag", color: theme.ink },
              "a semantic compiler for context",
            ),
          ),
        ),
        h(Text, { key: "gap2" }, " "),
        h(Text, { key: "pack", color: theme.cyan }, `◈ ${p.slug}`),
        h(
          Text,
          { key: "stats", color: theme.ink },
          `${p.nodes} nodes · κ ${p.checks} · Ω ${p.residue} residue · ${p.clusters} areas`,
        ),
      ),
      h(Text, { key: "enter", color: theme.ink }, "press ⏎ to open the graph"),
    ),
    // Pinned bottom: chat input + command bar.
    h(Text, { key: "input" }, " ❯ ask about your context, or open the graph…"),
    h(
      Text,
      { key: "bar", color: theme.ink },
      "   open graph ⏎  ·  commands /  ·  flagged  ·  export  ·  quit q",
    ),
  );
}
