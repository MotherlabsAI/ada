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

/** The (already-filtered) node list as a windowable cluster→node tree. */
export function graphLines(
  nodes: NodeCapsule[],
  opts: { selectedId?: string; flagged: Set<string>; rejected?: Set<string> },
): { lines: Line[]; selectedLine: number } {
  const rejected = opts.rejected ?? new Set<string>();
  const clusters = [...new Set(nodes.map((n) => clusterOf(n.id)))];
  const idW = Math.max(4, ...nodes.map((n) => n.id.length), 4) + 2;
  const lines: Line[] = [];
  let selectedLine = 0;
  for (const cluster of clusters) {
    const inCluster = nodes.filter((n) => clusterOf(n.id) === cluster);
    lines.push({
      text: `◆ ${cluster}  (${inCluster.length})`,
      colour: "deep_blue",
      bold: true,
    });
    for (const n of inCluster) {
      const sel = n.id === opts.selectedId;
      if (sel) selectedLine = lines.length;
      const mark = sel ? "›" : " ";
      const flag = opts.flagged.has(n.id) ? " ⊙" : "";
      const rej = rejected.has(n.id) ? " ✗" : "";
      lines.push({
        text: `${mark} ${n.glyph}  ${n.id.padEnd(idW)}${n.label}${flag}${rej}`,
        colour: n.colour,
        bold: sel,
        dim: rejected.has(n.id),
      });
    }
  }
  return { lines, selectedLine };
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
