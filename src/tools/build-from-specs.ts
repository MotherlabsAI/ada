#!/usr/bin/env node
/**
 * Driver: turn excavated node specs (workforce output JSON) into a real pack on disk.
 *   node dist/tools/build-from-specs.js <specs.json> <slug> ["intent override"]
 * The JSON may be either { intent, nodes: [...] } or a bare array of node specs.
 */
import { readFileSync } from "node:fs";
import { assemblePack, type NodeSpec } from "../compile/assemble.js";
import { writePack } from "../pack/writer.js";
import { paths } from "../pack/layout.js";
import { paint, bold, dim } from "../core/grammar.js";

const [specsPath, slug, intentArg] = process.argv.slice(2);
if (!specsPath || !slug) {
  console.error("usage: build-from-specs <specs.json> <slug> [intent]");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(specsPath, "utf8")) as
  | { intent?: string; nodes: NodeSpec[] }
  | NodeSpec[];
const specs: NodeSpec[] = Array.isArray(raw) ? raw : raw.nodes;
const intent =
  intentArg ?? (Array.isArray(raw) ? "" : (raw.intent ?? "")) ?? "";

const cwd = process.cwd();
const model = assemblePack(slug, intent, specs);
const manifest = await writePack(cwd, model);
const p = paths(cwd, slug);

// Highest-priority node = the one the user opens first (the impress-or-die node).
const first =
  model.graph.nodes.find(
    (n) => n.id !== "ROOT.000" && n.ui.openPriority === "high",
  ) ?? model.graph.nodes[1];

console.log(paint("◈ compiled", "terracotta") + dim(`  ${p.root}`));
console.log(
  `  ${bold(String(manifest.nodeCount))} nodes · ${bold(String(manifest.edgeCount))} edges · ` +
    `${paint(String(manifest.checkCount) + " checks", "green")} · clusters: ${dim(manifest.clusters.join(", "))}`,
);
if (first) {
  console.log(
    "  " +
      paint("open first", "deep_blue") +
      dim(`   node dist/cli.js open ${slug} ${first.id}`),
  );
}
