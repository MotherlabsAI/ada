import type { ZodSchema } from "zod";
import { Agent } from "./base.js";
import { SONNET } from "../models.js";
import type {
  EntityMap,
  IntentGraph,
  DomainContext,
  CompilerStageCode,
} from "../types.js";
import { entityMapSchema } from "../schemas.js";
import { generatePostcode } from "@ada/provenance";

export interface EntityInput {
  readonly intentGraph: IntentGraph;
  readonly domainContext: DomainContext;
}

export class EntityAgent extends Agent<EntityInput, EntityMap> {
  readonly name = "Entity";
  readonly stageCode: CompilerStageCode = "ENT";
  readonly model = SONNET;
  readonly lens = "STRUCTURAL — nouns, invariants";

  protected getSchema(): ZodSchema {
    return entityMapSchema;
  }

  protected getDefaultOutput(_input: EntityInput): EntityMap {
    return {
      entities: [],
      boundedContexts: [],
      challenges: [],
      postcode: generatePostcode("ENT", "default"),
    };
  }

  protected buildPrompt(input: EntityInput): string {
    const goalList = input.intentGraph.goals
      .map((g) => `${g.id}: ${g.description}`)
      .join("\n  ");
    const domain = input.domainContext.domain;
    const vocab = Object.entries(input.domainContext.ubiquitousLanguage)
      .map(([k, v]) => `${k} = ${v}`)
      .join("\n  ");

    return `You are the Entity agent. Your lens: STRUCTURAL — nouns, invariants.
You are BLIND to behavior/workflows — only model what EXISTS, not what HAPPENS.

DOMAIN: ${domain}

GOALS:
  ${goalList}

VOCABULARY:
  ${vocab || "none defined"}

YOUR TASK: Extract all entities from the goals and domain above.

Rules:
- Every system has entities. A "hello world" CLI has: CLIProgram, OutputMessage, ExitCode. You MUST produce at least 2 entities.
- Category must be one of: substance, quality, relation, event, state
- Every entity MUST have at least 1 property and at least 1 invariant
- Invariants must be PREDICATES: "entity.field !== null" not "field must exist"
- Group entities into bounded contexts with one root entity per context

Think briefly about what entities exist, then output ONLY a JSON object inside a \`\`\`json fence.
Do NOT draw diagrams, trees, or ASCII art. Do NOT write prose after the JSON.

\`\`\`json
{
  "entities": [
    {
      "name": "CLIProgram",
      "category": "substance",
      "properties": [
        {"name": "name", "type": "string", "required": true},
        {"name": "entryPoint", "type": "string", "required": true}
      ],
      "invariants": [
        {"predicate": "cliProgram.name !== null && cliProgram.name.length > 0", "description": "program must have a name"},
        {"predicate": "cliProgram.entryPoint !== null", "description": "must have an entry point file"}
      ]
    }
  ],
  "boundedContexts": [
    {
      "name": "cli",
      "rootEntity": "CLIProgram",
      "entities": ["CLIProgram"],
      "invariants": []
    }
  ],
  "challenges": []
}
\`\`\`

Replace the example above with REAL entities derived from the goals and domain. Do not copy the example — produce entities specific to this project.`;
  }
}
