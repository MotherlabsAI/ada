/**
 * Pure line-builders + navigation helpers for the TUI. The workbench renders ONE pane
 * at a time as a flat list of single-row lines, windowed to the terminal viewport — so
 * output never exceeds the screen and Ink updates in place. Pure logic (filter match,
 * link resolution, breadcrumb, windowing) is unit-tested; render is reasoned (no TTY).
 */
import type { Graph, NodeCapsule, Colour } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../../core/grammar.js";

export interface Line {
  text: string;
  colour?: Colour;
  bold?: boolean;
  dim?: boolean;
}

/** A followable edge from a node to another node that exists in the graph. */
export interface LinkTarget {
  kind: string;
  id: string;
  label: string;
}

/** Wrap text to a max width on word boundaries (never returns zero lines). */
export function wrap(text: string, width: number): string[] {
  const w = Math.max(8, width);
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= w) line += " " + word;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

/** Slice `items` to `height`, keeping index `focus` visible (centered when scrolling). */
export function windowSlice<T>(
  items: T[],
  focus: number,
  height: number,
): { slice: T[]; start: number } {
  if (height <= 0 || items.length <= height) return { slice: items, start: 0 };
  let start = focus - Math.floor(height / 2);
  start = Math.max(0, Math.min(start, items.length - height));
  return { slice: items.slice(start, start + height), start };
}

