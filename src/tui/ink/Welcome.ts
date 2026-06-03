/**
 * Welcome — the opening page. Claude Code's sister: a rounded, adaptive framed box with
 * the ADA wordmark + mascot + pack stats, a chat-style input line, and a bottom command
 * bar. This is the landing the shell opens on; pressing ⏎ drops into the graph.
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
  mascotName?: string;
}

export function Welcome(p: WelcomeProps) {
  const m = mascot(p.mascotName);
  const width = Math.max(40, Math.min(p.cols - 2, 72));

  return h(
    Box,
    { flexDirection: "column" },
    h(
      Box,
      {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: theme.terracotta,
        paddingX: 2,
        paddingY: 1,
        width,
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
    h(Text, { key: "input" }, " ❯ ask about your context, or open the graph…"),
    h(
      Text,
      { key: "bar", color: theme.ink },
      "   open graph ⏎  ·  commands /  ·  flagged  ·  export  ·  quit q",
    ),
  );
}
