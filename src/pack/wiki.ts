/** Wiki projection (spec §9/§11). Deterministic markdown from the graph + seed. */
import type { Graph, NodeCapsule, Seed, WikiPage } from "../core/types.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../core/grammar.js";
import { clusterOf } from "../core/ids.js";
import { wikilink, frontmatter } from "./obsidian.js";

function byCluster(graph: Graph, cluster: string): NodeCapsule[] {
  return graph.nodes.filter((n) => clusterOf(n.id) === cluster);
}

/**
 * A Links line whose ids are emitted as Obsidian wikilinks (FREEZE.md §4 P5, 6-b).
 * Each id targets the matching node note's frontmatter alias, so Obsidian's graph view
 * connects node → parents/children/dependsOn. Plain text to Claude Code.
 *
 * Used only for edges whose entries are NODE IDS. `exportsTo` (which holds export
 * artifact filenames like `CLAUDE.md`, not graph nodes) uses `artifactLine` instead, so
 * we never emit a wikilink that would dangle against a non-note target.
 */
function linkLine(label: string, ids: string[]): string {
  return ids.length
    ? `- **${label}:** ${ids.map((id) => wikilink(id)).join(", ")}`
    : "";
}

/** A Links line for non-node targets (generated artifacts): plain inline code. */
function artifactLine(label: string, names: string[]): string {
  return names.length
    ? `- **${label}:** ${names.map((n) => `\`${n}\``).join(", ")}`
    : "";
}

/** Per-node readable article (spec §9). */
export function nodeWiki(node: NodeCapsule): string {
  const c = node.checkability;
  const lines: string[] = [
    // Obsidian resolution scheme (P5/6-b): alias the note by its node id AND label so
    // [[ATT.005]] / [[Relevance Detection]] both resolve, despite every node note
    // sharing the basename wiki.md. Tagged by cluster for graph grouping.
    frontmatter([node.id, node.label], [clusterOf(node.id)]),
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
    artifactLine("Exports to", wl.exportsTo),
    linkLine("Guarded by", wl.guardedBy),
  ]) {
    if (l) lines.push(l);
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * A wiki section page is aliased by its slug-without-`.md` (e.g. `glossary`), so
 * `[[glossary|Glossary]]` resolves in Obsidian (P5/6-b). `frontmatter` strips the
 * extension via the alias passed in. Returns the YAML block to prepend.
 */
function pageFrontmatter(slug: string, title: string): string {
  return frontmatter([slug.replace(/\.md$/i, ""), title], ["wiki"]);
}

/** Index entry for a node: a wikilink (by id, the resolvable alias) + its summary. */
function nodeIndexLine(n: NodeCapsule): string {
  return `- ${n.ui.graphSymbol} ${wikilink(n.id, n.label)} — ${n.localContext.summary}`;
}

export function projectWiki(graph: Graph, seed: Seed): WikiPage[] {
  const clusters = [...new Set(graph.nodes.map((n) => clusterOf(n.id)))];
  const highValue = graph.nodes
    .filter((n) => n.ui.openPriority === "high")
    .map(nodeIndexLine);

  const index: WikiPage = {
    slug: "index.md",
    title: "Pack Home",
    markdown: [
      pageFrontmatter("index.md", "Pack Home"),
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
      `- ${wikilink("glossary", "Glossary")}`,
      `- ${wikilink("data-model", "Data model")}`,
      `- ${wikilink("workflows", "Workflows")}`,
      `- ${wikilink("c-checks", "C checks")}`,
      `- ${wikilink("open-questions", "Open questions")}`,
      `- ${wikilink("risks", "Risks")}`,
      "",
    ].join("\n"),
  };

  const glossary: WikiPage = {
    slug: "glossary.md",
    title: "Domain Glossary",
    markdown: [
      pageFrontmatter("glossary.md", "Domain Glossary"),
      "# Domain Glossary",
      "",
      ...byCluster(graph, "DOMAIN").map(
        (n) => `**${wikilink(n.id, n.label)}** — ${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const dataModel: WikiPage = {
    slug: "data-model.md",
    title: "Data Model",
    markdown: [
      pageFrontmatter("data-model.md", "Data Model"),
      "# Data Model",
      "",
      ...byCluster(graph, "DATA").map(
        (n) => `### ${wikilink(n.id, n.label)}\n${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const workflows: WikiPage = {
    slug: "workflows.md",
    title: "Workflows",
    markdown: [
      pageFrontmatter("workflows.md", "Workflows"),
      "# Workflows",
      "",
      ...byCluster(graph, "WORKFLOW").map(
        (n) => `### ${wikilink(n.id, n.label)}\n${n.localContext.summary}`,
      ),
      "",
    ].join("\n\n"),
  };

  const cChecks: WikiPage = {
    slug: "c-checks.md",
    title: "C Checks",
    markdown: [
      pageFrontmatter("c-checks.md", "C Checks"),
      "# C Checks",
      "",
      "Deterministic invariants (AXIOM A3 — no model inside a check).",
      "",
      ...byCluster(graph, "CHECK").map(
        (n) =>
          `- **${wikilink(n.id, n.label)}** [${n.checkability.class}] — ${n.localContext.summary}`,
      ),
      "",
    ].join("\n"),
  };

  const openQuestions: WikiPage = {
    slug: "open-questions.md",
    title: "Open Questions",
    markdown: [
      pageFrontmatter("open-questions.md", "Open Questions"),
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
    markdown: [
      pageFrontmatter("risks.md", "Risks"),
      "# Risks",
      "",
      ...seed.risks.map((r) => `- ${r}`),
      "",
    ].join("\n"),
  };

  return [index, glossary, dataModel, workflows, cChecks, openQuestions, risks];
}
