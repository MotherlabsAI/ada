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
import {
  getRuntimeState,
  createCheckpoint,
  rollbackTo,
} from "./tools/runtime-state.js";
import { getMacroPlan } from "./tools/macro-plan.js";
import { extractSkills, proposeSkill } from "./tools/skill-extraction.js";
import {
  runVerificationStack,
  type VerifierLayer,
} from "./tools/verify-stack.js";
import {
  getContract,
  enterDelegation,
  exitDelegation,
} from "./tools/get-contract.js";

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
        name: "ada.extract_skills",
        description:
          "Analyzes the session log to find repeated implementation patterns across sessions. Proposes skill candidates to .ada/skill-candidates.json for human review via 'ada review-skills'. Patterns must appear in 2+ distinct sessions to qualify.",
        inputSchema: { type: "object" as const, properties: {} },
      },
      {
        name: "ada.propose_skill",
        description:
          "Queues a skill proposal for human review. The skill will NOT be written to .claude/skills/ until a human approves it via 'ada review-skills'. Governance rule: skills improve workflows — they do not modify compiled intent, entity invariants, or delegation policies.",
        inputSchema: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const, description: "Skill name (slug)" },
            description: {
              type: "string" as const,
              description: "One-line description",
            },
            trigger: {
              type: "string" as const,
              description: "When to invoke this skill",
            },
            skillBody: {
              type: "string" as const,
              description: "Full SKILL.md content including frontmatter",
            },
            rationale: {
              type: "string" as const,
              description: "Why this skill is needed",
            },
          },
          required: [
            "name",
            "description",
            "trigger",
            "skillBody",
            "rationale",
          ],
        },
      },
      {
        name: "ada.verify",
        description:
          "Runs the Ada verification stack against the current world-state. " +
          "Without a layer, runs all five: structural (dependency graph), execution (tool coverage), " +
          "policy (contract scope), outcome (postcondition evidence), provenance (file traceability). " +
          "Returns layered report with scores and findings. Use after completing any significant implementation step.",
        inputSchema: {
          type: "object" as const,
          properties: {
            layer: {
              type: "string" as const,
              enum: [
                "structural",
                "execution",
                "policy",
                "outcome",
                "provenance",
              ],
              description:
                "Optional: run only this layer. Omit to run all five.",
            },
            scope: {
              type: "string" as const,
              description:
                "Optional: bounded context scope filter for policy layer",
            },
          },
        },
      },
      {
        name: "ada.get_contract",
        description:
          "Returns the delegation contract for a bounded context. Includes scope (allowed paths and tools), stop conditions, required evidence, max recursion depth, and current delegation depth. Call at the start of any agent session to understand your bounds.",
        inputSchema: {
          type: "object" as const,
          properties: {
            context: {
              type: "string" as const,
              description: "Bounded context name (e.g. 'payments', 'auth')",
            },
          },
          required: ["context"],
        },
      },
      {
        name: "ada.enter_delegation",
        description:
          "Registers this agent as entering a delegation for the given context. Validates that max recursion depth is not exceeded. Call when a macro planner or orchestrator is about to spawn a child agent.",
        inputSchema: {
          type: "object" as const,
          properties: {
            context: {
              type: "string" as const,
              description: "Bounded context being delegated into",
            },
            agentId: {
              type: "string" as const,
              description:
                "Unique identifier for this agent instance (e.g. 'macro-planner-1')",
            },
          },
          required: ["context", "agentId"],
        },
      },
      {
        name: "ada.exit_delegation",
        description:
          "Removes this agent from the delegation stack. Call when a delegated agent has completed its task and is returning control to its parent.",
        inputSchema: {
          type: "object" as const,
          properties: {
            agentId: {
              type: "string" as const,
              description:
                "Agent ID that was registered via ada.enter_delegation",
            },
          },
          required: ["agentId"],
        },
      },
      {
        name: "ada.get_macro_plan",
        description:
          "Returns the ordered execution plan for the compiled blueprint. Uses dependency analysis to sequence components and world-state to mark already-complete tasks. Call at the start of any multi-component implementation session.",
        inputSchema: { type: "object" as const, properties: {} },
      },
      {
        name: "ada.get_runtime_state",
        description:
          "Returns the current world-state snapshot: sessions, tool calls, component execution status, environment facts, and checkpoints. Use when you need to understand what has actually been done vs what was planned.",
        inputSchema: { type: "object" as const, properties: {} },
      },
      {
        name: "ada.checkpoint",
        description:
          "Creates a named checkpoint of the current world state. Uses git stash for hard rollback capability. Call before any significant change that might need to be undone.",
        inputSchema: {
          type: "object" as const,
          properties: {
            description: {
              type: "string" as const,
              description: "Human-readable description of this checkpoint",
            },
          },
          required: ["description"],
        },
      },
      {
        name: "ada.rollback_to",
        description:
          "Rolls back the filesystem to a named checkpoint using git stash pop. Removes the checkpoint and all later checkpoints from the list.",
        inputSchema: {
          type: "object" as const,
          properties: {
            checkpointId: {
              type: "string" as const,
              description: "Checkpoint ID to roll back to (e.g. cp-1234567890)",
            },
          },
          required: ["checkpointId"],
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
      case "ada.extract_skills": {
        const r = extractSkills();
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.propose_skill": {
        const r = proposeSkill(
          args["name"] as string,
          args["description"] as string,
          args["trigger"] as string,
          args["skillBody"] as string,
          args["rationale"] as string,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.verify": {
        const r = runVerificationStack(
          args["layer"] as VerifierLayer | undefined,
          args["scope"] as string | undefined,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_contract": {
        const r = getContract(args["context"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.enter_delegation": {
        const r = enterDelegation(
          args["context"] as string,
          args["agentId"] as string,
        );
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.exit_delegation": {
        const r = exitDelegation(args["agentId"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_macro_plan": {
        const r = getMacroPlan();
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.get_runtime_state": {
        const r = getRuntimeState();
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.checkpoint": {
        const r = createCheckpoint(args["description"] as string);
        return {
          content: [{ type: "text" as const, text: r.content }],
          isError: r.isError,
        };
      }
      case "ada.rollback_to": {
        const r = rollbackTo(args["checkpointId"] as string);
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
