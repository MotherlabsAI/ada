// ─── Entity Types ───────────────────────────────────────────────────────────
// All invariants documented in CLAUDE.md. Hooks enforce them at tool boundaries.

// EntityModel
export interface CanonicalEntity {
  readonly entityId: string; // non-empty
  readonly label: string; // non-empty
}

// INTResolution
export interface INTStage {
  readonly stageId: string; // non-empty
  readonly runId: string; // non-empty
  readonly version: string; // non-empty
  readonly stateless: true; // always true
  readonly entropyThreshold: 0.3; // hard-fixed
  readonly ambiguitySetSize: number; // >= 0
  readonly entityCount: 26; // fixed
  readonly aggregateEntropy: number; // [0,1]
  readonly aggregateEntropyHardCap: 0.3;
  readonly isStateless: true;
}

export interface AmbiguitySet {
  readonly setId: string;
  readonly entityCount: number; // === memberEntityIds.length, >= 1
  readonly memberEntityIds: readonly string[];
  readonly sourceRunId: string; // non-empty
}

export interface EntityBinding {
  readonly bindingId: string; // non-empty
  readonly runId: string; // non-empty
  readonly sourceEntityId: string; // !== canonicalTargetId
  readonly canonicalTargetId: string;
  readonly perBindingEntropy: number; // [0,1]
  readonly resolved: boolean; // === (perBindingEntropy < 0.30)
  state: EntityBindingState;
}

export type EntityBindingState =
  | "UNRESOLVED"
  | "RESOLVING"
  | "RESOLVED"
  | "FILTERED_OUT"
  | "UNRESOLVABLE"
  | "SYN_VALIDATED"
  | "SYN_FAILED";

export interface IntegrationMapping {
  readonly mappingId: string; // non-empty
  readonly entityMentionId: string;
  candidateTargetIds: string[]; // length >= 1
  conflicting: boolean; // === (candidateTargetIds.length > 1)
  selectedTargetId: string | null; // if present, must be in candidateTargetIds
}

export interface EntropyThreshold {
  readonly value: 0.3;
  readonly configurable: false;
  readonly threshold: 0.3;
  readonly exceedsThreshold: boolean; // === (measured >= 0.30)
}

export interface AggregateEntropy {
  readonly value: number; // [0,1]
  readonly bindingCount: number; // >= 0
  readonly runId: string; // non-empty
  readonly hardCap: 0.3;
  readonly satisfiesConstraint: boolean; // === (value <= 0.30)
  readonly priorRunValue: number;
}

// PipelineExecution
export type PipelineRunState =
  | "INITIALIZING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "TAINTED";

export interface PipelineRun {
  readonly runId: string; // non-empty
  readonly version: string; // non-empty
  aggregateEntropy: number; // [0,1]
  readonly passOrdinal: number; // >= 1
  readonly stage: string; // non-null
  state: PipelineRunState;
  readonly parentRunId: string | null;
}

export interface RunArtifact {
  readonly runId: string; // non-empty
  readonly parentRunId: string; // !== runId
  readonly stageLabel: string;
  readonly immutable: true; // always true
  readonly resolvedBindingIds: readonly string[]; // non-null
  readonly createdAt: number;
}

export type DisambiguationPassState =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "COMPENSATED";

export interface DisambiguationPass {
  readonly passId: string; // non-empty
  readonly ordinal: number; // >= 1
  readonly sourceRunId: string; // !== producedRunId
  readonly targetAmbiguitySetId: string; // non-empty
  producedRunId: string | null;
  state: DisambiguationPassState;
  conflictsResolved: number;
  readonly passIndex: number;
  readonly targetEntityCount: 26;
  appliedToStageRunId: string | null;
}

// SYNValidation
export type SYNGateState =
  | "IDLE"
  | "PENDING"
  | "OPEN"
  | "BLOCKED"
  | "EVENT_DELIVERY_FAILED";

export interface SYNGate {
  readonly gateId: string; // non-empty
  readonly requiredPassRate: 0.83; // fixed
  readonly passRateTarget: 0.83;
  readonly upstreamStage: string; // non-empty
  upstreamRunId: string | null;
  observedPassRate: number | null; // if present: [0,1]
  selfResolved: boolean;
  intStageRunId: string | null;
  state: SYNGateState;
}

export interface SYNValidationResult {
  readonly runId: string; // non-empty
  readonly passRate: number; // [0,1], === passedBindingCount / totalBindingCount
  readonly passedBindingCount: number; // <= totalBindingCount
  readonly totalBindingCount: number;
  readonly passed: boolean; // === (passRate >= 0.83)
  readonly gateId: string;
  status: "OK" | "ABORTED" | "INCONSISTENT";
}

// RunID entity
export interface RunID {
  readonly value: string; // === 'ML.INT.01d32819/v1'
  readonly hash: string; // non-empty
  readonly versionTag: string; // non-null
}

// StatelessReRun
export interface StatelessReRun {
  readonly targetStageRunId: string; // non-null
  readonly declaredInputsOnly: true;
  readonly inheritsMutableState: false;
}

// ─── Result types ───────────────────────────────────────────────────────────

export interface FilterResult {
  readonly retained: EntityBinding[];
  readonly filteredOut: EntityBinding[];
  readonly retainedCount: number;
}

export interface ResolvedMapping {
  readonly mappingId: string;
  readonly entityMentionId: string;
  readonly selectedTargetId: string;
  readonly perBindingEntropy: number;
}

export interface INTResolutionResult {
  readonly resolvedBindings: EntityBinding[];
  readonly aggregateEntropy: AggregateEntropy;
  readonly filteredCount: number;
}

export interface DisambiguationPassResult {
  readonly passId: string;
  readonly conflictsResolved: number;
  readonly bindings: EntityBinding[];
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class PipelineError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}
