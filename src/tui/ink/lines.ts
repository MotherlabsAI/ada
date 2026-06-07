/**
 * Pure line-builders + navigation helpers for the TUI. The workbench renders ONE pane
 * at a time as a flat list of single-row lines, windowed to the terminal viewport — so
 * output never exceeds the screen and Ink updates in place. Pure logic (filter match,
 * link resolution, breadcrumb, windowing) is unit-tested; render is reasoned (no TTY).
 */
import type { Graph, NodeCapsule, Colour } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../../core/grammar.js";

/** A coloured span within a row (so colour can land on just the dot/name, not the whole row). */
export interface Seg {
  text: string;
  colour?: Colour;
  bold?: boolean;
  dim?: boolean;
}

export interface Line {
  /** Concatenated text — used for tests + the single-colour fallback. */
  text: string;
  colour?: Colour;
  bold?: boolean;
  dim?: boolean;
  /** Multi-colour spans; when present, the renderer draws these instead of `text`. */
  segments?: Seg[];
  /** Background hex for the cursor row → a dark area-tinted bar (no full inverse). */
  bgHex?: string;
}

/** Darken a hex colour toward black by `f` (0..1) — for the cursor's area-tinted bar. */
export function darken(hex: string, f: number): string {
  const m = hex.replace("#", "");
  const r = Math.round(parseInt(m.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(m.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(m.slice(4, 6), 16) * f);
  const hx = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
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

/**
 * Colour = which area: each cluster gets a stable hue. Ordered EARTH-FIRST so the
 * common case (≤7 clusters) stays inside the tree family — clay/amber/sage/terracotta/
 * slate/green/deep_blue — with adjacent areas kept distinct. The cooler hues sit at the
 * tail for large graphs only. The hue rides the small ● dot, never the whole label, so
 * a many-cluster tree reads calm, not rainbow (structure_before_color).
 */
const CLUSTER_PALETTE: Colour[] = [
  "clay",
  "amber",
  "sage",
  "terracotta",
  "slate",
  "green",
  "deep_blue",
  "rose",
  "cyan",
  "plum",
];

/** The cursor bar — a calm neutral bark, NOT the cluster hue darkened (that read purple). */
const CURSOR_BG = "#2E2014";
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
/**
 * Resolve an area code to a human label. Domain-adaptive (P7): the pack's PROPOSED
 * `code→label` registry is consulted FIRST (so a non-marketing pack shows its own areas,
 * e.g. ARCH→"Architecture"), then the built-in map for the known structural codes, then the
 * raw code. This is the ONLY behaviour change for the TUI — where the label string comes
 * from; layout, colours, and interaction are untouched (the registry is carried as data).
 */
export function clusterLabel(
  code: string,
  registry?: Record<string, string>,
): string {
  return registry?.[code] ?? CLUSTER_LABELS[code] ?? code;
}

/**
 * The R1 scan readout: split nodes by what VERIFICATION they need, so a single glance at the
 * tree header tells you what you must look at. checkable (C3–C5) = trust without reading;
 * gated (C0–C2) = your eyes (A4); residue (Ω, truth="residue") = open gaps. Pure.
 */
export function verifyTally(nodes: NodeCapsule[]): {
  checkable: number;
  gated: number;
  residue: number;
} {
  let checkable = 0;
  let gated = 0;
  let residue = 0;
  for (const n of nodes) {
    const c = n.checkability.class;
    if (c === "C3" || c === "C4" || c === "C5") checkable++;
    else gated++;
    if (n.truth === "residue") residue++;
  }
  return { checkable, gated, residue };
}

/**
 * The per-node verification mark — the single-glyph version of verifyTally, so the tree
 * shows R1 state on EVERY row (the tree IS the verification surface). Priority: an open
 * gap (Ω residue) dominates; else trust-without-reading (✓ checkable, C3–C5); else your
 * eyes (⊙ gated, C0–C2). Colour is redundant with the glyph (AESTH.005 / NO_COLOR-safe).
 */
export function verifyGlyph(node: NodeCapsule): {
  glyph: string;
  colour: Colour;
} {
  if (node.truth === "residue") return { glyph: "Ω", colour: "amber" };
  const c = node.checkability.class;
  if (c === "C3" || c === "C4" || c === "C5")
    return { glyph: "✓", colour: "green" };
  return { glyph: "⊙", colour: "clay" };
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
    width?: number;
    /** Proposed code→label registry (P7); consulted before the built-in map. */
    clusterLabels?: Record<string, string>;
  },
): { rows: TreeRow[]; selectedLine: number } {
  const rejected = opts.rejected ?? new Set<string>();
  const width = opts.width ?? 80;
  const clusters = [...new Set(nodes.map((n) => clusterOf(n.id)))];
  const idW = Math.max(4, ...nodes.map((n) => n.id.length), 4) + 1;
  const rows: TreeRow[] = [];
  let selectedLine = 0;

  // Compose a row from coloured spans. `text` is the concatenation (tests + fallback);
  // the cursor row gets a dark area-tinted bar (bgHex), padded to width so it spans.
  const makeRow = (
    kind: "cluster" | "node",
    ref: string,
    segs: Seg[],
    sel: boolean,
  ): TreeRow => {
    let text = segs.map((s) => s.text).join("");
    const segments = [...segs];
    if (sel) {
      const pad = Math.max(0, width - text.length);
      if (pad > 0) {
        segments.push({ text: " ".repeat(pad) });
        text += " ".repeat(pad);
      }
    }
    return {
      kind,
      ref,
      text,
      segments,
      ...(sel ? { bgHex: CURSOR_BG } : {}),
    };
  };

  // Align the roll-up column: pad every cluster label to the widest, so the (N)
  // count and the ✓/⊙/Ω roll-up line up vertically across rows. A roll-up that
  // drifts row-to-row reads as ambiguity; a fixed column reads as one structure.
  const labelW = Math.max(
    0,
    ...clusters.map((c) => clusterLabel(c, opts.clusterLabels).length),
  );

  for (const cluster of clusters) {
    const inCluster = nodes.filter((n) => clusterOf(n.id) === cluster);
    const colour = clusterColour(clusters, cluster);
    const isOpen = opts.open.has(cluster);
    const sel = opts.selectedRef === cluster;
    if (sel) selectedLine = rows.length;
    // Per-area verification roll-up — so a CLOSED area still tells you its posture
    // (what's settled vs what needs your eyes vs what's open) without opening it.
    const t = verifyTally(inCluster);
    const rollup: Seg[] = [];
    if (t.checkable) rollup.push({ text: `✓${t.checkable} `, colour: "green" });
    if (t.gated) rollup.push({ text: `⊙${t.gated} `, colour: "clay" });
    if (t.residue) rollup.push({ text: `Ω${t.residue}`, colour: "amber" });
    rows.push(
      makeRow(
        "cluster",
        cluster,
        [
          { text: sel ? "❯ " : "  ", bold: true },
          { text: isOpen ? "▾ " : "▸ ", dim: true },
          { text: "● ", colour }, // the hue rides ONLY the dot
          {
            text: clusterLabel(cluster, opts.clusterLabels).padEnd(labelW),
            bold: true, // label stays cream — calm, not rainbow
          },
          { text: `  (${inCluster.length})`, dim: true },
          ...(rollup.length ? [{ text: "   ", dim: true }, ...rollup] : []),
        ],
        sel,
      ),
    );
    if (isOpen) {
      inCluster.forEach((n, i) => {
        const last = i === inCluster.length - 1;
        const nsel = opts.selectedRef === n.id;
        if (nsel) selectedLine = rows.length;
        const isRej = rejected.has(n.id);
        // R1 column: every node leads with its verification mark (✓ trust / ⊙ your eyes
        // / Ω open gap) so the tree IS the verification surface — scan the left stripe,
        // not the docs. Calm body: colour only the ◦ dot + that mark; id faint, label cream.
        const v = verifyGlyph(n);
        const segs: Seg[] = [
          { text: nsel ? "❯ " : "  ", bold: true },
          { text: `  ${last ? "└─" : "├─"} `, dim: true },
          { text: `${v.glyph} `, colour: v.colour },
          { text: "◦ ", colour },
          { text: n.id.padEnd(idW), dim: true },
          { text: n.label, dim: isRej },
        ];
        if (opts.flagged.has(n.id)) segs.push({ text: " ⚑", colour: "slate" });
        if (isRej) segs.push({ text: " ✗", colour: "rose" });
        rows.push(makeRow("node", n.id, segs, nsel));
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

/**
 * The opened node as a STRUCTURED inspector — not a wall. A fixed reading measure
 * (long lines hurt; cap ~84), quiet uppercase section labels carrying the structure,
 * bodies wrapped + indented under their label, lists as bullets. Colour rides the
 * LABEL only (structure_before_color); bodies stay calm cream/dim. Every line is ≤
 * the measure, so the reader never overflows the viewport.
 */
export function readerLines(
  node: NodeCapsule,
  width: number,
  opts: ReaderOpts = {},
): Line[] {
  const c = node.checkability;
  const measure = Math.min(width, 84);
  const lines: Line[] = [];
  const push = (
    text: string,
    colour?: Colour,
    o?: { bold?: boolean; dim?: boolean },
  ) => lines.push({ text, colour, ...(o ?? {}) });
  const gap = () => push("");
  /** A quiet section label — uppercase, dim, colour only as a light accent. */
  const label = (text: string, colour?: Colour) =>
    push(text, colour, { dim: !colour });
  /** Body text wrapped to the measure and indented 2 under its label. */
  const body = (text: string, colour?: Colour, o?: { dim?: boolean }) => {
    for (const l of wrap(text, measure - 2)) push("  " + l, colour, o);
  };
  /** A bullet with a hanging indent — continuation lines align under the text, not the •. */
  const bullet = (text: string, colour?: Colour) => {
    const ls = wrap(text, measure - 4);
    ls.forEach((l, i) => push((i === 0 ? "  • " : "    ") + l, colour));
  };

  // ── breadcrumb ──
  if (opts.crumb) {
    push(opts.crumb, undefined, { dim: true });
    gap();
  }

  // ── header: id (cluster colour) · label (bold, wrapped — never overflows) · meta ──
  push(`● ${node.id}`, node.colour, { bold: true });
  for (const l of wrap(node.label, measure)) push(l, undefined, { bold: true });
  push(
    `${node.role.cluster} · ${node.depth} · ${TRUTH_GLYPH[node.truth]} ${node.truth} · ${c.class} ${CHECK_LABEL[c.class]}`,
    undefined,
    { dim: true },
  );

  // ── sections — label carries the structure; body is calm ──
  gap();
  label("SUMMARY");
  body(node.localContext.summary);

  gap();
  label("WHY IT MATTERS");
  body(node.localContext.whyItMatters, undefined, { dim: true });

  gap();
  label("FAILURE IF MISSING", "rose"); // a real risk — the one place red belongs
  body(node.localContext.failureIfMissing);

  gap();
  label("COMPILES TO");
  body(node.role.compileTargets.join(" · "));

  if (c.candidates.length) {
    gap();
    label("CHECK CANDIDATES", "green");
    for (const cand of c.candidates) bullet(cand);
  }
  if (node.epistemics.unknowns.length) {
    gap();
    label("UNKNOWNS", "amber");
    for (const u of node.epistemics.unknowns) bullet(u);
  }

  const links = opts.links ?? [];
  if (links.length) {
    gap();
    label("LINKS  (Tab cycle · ⏎ follow)");
    links.forEach((l, i) => {
      const hot = i === (opts.linkIndex ?? -1);
      push(
        `  ${hot ? "›" : " "} ${l.kind.padEnd(8)} ${l.id}  ${l.label}`,
        hot ? "cyan" : undefined,
        { bold: hot, dim: !hot },
      );
    });
  }
  return lines;
}
