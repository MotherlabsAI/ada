// ENT-stage integration types
// All invariants are enforced by hooks at tool boundaries.

// ─── Blueprint Registry ───────────────────────────────────────────────────────

export type WorkspacePackageName =
  | "compiler"
  | "config-writer"
  | "elicitation"
  | "governor"
  | "int-rerun"
  | "mcp-server"
  | "orchestrator"
  | "provenance";

export const WORKSPACE_PACKAGES: WorkspacePackageName[] = [
  "compiler",
  "config-writer",
  "elicitation",
  "governor",
  "int-rerun",
  "mcp-server",
  "orchestrator",
  "provenance",
];

export interface NamedBlueprintComponent {
  readonly componentId: string;
  readonly ordinal: number; // 1–10
  readonly name: string;
  readonly responsibility: string;
  readonly boundedContext: string;
  readonly registryId: string;
  readonly assignedPackage: WorkspacePackageName | null;
}

export interface BlueprintComponentRegistry {
  readonly registryId: string;
  readonly pipelineRunId: string;
  readonly totalComponentCount: number; // must === 10
  readonly components: readonly NamedBlueprintComponent[];
  readonly postcode: string;
}

// ─── Component-Package Mapping ────────────────────────────────────────────────

export interface WorkspacePackageNode {
  readonly packageName: WorkspacePackageName;
  readonly pipelineStage: string;
  readonly assignedComponentIds: readonly string[];
}

export interface ComponentPackageAssignment {
  readonly assignmentId: string;
  readonly mappingId: string;
  readonly componentId: string;
  readonly componentOrdinal: number;
  readonly componentName: string;
  readonly targetPackage: WorkspacePackageName;
  readonly isResolved: boolean;
  readonly provenanceRecordPostcode: string | null;
}

export interface ComponentPackageMapping {
  readonly mappingId: string;
  readonly pipelineRunId: string;
  readonly assignments: readonly ComponentPackageAssignment[];
  readonly assignmentCount: number; // must === 10
  readonly isTotal: boolean; // === (assignments.length === 10)
  readonly postcode: string | null;
}

// ─── C3 Assignment Gap ────────────────────────────────────────────────────────

export type C3GapState =
  | "open"
  | "candidate-identified"
  | "resolved"
  | "rejected";

export interface C3AssignmentGap {
  readonly gapId: string;
  readonly pipelineRunId: string;
  readonly componentOrdinal: 3;
  readonly componentName: string;
  readonly componentId: string;
  readonly candidatePackages: readonly WorkspacePackageName[];
  readonly isResolved: boolean;
  readonly resolvedPackage: WorkspacePackageName | null;
  readonly state: C3GapState;
  readonly resolutionProvenancePostcode: string | null;
}

// ─── Pipeline Run Governance ──────────────────────────────────────────────────

export type ENTBlockerSeverity = "critical" | "major" | "minor";

export interface ENTBlocker {
  readonly blockerId: string;
  readonly pipelineRunId: string;
  readonly linkedGapId: string;
  readonly description: string;
  readonly severity: ENTBlockerSeverity;
  readonly isCleared: boolean;
  readonly clearedAt: number | null;
  readonly clearanceProvenancePostcode: string | null;
}

export interface StalledPipelineRun {
  readonly runId: "ML.ENT.e80e3c97/v1";
  readonly stage: "ENT";
  readonly version: string;
  readonly blockers: readonly ENTBlocker[];
  readonly blockerCount: number;
  readonly resumable: boolean;
}

// ─── ENT Gate ─────────────────────────────────────────────────────────────────

export type ENTGateState = "pending" | "evaluating" | "passed" | "failed";

export interface ENTGateRecord {
  readonly gateId: string;
  readonly pipelineRunId: string;
  readonly entityCount: number;
  readonly provenanceIntact: boolean;
  readonly allBlockersCleared: boolean;
  readonly passed: boolean;
  readonly evaluatedAt: number | null;
  readonly governorDecisionPostcode: string | null;
  readonly state: ENTGateState;
}

// ─── Provenance Chain ─────────────────────────────────────────────────────────

export interface ProvenanceChainHop {
  readonly hopId: string;
  readonly chainId: string;
  readonly hopIndex: 0 | 1 | 2; // 0=component→package, 1=package→stage, 2=stage→pipeline
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly isTraced: boolean;
  readonly provenanceRecordPostcode: string | null;
}

export interface ProvenanceChainRecord {
  readonly chainId: string;
  readonly pipelineRunId: string;
  readonly componentId: string;
  readonly hopCount: 3;
  readonly hops: readonly [
    ProvenanceChainHop,
    ProvenanceChainHop,
    ProvenanceChainHop,
  ];
  readonly provenanceIntact: boolean;
  readonly postcode: string | null;
}

// ─── ENT Provenance Record ────────────────────────────────────────────────────

export interface ENTProvenanceRecord {
  readonly recordId: string;
  readonly postcode: string; // non-null, length > 0
  readonly stage: "ENT";
  readonly actionType: string; // non-null, length > 0
  readonly subjectId: string; // non-null, length > 0
  readonly pipelineRunId: string;
  readonly upstreamPostcodes: readonly string[];
  readonly content: string;
  readonly timestamp: number; // > 0
}

// ─── Entity Registration ──────────────────────────────────────────────────────

export interface ENTEntityRegistration {
  readonly registrationId: string;
  readonly pipelineRunId: string;
  readonly sourceComponentId: string;
  readonly extractedEntityName: string;
  readonly targetRegistryType: "EntityMap";
  readonly entityMapPostcode: string;
  readonly provenanceRecordPostcode: string;
  readonly registeredAt: number; // > 0
}

export interface EntityMap {
  readonly entityMapId: string;
  readonly pipelineRunId: string;
  readonly entities: readonly ENTEntityRegistration[];
  readonly entityCount: number;
  readonly postcode: string;
}

// ─── G15: ENT Gate Pass Condition ────────────────────────────────────────────
// All four must be true for the ENT gate to pass.

export interface ENTGatePassCondition {
  readonly entityCountGtZero: boolean;
  readonly provenanceIntact: boolean;
  readonly allBlockersCleared: boolean;
  readonly whoEntityDefined: boolean; // WHO entity must have role, scope, trustLevel
}
