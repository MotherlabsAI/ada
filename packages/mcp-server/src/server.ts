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
import { queryConstraints } from "./tools/query-constraints.js";
import { checkDrift } from "./tools/check-drift.js";
import { getWorldModel } from "./tools/get-world-model.js";
import { proposeAmendment } from "./tools/propose-amendment.js";

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: "ada", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Ada semantic compiler — intent authority for this codebase. " +
        "Before modifying any entity or data model: call ada.query_constraints with the entity name. " +
        "Before any significant implementation decision: call ada.check_drift with a description of the change. " +
        "When your implementation deviates from the blueprint: call ada.log_drift. " +
        "The blueprint in ada.get_blueprint is the authority — code must trace to it.",
    },
  );

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
        description:
          "Checks code against entity invariants from active Blueprint",
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
      {
        name: "ada.query_constraints",
        description:
          "Returns invariants and workflow steps from the compiled blueprint matching the given scope. Use before modifying any entity or workflow to understand the constraints Ada compiled from original intent.",
        inputSchema: {
          type: "object" as const,
          properties: {
            scope: {
              type: "string" as const,
              description:
                "Domain scope to filter by, e.g. 'payment', 'user', 'auth'",
            },
          },
          required: ["scope"],
        },
      },
      {
        name: "ada.check_drift",
        description:
          "Checks whether a described action or change aligns with Ada's compiled intent graph. Returns aligned=true/false with violations and matched goals. Use before implementing any significant change.",
        inputSchema: {
          type: "object" as const,
          properties: {
            description: {
              type: "string" as const,
              description:
                "Description of the action or change you are about to make",
            },
          },
          required: ["description"],
        },
      },
      {
        name: "ada.propose_amendment",
        description:
          "Proposes a change to the compiled blueprint when implementation reveals it is incomplete or incorrect. Ada processes the queue via 'ada review-amendments'. Use when you discover during implementation that a goal is missing, an entity needs a new invariant, or a workflow step is wrong.",
        inputSchema: {
          type: "object" as const,
          properties: {
            stage: {
              type: "string" as const,
              description:
                "Pipeline stage to amend: INT, PER, ENT, PRO, or SYN",
            },
            field: {
              type: "string" as const,
              description:
                "The specific field being amended (e.g. 'goals', 'entities', 'workflows')",
            },
            proposed: {
              type: "string" as const,
              description: "Proposed addition or replacement",
            },
            rationale: {
              type: "string" as const,
              description:
                "Why implementation revealed this amendment is needed",
            },
            original: {
              type: "string" as const,
              description: "Current blueprint value (optional)",
            },
          },
          required: ["stage", "field", "proposed", "rationale"],
        },
      },
      {
        name: "ada.get_world_model",
        description:
          "Returns the compiled world model. Without a stage, returns the full manifest (runId, intent, decision, stage index). With a stage code (CTX/INT/PER/ENT/PRO/SYN/VER/GOV), returns that stage's artifact.",
        inputSchema: {
          type: "object" as const,
          properties: {
            stage: {
              type: "string" as const,
              description:
                "Optional stage code: CTX, INT, PER, ENT, PRO, SYN, VER, or GOV",
            },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    switch (request.params.name) {
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
      case "ada.query_constraints": {
        const r = queryConstraints(args["scope"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.check_drift": {
        const r = checkDrift(args["description"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.propose_amendment": {
        const r = proposeAmendment(
          args["stage"] as string,
          args["field"] as string,
          args["proposed"] as string,
          args["rationale"] as string,
          args["original"] as string | undefined,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_world_model": {
        const r = getWorldModel(args["stage"] as string | undefined);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
