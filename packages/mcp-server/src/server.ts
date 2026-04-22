import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getBlueprint } from "./tools/blueprint.js";
import { getInvariants } from "./tools/invariants.js";
import { verifyCode } from "./tools/verify.js";
import { getWorkflow } from "./tools/workflow.js";
import { logDrift } from "./tools/drift.js";
import { proposeAgent } from "./tools/propose-agent.js";
import type { LiveStateReader, LiveTool } from "./live-state.js";
import { buildLiveTools } from "./live-state.js";

export interface StartServerOptions {
  // When provided, the 3 live-state tools (get_available_context, get_stage,
  // describe_run) are registered alongside the static blueprint tools. The
  // reader is queried fresh on every call so clients see new stages the
  // moment they land in state.json.
  readonly reader?: LiveStateReader;
  // Called every time any tool is invoked. The `ada context` daemon uses
  // this to update its "last query" indicator in the foreground TUI.
  readonly onQuery?: (toolName: string) => void;
}

export async function startServer(
  options: StartServerOptions = {},
): Promise<void> {
  const server = new Server(
    { name: "ada", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  const liveTools: readonly LiveTool[] = options.reader
    ? buildLiveTools(options.reader)
    : [];
  const liveToolByName = new Map(liveTools.map((t) => [t.name, t]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "ada.get_blueprint",
        description: "Returns the full active Blueprint",
        inputSchema: { type: "object" as const, properties: {} },
      },
      {
        name: "ada.get_invariants",
        description: "Returns predicate-form invariants for the named entity",
        inputSchema: {
          type: "object" as const,
          properties: { entityName: { type: "string" as const } },
          required: ["entityName"],
        },
      },
      {
        name: "ada.verify",
        description: "Checks code against entity invariants from active Blueprint",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: { type: "string" as const },
            entityName: { type: "string" as const },
          },
          required: ["code", "entityName"],
        },
      },
      {
        name: "ada.get_workflow",
        description:
          "Returns steps, preconditions, postconditions for the named workflow",
        inputSchema: {
          type: "object" as const,
          properties: { workflowName: { type: "string" as const } },
          required: ["workflowName"],
        },
      },
      {
        name: "ada.log_drift",
        description: "Logs semantic drift to provenance store",
        inputSchema: {
          type: "object" as const,
          properties: {
            location: { type: "string" as const },
            original: { type: "string" as const },
            actual: { type: "string" as const },
            severity: {
              type: "string" as const,
              enum: ["critical", "major", "minor"],
            },
          },
          required: ["location", "original", "actual", "severity"],
        },
      },
      {
        name: "ada.propose_agent",
        description: "Writes a new agent .md to .claude/agents/",
        inputSchema: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            description: { type: "string" as const },
            tools: {
              type: "array" as const,
              items: { type: "string" as const },
            },
            trigger: { type: "string" as const },
          },
          required: ["name", "description", "tools", "trigger"],
        },
      },
      // Live-state tools are only listed when a reader was provided.
      ...liveTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as unknown as { type: "object"; properties?: Record<string, unknown>; required?: string[] },
      })),
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    // Notify listeners (e.g. the `ada context` daemon) of every call,
    // regardless of which tool. Failures in the callback are swallowed.
    try {
      options.onQuery?.(toolName);
    } catch {
      /* onQuery must not break tool dispatch */
    }

    // Route live-state tools first (they always win when the same name is
    // registered twice — not currently the case, but future-proofing).
    const liveTool = liveToolByName.get(toolName);
    if (liveTool) {
      const r = liveTool.call(args);
      return {
        content: r.content.map((c) => ({ type: "text" as const, text: c.text })),
        ...(r.isError ? { isError: true } : {}),
      };
    }

    switch (toolName) {
      case "ada.get_blueprint": {
        const r = getBlueprint();
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_invariants": {
        const r = getInvariants(args["entityName"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.verify": {
        const r = verifyCode(
          args["code"] as string,
          args["entityName"] as string,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_workflow": {
        const r = getWorkflow(args["workflowName"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.log_drift": {
        const r = logDrift(
          args["location"] as string,
          args["original"] as string,
          args["actual"] as string,
          args["severity"] as "critical" | "major" | "minor",
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.propose_agent": {
        const r = proposeAgent(
          args["name"] as string,
          args["description"] as string,
          args["tools"] as string[],
          args["trigger"] as string,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      default:
        return {
          content: [
            { type: "text" as const, text: `Unknown tool: ${toolName}` },
          ],
          isError: true,
        };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
