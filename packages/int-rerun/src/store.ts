import { randomUUID } from "crypto";
import type {
  PipelineRun,
  RunArtifact,
  DisambiguationPass,
  EntityBinding,
  IntegrationMapping,
  AmbiguitySet,
  CanonicalEntity,
  SYNGate,
  SYNValidationResult,
} from "./types.js";

// ─── Prior run seed data ─────────────────────────────────────────────────────
// ML.INT.01d32819/v1: passOrdinal=1, stage=INT, aggregateEntropy=0.72
// This is the immutable record of the prior run. It MUST NOT be mutated.

const PRIOR_RUN_ID = "ML.INT.01d32819/v1";

const PRIOR_RUN: PipelineRun = {
  runId: PRIOR_RUN_ID,
  version: "v1",
  aggregateEntropy: 0.72,
  passOrdinal: 1,
  stage: "INT",
  state: "COMPLETED",
  parentRunId: null,
};

// 26 canonical entities
const CANONICAL_ENTITIES: CanonicalEntity[] = Array.from(
  { length: 26 },
  (_, i) => {
    const idx = String(i + 1).padStart(3, "0");
    return { entityId: `CE-${idx}`, label: `CanonicalEntity-${idx}` };
  },
);

// AmbiguitySet for the prior run
const AMBIGUITY_SET: AmbiguitySet = {
  setId: `AS-${PRIOR_RUN_ID}`,
  entityCount: 26,
  memberEntityIds: CANONICAL_ENTITIES.map((e) => e.entityId),
  sourceRunId: PRIOR_RUN_ID,
};

// Integration mappings for all 26 entities (conflicting = true, candidateCount >= 2)
// Entity i gets candidates: canonical CE-{i+1} plus CE-{wrap to next}
function buildInitialMappings(): IntegrationMapping[] {
  return CANONICAL_ENTITIES.map((entity, i) => {
    const nextIdx = ((i + 1) % 26) + 1;
    const nextId = `CE-${String(nextIdx).padStart(3, "0")}`;
    return {
      mappingId: `IM-${entity.entityId}`,
      entityMentionId: entity.entityId,
      candidateTargetIds: [entity.entityId, nextId],
      conflicting: true,
      selectedTargetId: null,
    };
  });
}

// ─── In-memory store ─────────────────────────────────────────────────────────

export class PipelineStore {
  private readonly runs = new Map<string, PipelineRun>();
  private readonly artifacts = new Map<string, RunArtifact>();
  private readonly passes = new Map<string, DisambiguationPass>();
  private readonly bindings = new Map<string, EntityBinding>();
  private readonly mappings = new Map<string, IntegrationMapping>();
  private readonly gates = new Map<string, SYNGate>();
  private readonly validationResults = new Map<string, SYNValidationResult>();

  constructor() {
    // Seed the prior run — never modify this entry
    this.runs.set(PRIOR_RUN_ID, { ...PRIOR_RUN });

    // Seed canonical ambiguity set data (read-only reference)
    for (const mapping of buildInitialMappings()) {
      this.mappings.set(mapping.mappingId, mapping);
    }
  }

  // ─── PipelineRun ──────────────────────────────────────────────────────────

  getRun(runId: string): PipelineRun | undefined {
    return this.runs.get(runId);
  }

  upsertRun(run: PipelineRun): void {
    if (run.runId === PRIOR_RUN_ID) {
      throw new Error(
        "STATELESS_VIOLATION: cannot mutate prior run ML.INT.01d32819/v1",
      );
    }
    this.runs.set(run.runId, run);
  }

  deleteRun(runId: string): void {
    if (runId === PRIOR_RUN_ID) {
      throw new Error("STATELESS_VIOLATION: cannot delete prior run");
    }
    this.runs.delete(runId);
  }

  // ─── RunArtifact ──────────────────────────────────────────────────────────

  getArtifact(runId: string): RunArtifact | undefined {
    return this.artifacts.get(runId);
  }

  putArtifact(artifact: RunArtifact): void {
    this.artifacts.set(artifact.runId, artifact);
  }

  // ─── DisambiguationPass ───────────────────────────────────────────────────

  getPass(passId: string): DisambiguationPass | undefined {
    return this.passes.get(passId);
  }

  putPass(pass: DisambiguationPass): void {
    this.passes.set(pass.passId, pass);
  }

  hasPass(passId: string): boolean {
    return this.passes.has(passId);
  }

  // ─── EntityBinding ────────────────────────────────────────────────────────

  getBinding(bindingId: string): EntityBinding | undefined {
    return this.bindings.get(bindingId);
  }

  putBinding(binding: EntityBinding): void {
    this.bindings.set(binding.bindingId, binding);
  }

  getBindingsByRunId(runId: string): EntityBinding[] {
    return Array.from(this.bindings.values()).filter((b) => b.runId === runId);
  }

  // ─── IntegrationMapping ───────────────────────────────────────────────────

  getMappingsForSourceRun(_sourceRunId: string): IntegrationMapping[] {
    // All mappings are for the prior run's ambiguity set
    return Array.from(this.mappings.values());
  }

  // ─── AmbiguitySet ─────────────────────────────────────────────────────────

  getAmbiguitySet(sourceRunId: string): AmbiguitySet | undefined {
    if (sourceRunId === PRIOR_RUN_ID) return { ...AMBIGUITY_SET };
    return undefined;
  }

  // ─── CanonicalEntity ──────────────────────────────────────────────────────

  getCanonicalEntities(): CanonicalEntity[] {
    return [...CANONICAL_ENTITIES];
  }

  getCanonicalEntity(entityId: string): CanonicalEntity | undefined {
    return CANONICAL_ENTITIES.find((e) => e.entityId === entityId);
  }

  // ─── SYNGate ──────────────────────────────────────────────────────────────

  getGate(gateId: string): SYNGate | undefined {
    return this.gates.get(gateId);
  }

  putGate(gate: SYNGate): void {
    this.gates.set(gate.gateId, gate);
  }

  // ─── SYNValidationResult ──────────────────────────────────────────────────

  getValidationResult(runId: string): SYNValidationResult | undefined {
    return this.validationResults.get(runId);
  }

  putValidationResult(result: SYNValidationResult): void {
    this.validationResults.set(result.runId, result);
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  newId(): string {
    return randomUUID();
  }

  isPriorRun(runId: string): boolean {
    return runId === PRIOR_RUN_ID;
  }
}
