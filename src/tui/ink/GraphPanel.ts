/**
 * GraphPanel — the cluster→node tree (left region). Presentational: selection is
 * owned by the parent App. Mirrors the readline `renderTree()` layout
 * (src/tui/navigator.ts) as an Ink column.
 */
import { createElement as h } from "react";
import { Box, Text } from "ink";
import type { Graph } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { theme } from "./theme.js";

export interface GraphPanelProps {
  graph: Graph;
  /** Currently selected node id (App-owned). */
  selectedId: string | undefined;
  /** Flagged node ids. */
  flagged: Set<string>;
  /** Optional rejected node ids (struck/dimmed). */
  rejected?: Set<string>;
}

export function GraphPanel(props: GraphPanelProps) {
  const { graph, selectedId, flagged } = props;
  const rejected = props.rejected ?? new Set<string>();
  const clusters = [...new Set(graph.nodes.map((n) => clusterOf(n.id)))];

  return h(
    Box,
    { flexDirection: "column" },
    ...clusters.map((cluster) => {
      const nodes = graph.nodes.filter((n) => clusterOf(n.id) === cluster);
      return h(
        Box,
        { flexDirection: "column", key: cluster },
        h(
          Text,
          { color: theme.deep_blue, bold: true },
          `◆ ${cluster}`,
          h(Text, { color: theme.ink }, `  (${nodes.length})`),
        ),
        ...nodes.map((n) => {
          const selected = n.id === selectedId;
          const isFlagged = flagged.has(n.id);
          const isRejected = rejected.has(n.id);
          return h(
            Text,
            { key: n.id, color: n.colour ? theme[n.colour] : undefined },
            h(
              Text,
              { color: theme.terracotta, bold: true },
              selected ? "› " : "  ",
            ),
            h(Text, null, `${n.ui.graphSymbol} `),
            h(
              Text,
              { bold: selected, strikethrough: isRejected },
              `${n.id} ${n.label}`,
            ),
            isFlagged ? h(Text, { color: theme.slate }, " ⊙") : null,
          );
        }),
      );
    }),
  );
}
