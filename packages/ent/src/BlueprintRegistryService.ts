import { createHash } from "crypto";
import {
  BlueprintComponentRegistry,
  NamedBlueprintComponent,
  WorkspacePackageName,
} from "./types.js";

// The 10 canonical NamedBlueprintComponents of the Ada system.
// Ordinals 1–10. C3 (ordinal 3, ElicitationEngine) is the gap component —
// its assignedPackage is null until C3GapResolver resolves it.
// Components 1+2 share 'compiler'; components 6+10 share 'int-rerun'.
// That gives 10 components across 8 packages.

const REGISTRY_ID = "reg-ML.ENT.e80e3c97";
const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

type ComponentSeed = {
  ordinal: number;
  name: string;
  responsibility: string;
  boundedContext: string;
  assignedPackage: WorkspacePackageName | null;
};

const COMPONENT_SEEDS: ComponentSeed[] = [
  {
    ordinal: 1,
    name: "IntentIngestionComponent",
    responsibility:
      "Captures raw intent text from the user, validates non-emptiness, records capturedAt timestamp, and anchors the intent to a session and pipeline run.",
    boundedContext: "IntentIngestion",
    assignedPackage: "compiler",
  },
  {
    ordinal: 2,
    name: "SemanticCompilationComponent",
    responsibility:
      "Compiles a ratified IntentGraph into a Blueprint via multi-agent orchestration: intent, entity, process, persona, and synthesis agents. Enforces governor gate at each iteration.",
    boundedContext: "SemanticCompilation",
    assignedPackage: "compiler",
  },
  {
    ordinal: 3,
    name: "ElicitationEngineComponent",
    responsibility:
      "Manages the pre-compilation elicitation lifecycle: opens an ElicitationSession from RawIntent, conducts multi-turn dialogue to resolve unknowns and gaps, and emits a HandoffRecord when the DraftIntentGraph is ratified.",
    boundedContext: "ElicitationSession",
    assignedPackage: null, // C3 gap — resolved by C3GapResolver
  },
  {
    ordinal: 4,
    name: "GovernorDecisionComponent",
    responsibility:
      "Evaluates gate pass/fail at every pipeline stage boundary. Computes confidence score, coverage score, and gate pass rate. Emits GovernorDecision with verdict PASS, REJECT, or ITERATE.",
    boundedContext: "GovernanceContext",
    assignedPackage: "governor",
  },
  {
    ordinal: 5,
    name: "ProvenanceTrackingComponent",
    responsibility:
      "Writes immutable ProvenanceRecords for every pipeline action, anchored by PostcodeAddresses. Provides getChain and isChainIntact for provenance validation. Enforces append-only semantics.",
    boundedContext: "ProvenanceChainContext",
    assignedPackage: "provenance",
  },
  {
    ordinal: 6,
    name: "EntityResolutionComponent",
    responsibility:
      "Loads AmbiguitySet from an INT-stage pipeline run, resolves entity bindings via canonical entity registry lookup, filters by binding entropy, and computes aggregate entropy for SYN gate eligibility.",
    boundedContext: "EntityResolution",
    assignedPackage: "int-rerun",
  },
  {
    ordinal: 7,
    name: "ConfigWriterComponent",
    responsibility:
      "Writes and updates CLAUDE.md, settings.json, and agent files from compilation artifacts. Manages hook registration for pre-tool invariant enforcement. Enforces idempotent write semantics.",
    boundedContext: "ConfigWriterContext",
    assignedPackage: "config-writer",
  },
  {
    ordinal: 8,
    name: "OrchestratorComponent",
    responsibility:
      "Spawns and manages specialist subagents by bounded context, coordinates checkpoint-and-resume across pipeline stages, and emits StageCompleteEvents to downstream consumers.",
    boundedContext: "OrchestratorContext",
    assignedPackage: "orchestrator",
  },
  {
    ordinal: 9,
    name: "MCPServerComponent",
    responsibility:
      "Exposes pipeline compilation and verification operations as MCP tools. Manages session state across multi-turn MCP invocations. Routes tool calls to compiler, governor, and verifier subsystems.",
    boundedContext: "MCPInterface",
    assignedPackage: "mcp-server",
  },
  {
    ordinal: 10,
    name: "IntegrationRerunComponent",
    responsibility:
      "Re-executes the INT pipeline stage with a disambiguation pass when aggregate entropy exceeds the SYN gate threshold. Produces a new RunArtifact and triggers downstream SYN gate re-evaluation.",
    boundedContext: "IntegrationRerun",
    assignedPackage: "int-rerun",
  },
];

function makeComponentId(ordinal: number): string {
  return `comp-${String(ordinal).padStart(2, "0")}-${REGISTRY_ID}`;
}

function makeRegistryPostcode(registryId: string): string {
  const hash = createHash("sha256")
    .update(`registry:${registryId}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

export class BlueprintRegistryService {
  private readonly registry: BlueprintComponentRegistry;

  constructor() {
    const components: NamedBlueprintComponent[] = COMPONENT_SEEDS.map(
      (seed) => ({
        componentId: makeComponentId(seed.ordinal),
        ordinal: seed.ordinal,
        name: seed.name,
        responsibility: seed.responsibility,
        boundedContext: seed.boundedContext,
        registryId: REGISTRY_ID,
        assignedPackage: seed.assignedPackage,
      }),
    );

    this.registry = {
      registryId: REGISTRY_ID,
      pipelineRunId: PIPELINE_RUN_ID,
      totalComponentCount: 10,
      components,
      postcode: makeRegistryPostcode(REGISTRY_ID),
    };

    this.validateRegistryIntegrity();
  }

  enumerateComponents(): NamedBlueprintComponent[] {
    return [...this.registry.components];
  }

  getComponentByOrdinal(ordinal: number): NamedBlueprintComponent {
    const c = this.registry.components.find((c) => c.ordinal === ordinal);
    if (!c) throw new Error(`No component at ordinal ${ordinal}`);
    return c;
  }

  getComponentByName(name: string): NamedBlueprintComponent {
    const c = this.registry.components.find((c) => c.name === name);
    if (!c) throw new Error(`No component named ${name}`);
    return c;
  }

  getRegistry(): BlueprintComponentRegistry {
    return this.registry;
  }

  validateRegistryIntegrity(): boolean {
    const { components, totalComponentCount } = this.registry;
    if (components.length !== 10)
      throw new Error(
        `Registry has ${components.length} components, expected 10`,
      );
    if (totalComponentCount !== 10)
      throw new Error(
        `totalComponentCount must be 10, got ${totalComponentCount}`,
      );
    const names = new Set(components.map((c) => c.name));
    if (names.size !== 10)
      throw new Error("Duplicate component names detected in registry");
    for (const c of components) {
      if (c.ordinal < 1 || c.ordinal > 10)
        throw new Error(`Component ${c.name} has invalid ordinal ${c.ordinal}`);
      if (!c.name || !c.responsibility)
        throw new Error(
          `Component at ordinal ${c.ordinal} missing name or responsibility`,
        );
      if (c.registryId !== this.registry.registryId)
        throw new Error(`Component ${c.name} registryId mismatch`);
    }
    return true;
  }
}
