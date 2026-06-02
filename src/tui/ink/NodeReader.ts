/**
 * NodeReader — the capsule view (right region). Mirrors the readline `renderNode()`
 * (src/tui/navigator.ts) as an Ink column: leads with the summary (the
 * impress-or-die content), then the badge row, ⊢ compiles-to, κ candidates,
 * Ω unknowns, and ↔ world links.
 */
import { createElement as h } from "react";
import { Box, Text } from "ink";
import type { NodeCapsule } from "../../core/types.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../../core/grammar.js";
import { theme } from "./theme.js";

export interface NodeReaderProps {
  node: NodeCapsule;
}

function linkRow(label: string, ids: string[]) {
  if (!ids.length) return null;
  return h(
    Text,
    { key: label },
    h(Text, { color: theme.ink }, `  ↔ ${label}: `),
    ids.join(", "),
  );
}

export function NodeReader(props: NodeReaderProps) {
  const node = props.node;
  const c = node.checkability;
  const wl = node.worldLinks;
  const tint = node.colour ? theme[node.colour] : undefined;

  const rows = [
    // identity
    h(
      Text,
      { key: "id" },
      h(Text, { color: tint, bold: true }, `${node.ui.graphSymbol} ${node.id}`),
      h(Text, { bold: true }, `  ${node.label}`),
    ),
    // badge line
    h(
      Text,
      { key: "badges", color: theme.ink },
      `  ${node.role.cluster} · ${node.depth} · ${TRUTH_GLYPH[node.truth]} ${node.truth} · ${c.class} ${CHECK_LABEL[c.class]}`,
    ),
    h(Text, { key: "gap1" }, " "),
    // summary — lead with the impress-or-die content
    h(
      Text,
      { key: "summary" },
      h(Text, { color: theme.terracotta }, "  ⟡ "),
      h(Text, { color: tint }, node.localContext.summary),
    ),
    h(
      Text,
      { key: "why", color: theme.ink },
      `  ∴ ${node.localContext.whyItMatters}`,
    ),
    h(
      Text,
      { key: "fail" },
      h(Text, { color: theme.rose }, "  ! "),
      h(Text, { color: theme.ink }, node.localContext.failureIfMissing),
    ),
    h(Text, { key: "gap2" }, " "),
    // compiles-to
    h(
      Text,
      { key: "compiles" },
      h(Text, { color: theme.slate }, "  ⊢ compiles to: "),
      node.role.compileTargets.join(", "),
    ),
  ];

  if (c.candidates.length) {
    rows.push(
      h(
        Text,
        { key: "cand" },
        h(Text, { color: theme.green }, "  κ candidates: "),
        c.candidates.join(", "),
      ),
    );
  }
  if (node.epistemics.unknowns.length) {
    rows.push(
      h(
        Text,
        { key: "unknown" },
        h(Text, { color: theme.amber }, "  Ω unknowns: "),
        node.epistemics.unknowns.join("; "),
      ),
    );
  }

  const links = [
    linkRow("parents", wl.parents),
    linkRow("children", wl.children),
    linkRow("siblings", wl.siblings),
    linkRow("depends on", wl.dependsOn),
    linkRow("exports to", wl.exportsTo),
    linkRow("guarded by", wl.guardedBy),
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  if (links.length) {
    rows.push(h(Text, { key: "gap3" }, " "));
    rows.push(...links);
  }

  return h(Box, { flexDirection: "column" }, ...rows);
}
