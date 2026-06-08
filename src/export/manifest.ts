/**
 * The EXPORT MANIFEST projection ("compile the family" capstone — §22, the self-describing index).
 *
 * The pack now emits a large family across five dirs (blueprint · claude · copilot · mcp · openai).
 * Without an index, a consumer can't see what's there. This projects the §2-envelope minimum for each
 * emitted artifact (path · family · format · audience) AND an honest COVERAGE report: which taxonomy
 * families are present, and which are still frontier (named, not hidden — A2). Deterministic JSON,
 * model-free (A3); the artifact list is the fixed emitted set + the graph-conditional plan.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "./claude.js";

interface ArtifactEntry {
  path: string;
  family: string;
  format: "markdown" | "json" | "jsonl" | "yaml";
  audience: "human" | "agent" | "verifier" | "runtime";
}

export interface ExportManifest {
  slug: string;
  artifacts: ArtifactEntry[];
  families_present: string[];
  /** Taxonomy families Ada does not yet emit — surfaced honestly (A2), not hidden. */
  frontier: string[];
}

/** Build the export manifest: the emitted family, tagged, plus honest coverage. */
export function projectExportManifest(model: PackModel): ExportManifest {
  const hasPlan = model.graph.nodes.some((n) => n.semanticType === "Action");
  const artifacts: ArtifactEntry[] = [
    { path: "graph.json", family: "graphs", format: "json", audience: "agent" },
    {
      path: "exports/claude/CLAUDE.md",
      family: "context-packs",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/POM.md",
      family: "context-packs",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/AUTONOMY_CONTRACT.md",
      family: "governance",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/AGENTS.md",
      family: "agents",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/TOOL_CONTRACTS.md",
      family: "tools-api",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/MEMORY_POLICY.md",
      family: "memory-state",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/EVIDENCE_LEDGER.jsonl",
      family: "provenance-evidence",
      format: "jsonl",
      audience: "verifier",
    },
    ...[
      "FACTS",
      "CLAIMS",
      "ASSUMPTIONS",
      "UNKNOWNS",
      "CONSTRAINTS",
      "DECISIONS",
      "ACTIONS",
    ].map((f) => ({
      path: `exports/blueprint/${f}.md`,
      family: "decomposition" as const,
      format: "markdown" as const,
      audience: "agent" as const,
    })),
    {
      path: "c/C.md",
      family: "verification",
      format: "markdown",
      audience: "verifier",
    },
    {
      path: "exports/blueprint/INTENT.md",
      family: "intent",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/SCOPE.md",
      family: "scope",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/blueprint/EVAL_PLAN.md",
      family: "data-training",
      format: "markdown",
      audience: "verifier",
    },
    {
      path: "exports/blueprint/EVAL_REPORT.md",
      family: "data-training",
      format: "markdown",
      audience: "verifier",
    },
    {
      path: "exports/blueprint/scorecard.json",
      family: "data-training",
      format: "json",
      audience: "verifier",
    },
    {
      path: "exports/blueprint/schema_graph_tree.md",
      family: "graphs",
      format: "markdown",
      audience: "human",
    },
    {
      path: "exports/blueprint/memory_write.json",
      family: "memory-state",
      format: "json",
      audience: "verifier",
    },
    {
      path: "exports/copilot/.github/copilot-instructions.md",
      family: "runtime-exports",
      format: "markdown",
      audience: "agent",
    },
    {
      path: "exports/mcp/resources.json",
      family: "runtime-exports",
      format: "json",
      audience: "runtime",
    },
    {
      path: "exports/mcp/tools.json",
      family: "runtime-exports",
      format: "json",
      audience: "runtime",
    },
    {
      path: "exports/openai-agents/agents.json",
      family: "runtime-exports",
      format: "json",
      audience: "runtime",
    },
    {
      path: "exports/openai-agents/handoffs.json",
      family: "runtime-exports",
      format: "json",
      audience: "runtime",
    },
    {
      path: "exports/openai-agents/guardrails.json",
      family: "runtime-exports",
      format: "json",
      audience: "runtime",
    },
    {
      path: "wiki/index.md",
      family: "documentation-wiki",
      format: "markdown",
      audience: "human",
    },
  ];
  if (hasPlan) {
    artifacts.push({
      path: "exports/blueprint/POM.md#execution_plan",
      family: "execution",
      format: "markdown",
      audience: "agent",
    });
  }
  const families_present = [...new Set(artifacts.map((a) => a.family))].sort();
  // The taxonomy families Ada does not yet emit as first-class artifacts (honest frontier, A2).
  const frontier = [
    "OUTCOME eval (L9b: does the pack beat raw-prompt? — held-out, human-judged, OWED; structural eval ships)",
    "observability-trace (run traces — runtime tail, L10)",
    "schemas-ir (machine schemas for the envelope)",
  ];
  return { slug: model.slug, artifacts, families_present, frontier };
}

/** The export manifest as an emitted pack file (written at the pack root). */
export function exportManifestArtifact(model: PackModel): ExportFile {
  return {
    path: "EXPORT_MANIFEST.json",
    content: JSON.stringify(projectExportManifest(model), null, 2) + "\n",
  };
}
