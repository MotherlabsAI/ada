/** Wiki projection (spec §9/§11). Deterministic markdown from the graph + seed. */
import type { Graph, NodeCapsule, Seed, WikiPage } from "../core/types.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../core/grammar.js";
import { clusterOf } from "../core/ids.js";

function byCluster(graph: Graph, cluster: string): NodeCapsule[] {
  return graph.nodes.filter((n) => clusterOf(n.id) === cluster);
}

function linkLine(label: string, ids: string[]): string {
  return ids.length ? `- **${label}:** ${ids.join(", ")}` : "";
}

/** Per-node readable article (spec §9). */
export function nodeWiki(node: NodeCapsule): string {
  const c = node.checkability;
  const lines: string[] = [
    `# ${node.ui.graphSymbol} ${node.id} — ${node.label}`,
    "",
    "## ⟡ Summary",
    node.localContext.summary,
    "",
    "## ∴ Why it matters",
    node.localContext.whyItMatters,
    "",
    "## ! Failure if missing",
    node.localContext.failureIfMissing,
    "",
    "## ∵ Evidence",
    `- Truth class: ${TRUTH_GLYPH[node.truth]} ${node.truth}`,
    `- Source status: ${node.epistemics.sourceStatus}`,
    ...node.epistemics.assumptions.map((a) => `- Assumption: ${a}`),
    "",
    "## ⊢ Compiles to",
    ...node.role.compileTargets.map((t) => `- ${t}`),
    "",
    "## κ Checkability",
    `Class **${c.class}** — ${CHECK_LABEL[c.class]}. ${c.explanation}`,
    ...(c.candidates.length
      ? ["", "Candidate checks:", ...c.candidates.map((x) => `- \`${x}\``)]
      : []),
  ];
  if (node.epistemics.unknowns.length) {
    lines.push("", "## Ω Residue / Unknowns");
    for (const u of node.epistemics.unknowns) lines.push(`- ${u}`);
  }
  lines.push("", "## ↔ Links");
  const wl = node.worldLinks;
  for (const l of [
    linkLine("Parents", wl.parents),
    linkLine("Children", wl.children),
    linkLine("Siblings", wl.siblings),
    linkLine("Depends on", wl.dependsOn),
    linkLine("Exports to", wl.exportsTo),
    linkLine("Guarded by", wl.guardedBy),
  ]) {
    if (l) lines.push(l);
  }
  lines.push("");
  return lines.join("\n");
}

export function projectWiki(graph: Graph, seed: Seed): WikiPage[] {
  const clusters = [...new Set(graph.nodes.map((n) => clusterOf(n.id)))];
  const highValue = graph.nodes
    .filter((n) => n.ui.openPriority === "high")
    .map(
      (n) =>
        `- ${n.ui.graphSymbol} **${n.id}** ${n.label} — ${n.localContext.summary}`,
    );

  const index: WikiPage = {
    slug: "index.md",
    title: "Pack Home",
    markdown: [
      `# ${seed.domain}`,
      "",
      `> ${seed.rootIntent}`,
      "",
      `**Build objective.** ${seed.buildObjective}`,
      "",
      `**Trust objective.** ${seed.trustObjective}`,
      "",
      `**Map.** ${graph.nodes.length} nodes · ${graph.edges.length} edges · clusters: ${clusters.join(", ")}.`,
      "",
      "## Start here (high-value nodes)",
      ...highValue,
      "",
      "## Sections",
      "- [Glossary](glossary.md)",
      "- [Data model](data-model.md)",
      "- [Workflows](workflows.md)",
      "- [C checks](c-checks.md)",
      "- [Open questions](open-questions.md)",
      "- [Risks](risks.md)",
      "",
    ].join("\n"),
  };

  const glossary: WikiPage = {
    slug: "glossary.md",
    title: "Domain Glossary",
    markdown: [
      "# Domain Glossary",
      "",
      ...byCluster(graph, "DOMAIN").map(
        (n) => `**${n.label}** — ${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const dataModel: WikiPage = {
    slug: "data-model.md",
    title: "Data Model",
    markdown: [
      "# Data Model",
      "",
      ...byCluster(graph, "DATA").map(
        (n) => `### ${n.id} — ${n.label}\n${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const workflows: WikiPage = {
    slug: "workflows.md",
    title: "Workflows",
    markdown: [
      "# Workflows",
      "",
      ...byCluster(graph, "WORKFLOW").map(
        (n) => `### ${n.id} — ${n.label}\n${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const cChecks: WikiPage = {
    slug: "c-checks.md",
    title: "C Checks",
    markdown: [
      "# C Checks",
      "",
      "Deterministic invariants (AXIOM A3 — no model inside a check).",
      "",
      ...byCluster(graph, "CHECK").map(
        (n) =>
          `- **${n.label}** [${n.checkability.class}] — ${n.localContext.summary}`,
      ),
      "",
    ].join("\n"),
  };

  const openQuestions: WikiPage = {
    slug: "open-questions.md",
    title: "Open Questions",
    markdown: [
      "# Open Questions (Residue)",
      "",
      "A hole is better than a lie (AXIOM A4). These are explicitly deferred, not guessed.",
      "",
      ...seed.unknownContext.map((u) => `- ${u}`),
      "",
    ].join("\n"),
  };

  const risks: WikiPage = {
    slug: "risks.md",
    title: "Risks",
    markdown: ["# Risks", "", ...seed.risks.map((r) => `- ${r}`), ""].join(
      "\n",
    ),
  };

  return [index, glossary, dataModel, workflows, cChecks, openQuestions, risks];
}
