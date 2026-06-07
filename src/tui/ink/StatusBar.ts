/**
 * StatusBar — the top region of the workbench. Mirrors the readline `header()`
 * (src/tui/navigator.ts) as an Ink row: pack identity + the R1 scan readout
 * (✓checkable · ⊙gated · Ω residue) + cluster count, painted with the semantic
 * colour grammar. checkable = trust without reading; gated = your eyes (A4);
 * Ω = open gaps. One glance answers "what must I look at?".
 */
import { createElement as h } from "react";
import { Box, Text } from "ink";
import { theme } from "./theme.js";

export interface StatusBarProps {
  slug: string;
  nodes: number;
  checkable: number;
  gated: number;
  residue: number;
  clusters: number;
}

export function StatusBar(props: StatusBarProps) {
  return h(
    Box,
    null,
    h(Text, { color: theme.terracotta }, "◈ Ada"),
    h(Text, { color: theme.ink }, ` / ${props.slug} ── `),
    h(Text, null, `nodes ${props.nodes} · `),
    h(Text, { color: theme.green }, `✓${props.checkable} checkable · `),
    h(Text, { color: theme.clay }, `⊙${props.gated} gated · `),
    h(Text, { color: theme.amber }, `Ω${props.residue} residue · `),
    h(Text, null, `clusters ${props.clusters}`),
  );
}
