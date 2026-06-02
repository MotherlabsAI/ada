/** Terminal navigator over a pack (spec §10). Readline-based for P0 (DECISION D5). */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import type { Graph, NodeCapsule, PackManifest } from "../core/types.js";
import { paint, bold, dim, TRUTH_GLYPH, CHECK_LABEL } from "../core/grammar.js";
import { clusterOf } from "../core/ids.js";
import { paths } from "../pack/layout.js";

interface Loaded {
  graph: Graph;
  manifest: PackManifest;
  stateFile: string;
}

interface PackState {
  flagged: string[];
  rejected: string[];
  lastNode?: string;
}

export function loadPack(cwd: string, slug: string): Loaded {
  const p = paths(cwd, slug);
  if (!existsSync(p.graphJson)) {
    throw new Error(
      `No pack "${slug}". Run \`ada compile\` first (looked in ${p.graphJson}).`,
    );
  }
  const graph = JSON.parse(readFileSync(p.graphJson, "utf8")) as Graph;
  const manifest = JSON.parse(readFileSync(p.manifest, "utf8")) as PackManifest;
  return { graph, manifest, stateFile: join(p.root, ".state.json") };
}

function readState(stateFile: string): PackState {
  if (!existsSync(stateFile)) return { flagged: [], rejected: [] };
  try {
    return JSON.parse(readFileSync(stateFile, "utf8")) as PackState;
  } catch {
    return { flagged: [], rejected: [] };
  }
}

function writeState(stateFile: string, state: PackState): void {
  writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n", "utf8");
}

export function header(manifest: PackManifest): string {
  const bar = "─".repeat(2);
  return (
    paint("◈ Ada", "terracotta") +
    dim(` / ${manifest.slug} ${bar} `) +
    `nodes ${bold(String(manifest.nodeCount))} · ` +
    `C ${paint(String(manifest.checkCount), "green")} · ` +
    `residue ${paint(String(manifest.residueCount), "amber")} · ` +
    `clusters ${manifest.clusters.length}`
  );
}

function nodeLine(n: NodeCapsule, flagged: boolean): string {
  const mark = flagged ? paint(" ⊙", "slate") : "";
  return `  ${paint(n.ui.graphSymbol, n.colour)} ${dim(n.id)} ${n.label}${mark}`;
}

export function renderTree(graph: Graph, state: PackState): string {
  const lines: string[] = [];
  for (const cluster of [...new Set(graph.nodes.map((n) => clusterOf(n.id)))]) {
    const nodes = graph.nodes.filter((n) => clusterOf(n.id) === cluster);
    lines.push("");
    lines.push(paint(`◆ ${cluster}`, "deep_blue") + dim(`  (${nodes.length})`));
    for (const n of nodes)
      lines.push(nodeLine(n, state.flagged.includes(n.id)));
  }
  return lines.join("\n");
}

export function renderNode(graph: Graph, node: NodeCapsule): string {
  const c = node.checkability;
  const wl = node.worldLinks;
  const link = (label: string, ids: string[]) =>
    ids.length ? `  ${dim(label + ":")} ${ids.join(", ")}` : "";
  const lines = [
    paint(`${node.ui.graphSymbol} ${node.id}`, node.colour) +
      "  " +
      bold(node.label),
    dim(
      `  ${node.role.cluster} · ${node.depth} · ${TRUTH_GLYPH[node.truth]} ${node.truth} · ${c.class} ${CHECK_LABEL[c.class]}`,
    ),
    "",
    "  " + paint("⟡ ", "terracotta") + node.localContext.summary,
    "  " + dim("∴ ") + node.localContext.whyItMatters,
    "  " + paint("! ", "rose") + dim(node.localContext.failureIfMissing),
    "",
    "  " +
      paint("⊢ compiles to: ", "slate") +
      node.role.compileTargets.join(", "),
  ];
  if (c.candidates.length) {
    lines.push(
      "  " + paint("κ candidates: ", "green") + c.candidates.join(", "),
    );
  }
  if (node.epistemics.unknowns.length) {
    lines.push(
      "  " +
        paint("Ω unknowns: ", "amber") +
        node.epistemics.unknowns.join("; "),
    );
  }
  lines.push("");
  for (const l of [
    link("parents", wl.parents),
    link("children", wl.children),
    link("siblings", wl.siblings),
    link("depends on", wl.dependsOn),
    link("exports to", wl.exportsTo),
    link("guarded by", wl.guardedBy),
  ]) {
    if (l) lines.push(l);
  }
  return lines.join("\n");
}

