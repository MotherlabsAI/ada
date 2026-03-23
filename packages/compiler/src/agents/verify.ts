import type { ZodSchema } from "zod";
import { Agent } from "./base.js";
import { DEV_OPUS } from "../models.js";
import type {
  AuditReport,
  Blueprint,
  IntentGraph,
  CompilerStageCode,
} from "../types.js";
import { auditReportSchema } from "../schemas.js";
import { generatePostcode } from "@ada/provenance";

export interface VerifyInput {
  readonly blueprint: Blueprint;
  readonly intentGraph: IntentGraph;
}

export class VerifyAgent extends Agent<VerifyInput, AuditReport> {
  readonly name = "Verify";
  readonly stageCode: CompilerStageCode = "VER";
  readonly model = DEV_OPUS;
  readonly lens = "VALIDATION — blueprint vs intent";

  protected override get useExtendedThinking(): boolean {
    return process.env["ADA_DEV_MODE"] !== "1";
  }

  protected getSchema(): ZodSchema {
    return auditReportSchema;
  }

  protected getDefaultOutput(_input: VerifyInput): AuditReport {
    return {
      coverageScore: 0,
      coherenceScore: 0,
      drifts: [],
      gaps: ["verify output failed"],
      passed: false,
      challenges: [],
      postcode: generatePostcode("VER", "default"),
    };
  }

  protected buildPrompt(input: VerifyInput): string {
    const goalList = input.intentGraph.goals
      .map((g) => `${g.id}: ${g.description} (${g.type})`)
      .join("\n  ");
    const constraintList = input.intentGraph.constraints
      .map((c) => `${c.id}: ${c.description}`)
      .join("\n  ");
    const componentList = input.blueprint.architecture.components
      .map((c) => `${c.name}: ${c.responsibility} [${c.interfaces.join(", ")}]`)
      .join("\n  ");
    const entityCount = input.blueprint.dataModel.entities.length;
    const invariantCount = input.blueprint.dataModel.entities.reduce(
      (s, e) => s + e.invariants.length,
      0,
    );
    const workflowCount = input.blueprint.processModel.workflows.length;

    return `You are the Verify agent. Your lens: VALIDATION — blueprint vs intent.

ORIGINAL GOALS (${input.intentGraph.goals.length} total):
  ${goalList}

CONSTRAINTS:
  ${constraintList}

BLUEPRINT SUMMARY: ${input.blueprint.summary}
PATTERN: ${input.blueprint.architecture.pattern}
COMPONENTS (${input.blueprint.architecture.components.length}):
  ${componentList || "NONE — critical gap"}
ENTITIES: ${entityCount} with ${invariantCount} invariants
WORKFLOWS: ${workflowCount}
OPEN QUESTIONS: ${input.blueprint.openQuestions.length}

YOUR TASK: Score the blueprint against the original goals.

SCORING RULES (follow precisely):
- Coverage: For each goal, determine if a component, workflow step, or entity addresses it. Coverage = goals addressed / total goals. A goal is "addressed" if ANY component mentions its concern OR a workflow step has a postcondition related to it. Be GENEROUS — partial coverage counts.
- Coherence: Check if invariants contradict each other or if components have conflicting responsibilities. Coherence = 1.0 minus (contradictions found / total invariants). Most blueprints have high coherence (0.85+) unless there are actual contradictions.
- A gap is a goal with NO component, workflow, or entity addressing it at all.
- Drifts are cases where the blueprint addresses something NOT in the original goals.

Think briefly about each goal's coverage, then output ONLY a JSON object in a \`\`\`json fence.
Do NOT write prose after the JSON.

\`\`\`json
{
  "coverageScore": 0.85,
  "coherenceScore": 0.95,
  "drifts": [],
  "gaps": [],
  "passed": true,
  "challenges": []
}
\`\`\`
Produce REAL scores. Be fair — generous on partial coverage, strict only on actual contradictions.`;
  }
}
