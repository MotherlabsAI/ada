import type { ZodSchema } from "zod";
import { Agent } from "./base.js";
import { SONNET } from "../models.js";
import type {
  DomainContext,
  IntentGraph,
  CompilerStageCode,
} from "../types.js";
import { domainContextSchema } from "../schemas.js";
import { generatePostcode } from "@ada/provenance";

export class PersonaAgent extends Agent<IntentGraph, DomainContext> {
  readonly name = "Persona";
  readonly stageCode: CompilerStageCode = "PER";
  readonly model = SONNET;
  readonly lens = "domain / vocabulary / exclusions";

  protected getSchema(): ZodSchema {
    return domainContextSchema;
  }

  protected getDefaultOutput(_input: IntentGraph): DomainContext {
    return {
      domain: "unknown",
      stakeholders: [],
      ubiquitousLanguage: {},
      excludedConcerns: [],
      challenges: [],
      postcode: generatePostcode("PER", "default"),
    };
  }

  protected buildPrompt(input: IntentGraph): string {
    const goalList = input.goals
      .map((g) => `${g.id}: ${g.description} (${g.type})`)
      .join("\n  ");
    const constraintList = input.constraints
      .map((c) => `${c.id}: ${c.description}`)
      .join("\n  ");

    return `You are the Persona agent. Your lens: domain / vocabulary / exclusions.

RAW INTENT: "${input.rawIntent}"

GOALS:
  ${goalList}

CONSTRAINTS:
  ${constraintList}

IMPORTANT: Your domain analysis must match the RAW INTENT above, not the environment you're running in. If the intent says "hello world CLI", the domain is CLI development, not AI pipelines or semantic compilers. Ground yourself in what the user actually asked for.

YOUR TASK: Analyze the domain for this specific project.
1. Name the domain — be specific but proportional to the intent's complexity
2. Identify stakeholders, their knowledge, blind spots, and fears
3. Define vocabulary terms that have specific meaning in this domain
4. List at least 5 things this system is NOT (excluded concerns)

Think briefly, then output ONLY a JSON object inside a \`\`\`json fence.
Do NOT write prose after the JSON.

\`\`\`json
{
  "domain": "specific domain name matching the intent",
  "stakeholders": [
    {
      "role": "primary user type",
      "knowledgeBase": ["what they know"],
      "blindSpots": ["what they assume is handled"],
      "vocabulary": {"their term": "precise meaning"},
      "fearSet": ["what they fear going wrong"]
    }
  ],
  "ubiquitousLanguage": {
    "term": "canonical meaning in this domain"
  },
  "excludedConcerns": [
    "what this system is NOT",
    "what is out of scope",
    "what it does not do"
  ],
  "challenges": []
}
\`\`\`
Produce REAL domain analysis for the intent "${input.rawIntent}". At least 5 excluded concerns.`;
  }
}
