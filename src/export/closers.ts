/**
 * The MVP-21 CLOSERS projection ("compile the family", lane A — the last four).
 *
 * Closes the remaining named-file gaps in the export taxonomy's minimum-viable set: INTENT.md and
 * SCOPE.md (the intent kernel + boundary as separately-addressable files), schema_graph_tree.md (the
 * ROOT→cluster→node hierarchy as human-readable tree), and memory_write.json (a proposed, evidence-
 * gated memory update). All pure projections of the seed + typed graph — deterministic, model-free (A3).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";
import { clusterOf } from "../core/ids.js";

function intentMd(model: PackModel): ExportFile {
  const s = model.seed;
  return {
    path: "INTENT.md",
    content: [
      `# Intent — ${model.slug}`,
      "",
      "> The compiled intent kernel, separately addressable (export taxonomy §02).",
      "",
      `- **goal:** ${s.rootIntent}`,
      `- **domain:** ${s.domain}`,
      `- **desired_state:** ${s.buildObjective}`,
      `- **success (trust):** ${s.trustObjective}`,
      `- **known going in:** ${s.knownContext?.length ? s.knownContext.join("; ") : "_(none)_"}`,
      `- **open at intake:** ${s.unknownContext?.length ? s.unknownContext.join("; ") : "_(none)_"}`,
      "",
    ].join("\n"),
  };
}

function scopeMd(model: PackModel): ExportFile {
  const s = model.seed;
  const clusters = [...new Set(model.graph.nodes.map((n) => clusterOf(n.id)))];
  return {
    path: "SCOPE.md",
    content: [
      `# Scope — ${model.slug}`,
      "",
      "> Boundaries: what this compile covers, what it excludes, and who holds authority (§03).",
      "",
      "## in scope",
      `- domain: ${s.domain}`,
      `- areas: ${clusters.join(", ")}`,
      "## constraints (hard boundaries)",
      s.constraints?.length
        ? s.constraints.map((c) => `- ${c}`).join("\n")
        : "_(none stated)_",
      "## out of scope / still open (do not act past these)",
      s.unknownContext?.length
        ? s.unknownContext.map((u) => `- ${u}`).join("\n")
        : "_(none)_",
      "## authority",
      "- Execution authority defers to `AUTONOMY_CONTRACT.md` (A1 floor; raising it is a human gate, A4).",
      "",
    ].join("\n"),
  };
}

function schemaGraphTree(model: PackModel): ExportFile {
  // ROOT → cluster → node, deterministic by cluster order of first appearance then node id.
  const byCluster = new Map<string, NodeCapsule[]>();
  for (const n of model.graph.nodes) {
    const c = clusterOf(n.id);
    (byCluster.get(c) ?? byCluster.set(c, []).get(c)!).push(n);
  }
  const lines = [`# schema graph tree — ${model.slug}`, "", "```", model.slug];
  for (const [cluster, nodes] of byCluster) {
    lines.push(`├── ${cluster}`);
    for (const n of nodes) lines.push(`│   ├── ${n.id}  ${n.label}`);
  }
  lines.push("```", "");
  return { path: "schema_graph_tree.md", content: lines.join("\n") };
}

function memoryWrite(model: PackModel): ExportFile {
  const proposed = model.graph.nodes
    .filter((n) => n.semanticType === "Memory")
    .map((n) => n.id);
  // Deterministic, timestamp-free (INVARIANT.003): a proposed write, NOT an accepted one — the
  // verifier admits it against the evidence ledger per MEMORY_POLICY.md. Compile-time provenance only.
  const obj = {
    slug: model.slug,
    source: "ada-compile",
    proposed,
    gate: "evidence-gated",
    policy: "MEMORY_POLICY.md",
    status: "candidate",
  };
  return {
    path: "memory_write.json",
    content: JSON.stringify(obj, null, 2) + "\n",
  };
}

/** Project the last four MVP-21 named files from the seed + graph. */
export function projectMvpClosers(model: PackModel): ExportFile[] {
  return [
    intentMd(model),
    scopeMd(model),
    schemaGraphTree(model),
    memoryWrite(model),
  ];
}
