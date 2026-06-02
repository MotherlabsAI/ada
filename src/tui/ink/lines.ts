/**
 * Pure line-builders for the TUI. The workbench renders ONE pane at a time as a
 * flat list of single-row lines, then windows that list to the terminal viewport —
 * so total output never exceeds the screen and Ink can update in place (no frame
 * stacking). Keeping this logic pure makes the viewport math testable without a TTY.
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

/** The graph as a flat, windowable line list. `selectedLine` is its row index. */
export function graphLines(
  graph: Graph,
  opts: { selectedId?: string; flagged: Set<string>; rejected?: Set<string> },
): { lines: Line[]; selectedLine: number } {
  const rejected = opts.rejected ?? new Set<string>();
  const clusters = [...new Set(graph.nodes.map((n) => clusterOf(n.id)))];
  const lines: Line[] = [];
  let selectedLine = 0;
  for (const cluster of clusters) {
    const inCluster = graph.nodes.filter((n) => clusterOf(n.id) === cluster);
    lines.push({
      text: `◆ ${cluster}  (${inCluster.length})`,
      colour: "deep_blue",
      bold: true,
    });
    for (const n of inCluster) {
      const sel = n.id === opts.selectedId;
      if (sel) selectedLine = lines.length;
      const mark = sel ? "› " : "  ";
      const flag = opts.flagged.has(n.id) ? " ⊙" : "";
      const rej = rejected.has(n.id) ? " ✗" : "";
      lines.push({
        text: `${mark}${n.ui.graphSymbol} ${n.id}  ${n.label}${flag}${rej}`,
        colour: n.colour,
        bold: sel,
        dim: rejected.has(n.id),
      });
    }
  }
  return { lines, selectedLine };
}

/** The node capsule as wrapped lines, ready to window+scroll. */
export function readerLines(node: NodeCapsule, width: number): Line[] {
  const c = node.checkability;
  const wl = node.worldLinks;
  const lines: Line[] = [];
  const push = (
    text: string,
    colour?: Colour,
    opts?: { bold?: boolean; dim?: boolean },
  ) => lines.push({ text, colour, ...(opts ?? {}) });
  const block = (text: string, colour?: Colour, opts?: { dim?: boolean }) => {
    for (const l of wrap(text, width)) push(l, colour, opts);
  };

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

  const linkRows: Array<[string, string[]]> = [
    ["parents", wl.parents],
    ["children", wl.children],
    ["siblings", wl.siblings],
    ["depends on", wl.dependsOn],
    ["exports to", wl.exportsTo],
    ["guarded by", wl.guardedBy],
  ];
  const present = linkRows.filter(([, ids]) => ids.length);
  if (present.length) {
    push("");
    for (const [label, ids] of present)
      block(`↔ ${label}: ${ids.join(", ")}`, undefined, { dim: true });
  }
  return lines;
}
