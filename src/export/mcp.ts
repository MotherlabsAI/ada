/**
 * The MCP export ("compile the family", brick 7 — the harness-agnostic reach).
 *
 * Projects the pack into the Model Context Protocol shape: RESOURCES (the governed context, exposed
 * by URI so any MCP-speaking client can mount it) and TOOLS (the bounded, schema-described capability
 * the verifier may call). This is the broadest reach — not a per-vendor file but the open protocol, so
 * Ada's context is usable by anything that speaks MCP. Deterministic JSON, model-free (A3); the tool is
 * read-only verification (A0) — no capability is exposed beyond what the Tool Contracts already bound.
 */
import type { PackModel } from "../core/types.js";
import type { ExportFile } from "./claude.js";

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/** The pack's governed context as MCP resources (uri · name · description · mimeType). */
export function mcpResources(model: PackModel): McpResource[] {
  const u = (p: string): string => `ada://${model.slug}/${p}`;
  return [
    {
      uri: u("pom"),
      name: "Problem Operating Model",
      description:
        "Compiled epistemic state: intent, constraints, unknowns, verifier, residue. Operate on this; do not re-derive it.",
      mimeType: "text/markdown",
    },
    {
      uri: u("graph"),
      name: "World-model graph",
      description:
        "The typed context graph — nodes (typed by semanticType) and typed cross-edges.",
      mimeType: "application/json",
    },
    {
      uri: u("autonomy"),
      name: "Autonomy Contract",
      description:
        "Bounded authority (A0–A5) for each action; raising authority is a human gate (A4).",
      mimeType: "text/markdown",
    },
    {
      uri: u("agents"),
      name: "Agent Charters",
      description:
        "The governed agent set: role, autonomy, forbidden set, stop condition.",
      mimeType: "text/markdown",
    },
    {
      uri: u("tools"),
      name: "Tool Contracts",
      description:
        "Permissioned capabilities: required authority, preconditions, allowed/forbidden effects.",
      mimeType: "text/markdown",
    },
    {
      uri: u("memory"),
      name: "Memory Policy",
      description:
        "What survives: evidence-gated promotion, demotion rules, residue held back.",
      mimeType: "text/markdown",
    },
  ];
}

/** The pack's bounded capabilities as MCP tools (read-only verification — A0). */
export function mcpTools(model: PackModel): McpTool[] {
  return [
    {
      name: `ada_run_checks_${model.slug.replace(/[^a-z0-9]+/gi, "_")}`,
      description:
        "Run the pack's deterministic C-checks and return the verdict. Read-only (authority A0); fails closed on the unseen. Bound by TOOL_CONTRACTS.md.",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "string",
            description:
              "optional path to a JSON data file to check against (else the bundled fixtures)",
          },
        },
        required: [],
      },
    },
  ];
}

/** The MCP config as emitted pack files (resources.json + tools.json under exports/mcp). */
export function mcpExports(model: PackModel): ExportFile[] {
  return [
    {
      path: "resources.json",
      content: JSON.stringify(mcpResources(model), null, 2) + "\n",
    },
    {
      path: "tools.json",
      content: JSON.stringify(mcpTools(model), null, 2) + "\n",
    },
  ];
}