/** Live filter: case-insensitive substring over id + label + summary. */
export function matchNode(node: NodeCapsule, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${node.id} ${node.label} ${node.localContext.summary}`
    .toLowerCase()
    .includes(q);
}

/** The edges from `node` that land on a node present in the graph (followable). */
export function resolvableLinks(node: NodeCapsule, graph: Graph): LinkTarget[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const out: LinkTarget[] = [];
  const add = (kind: string, ids: string[]) => {
    for (const id of ids) {
      const t = byId.get(id);
      if (t) out.push({ kind, id, label: t.label });
    }
  };
  const wl = node.worldLinks;
  add("parent", wl.parents);
  add("child", wl.children);
  add("sibling", wl.siblings);
  add("depends", wl.dependsOn);
  add("guarded", wl.guardedBy);
  return out;
}

/** "A ▸ B ▸ current" from the visited trail (last entry is the current node). */
export function breadcrumb(trail: string[]): string {
  const tail = trail.slice(-4);
  return (trail.length > 4 ? "… ▸ " : "") + tail.join(" ▸ ");
}

/** Colour = which area: each cluster gets its own stable colour from the palette. */
const CLUSTER_PALETTE: Colour[] = [
  "plum",
  "terracotta",
  "cyan",
  "sage",
  "amber",
  "green",
  "slate",
  "clay",
  "deep_blue",
  "rose",
];
export function clusterColour(clusters: string[], cluster: string): Colour {
  const i = clusters.indexOf(cluster);
  return CLUSTER_PALETTE[(i < 0 ? 0 : i) % CLUSTER_PALETTE.length]!;
}

/** Human names for area codes — nobody should guess "ATT" from thin air. */
const CLUSTER_LABELS: Record<string, string> = {
  ROOT: "Context root",
  ATT: "Attention",
  COPY: "Copy & language",
  SEO: "Discovery — SEO & AI",
  UNK: "Unknown-unknowns",
  L2C: "Language → Code",
  DOMAIN: "Domain entities",
  WORKFLOW: "Workflows",
  DATA: "Data model",
  CHECK: "Checks (C)",
  BLUEPRINT: "Blueprint",
  CLAUDE: "Claude export",
};
export function clusterLabel(code: string): string {
  return CLUSTER_LABELS[code] ?? code;
}

/** A selectable row in the folder-tree: a cluster header or a node under an open cluster. */
export interface TreeRow extends Line {
  kind: "cluster" | "node";
  ref: string; // cluster name or node id
}

/**
 * The graph as a folder-tree with connector lines. Areas (clusters) carry a filled
 * dot in their own colour; open areas show their nodes with `├─ / └─` connectors and a
 * hollow dot in the same colour. `selectedRef` (a cluster name or node id) is the cursor.
 */
export function graphTree(
  nodes: NodeCapsule[],
  opts: {
    selectedRef?: string;
    open: Set<string>;
    flagged: Set<string>;
    rejected?: Set<string>;
  },
): { rows: TreeRow[]; selectedLine: number } {
  const rejected = opts.rejected ?? new Set<string>();
  const clusters = [...new Set(nodes.map((n) => clusterOf(n.id)))];
  const idW = Math.max(4, ...nodes.map((n) => n.id.length), 4) + 1;
  const rows: TreeRow[] = [];
  let selectedLine = 0;
  for (const cluster of clusters) {
    const inCluster = nodes.filter((n) => clusterOf(n.id) === cluster);
    const colour = clusterColour(clusters, cluster);
    const isOpen = opts.open.has(cluster);
    const sel = opts.selectedRef === cluster;
    if (sel) selectedLine = rows.length;
    rows.push({
      kind: "cluster",
      ref: cluster,
      text: `${sel ? "›" : " "} ${isOpen ? "▾" : "▸"} ● ${clusterLabel(cluster)}  (${inCluster.length})`,
      colour,
      bold: true,
    });
    if (isOpen) {
      inCluster.forEach((n, i) => {
        const last = i === inCluster.length - 1;
        const nsel = opts.selectedRef === n.id;
        if (nsel) selectedLine = rows.length;
        const conn = last ? "└─" : "├─";
        const flag = opts.flagged.has(n.id) ? " ⊙" : "";
        const rej = rejected.has(n.id) ? " ✗" : "";
        rows.push({
          kind: "node",
          ref: n.id,
          text: `${nsel ? "›" : " "}  ${conn} ◦ ${n.id.padEnd(idW)}${n.label}${flag}${rej}`,
          colour,
          bold: nsel,
          dim: rejected.has(n.id),
        });
      });
    }
  }
  return { rows, selectedLine };
}

export interface ReaderOpts {
  crumb?: string;
  links?: LinkTarget[];
  linkIndex?: number;
}

/** The node capsule as wrapped lines: breadcrumb, capsule, then the followable links. */
export function readerLines(
  node: NodeCapsule,
  width: number,
  opts: ReaderOpts = {},
): Line[] {
  const c = node.checkability;
  const lines: Line[] = [];
  const push = (
    text: string,
    colour?: Colour,
    o?: { bold?: boolean; dim?: boolean },
  ) => lines.push({ text, colour, ...(o ?? {}) });
  const block = (text: string, colour?: Colour, o?: { dim?: boolean }) => {
    for (const l of wrap(text, width)) push(l, colour, o);
  };

  if (opts.crumb) {
    push(opts.crumb, undefined, { dim: true });
    push("");
  }
  push(`${node.ui.graphSymbol} ${node.id}  ${node.label}`, node.colour, {
    bold: true,
  });
  push(
    `${node.role.cluster} · ${node.depth} · ${TRUTH_GLYPH[node.truth]} ${node.truth} · ${c.class} ${CHECK_LABEL[c.class]}`,
    undefined,
    { dim: true },
  );
  push("");
  block(`⟡ ${node.localContext.summary}`, node.colour);
  push("");
  block(`∴ ${node.localContext.whyItMatters}`, undefined, { dim: true });
  push("");
  block(`! ${node.localContext.failureIfMissing}`, "rose");
  push("");
  block(`⊢ compiles to: ${node.role.compileTargets.join(", ")}`, "slate");
  if (c.candidates.length)
    block(`κ candidates: ${c.candidates.join(", ")}`, "green");
  if (node.epistemics.unknowns.length)
    block(`Ω unknowns: ${node.epistemics.unknowns.join("; ")}`, "amber");

  const links = opts.links ?? [];
  if (links.length) {
    push("");
    push("↔ links  (Tab cycle · ⏎ follow)", undefined, { dim: true });
    links.forEach((l, i) => {
      const hot = i === (opts.linkIndex ?? -1);
      push(
        `${hot ? "›" : " "} ${l.kind.padEnd(8)} ${l.id}  ${l.label}`,
        hot ? "cyan" : undefined,
        { bold: hot, dim: !hot },
      );
    });
  }
  return lines;
}
