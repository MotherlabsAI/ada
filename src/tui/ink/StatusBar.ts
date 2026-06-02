/**
 * StatusBar — the top region of the workbench. Mirrors the readline `header()`
 * (src/tui/navigator.ts) as an Ink row: pack identity + node/check/residue/cluster
 * counts, painted with the semantic colour grammar.
 */
import { createElement as h } from "react";
import { Box, Text } from "ink";
import { theme } from "./theme.js";

export interface StatusBarProps {
  slug: string;
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
}

export function StatusBar(props: StatusBarProps) {
  return h(
    Box,
    null,
    h(Text, { color: theme.terracotta }, "◈ Ada"),
    h(Text, { color: theme.ink }, ` / ${props.slug}  `),
    h(Text, null, `nodes ${props.nodes} · `),
    h(Text, { color: theme.green }, `C ${props.checks} · `),
    h(Text, { color: theme.amber }, `residue ${props.residue} · `),
    h(Text, null, `clusters ${props.clusters}`),
  );
}