export function flagNode(cwd: string, slug: string, nodeId: string): string {
  const { graph, stateFile } = loadPack(cwd, slug);
  if (!graph.nodes.some((n) => n.id === nodeId)) {
    throw new Error(`No node ${nodeId} in pack ${slug}.`);
  }
  const state = readState(stateFile);
  if (!state.flagged.includes(nodeId)) state.flagged.push(nodeId);
  writeState(stateFile, state);
  return `⊙ flagged ${nodeId} (${state.flagged.length} flagged)`;
}

/** Static render: a node if given, else the whole tree. Used in non-TTY / scripted mode. */
export function renderStatic(
  cwd: string,
  slug: string,
  nodeId?: string,
): string {
  const { graph, manifest, stateFile } = loadPack(cwd, slug);
  const state = readState(stateFile);
  if (nodeId) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`No node ${nodeId} in pack ${slug}.`);
    return header(manifest) + "\n\n" + renderNode(graph, node);
  }
  return header(manifest) + "\n" + renderTree(graph, state);
}

export async function interactive(cwd: string, slug: string): Promise<void> {
  const { graph, manifest, stateFile } = loadPack(cwd, slug);
  const state = readState(stateFile);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const out = (s: string) => process.stdout.write(s + "\n");

  out(header(manifest));
  out(renderTree(graph, state));
  out(
    dim(
      "\ncommands: <ID> open · f <ID> flag · / <text> search · t tree · q quit",
    ),
  );

  try {
    for (;;) {
      let raw: string;
      try {
        raw = (await rl.question(paint("\nada ⌘ ", "cyan"))).trim();
      } catch {
        break; // Ctrl-D / EOF / closed stream → quit cleanly
      }
      if (!raw) continue;
      if (raw === "q" || raw === "quit") break;
      if (raw === "t" || raw === "tree") {
        out(renderTree(graph, state));
        continue;
      }
      if (raw.startsWith("/")) {
        const q = raw.slice(1).trim().toLowerCase();
        const hits = graph.nodes.filter(
          (n) =>
            n.id.toLowerCase().includes(q) ||
            n.label.toLowerCase().includes(q) ||
            n.localContext.summary.toLowerCase().includes(q),
        );
        out(
          hits.length
            ? hits
                .map((n) => nodeLine(n, state.flagged.includes(n.id)))
                .join("\n")
            : dim("  no matches"),
        );
        continue;
      }
      if (raw.startsWith("f ")) {
        const id = raw.slice(2).trim();
        const node = graph.nodes.find((n) => n.id === id);
        if (!node) {
          out(dim("  no such node"));
          continue;
        }
        if (!state.flagged.includes(id)) state.flagged.push(id);
        writeState(stateFile, state);
        out(paint(`  ⊙ flagged ${id}`, "slate"));
        continue;
      }
      const node = graph.nodes.find(
        (n) => n.id.toLowerCase() === raw.toLowerCase(),
      );
      if (node) {
        state.lastNode = node.id;
        writeState(stateFile, state);
        out("\n" + renderNode(graph, node));
      } else {
        out(
          dim("  unknown command — type an ID, 'f <ID>', '/text', 't', or 'q'"),
        );
      }
    }
  } finally {
    rl.close();
  }
}

export function resume(cwd: string, slug: string): string {
  const { graph, manifest, stateFile } = loadPack(cwd, slug);
  const state = readState(stateFile);
  const lines = [header(manifest), ""];
  lines.push(
    state.flagged.length
      ? paint(`⊙ flagged (${state.flagged.length}): `, "slate") +
          state.flagged.join(", ")
      : dim("no flagged nodes yet"),
  );
  if (state.lastNode) lines.push(dim(`last opened: ${state.lastNode}`));
  return lines.join("\n");
}
