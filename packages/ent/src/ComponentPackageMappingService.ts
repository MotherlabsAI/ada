import { createHash } from "crypto";
import {
  ComponentPackageAssignment,
  ComponentPackageMapping,
  NamedBlueprintComponent,
  WorkspacePackageName,
  WorkspacePackageNode,
  WORKSPACE_PACKAGES,
  C3AssignmentGap,
} from "./types.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

function makeMappingId(): string {
  return `mapping-${PIPELINE_RUN_ID}`;
}

function makeAssignmentId(componentId: string): string {
  return `assign-${componentId}`;
}

function makeMappingPostcode(mappingId: string): string {
  const hash = createHash("sha256")
    .update(`mapping:${mappingId}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

// 8 canonical workspace package nodes. Each package maps to its primary
// pipeline stage. int-rerun and compiler host 2 components each.
export const WORKSPACE_PACKAGE_NODES: WorkspacePackageNode[] = [
  {
    packageName: "compiler",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "config-writer",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "elicitation",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "governor",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "int-rerun",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "mcp-server",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "orchestrator",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
  {
    packageName: "provenance",
    pipelineStage: "ENT",
    assignedComponentIds: [],
  },
];

export class ComponentPackageMappingService {
  private mapping: ComponentPackageMapping;

  constructor() {
    this.mapping = {
      mappingId: makeMappingId(),
      pipelineRunId: PIPELINE_RUN_ID,
      assignments: [],
      assignmentCount: 0,
      isTotal: false,
      postcode: null,
    };
  }

  getMapping(): ComponentPackageMapping {
    return this.mapping;
  }

  // Step 2 of workflow-1: build initial mapping.
  // 9 components get isResolved=true; C3 gets isResolved=false.
  buildInitialMapping(
    components: NamedBlueprintComponent[],
    packages: WorkspacePackageNode[],
  ): ComponentPackageMapping {
    if (components.length !== 10) {
      throw new Error(`Expected 10 components, got ${components.length}`);
    }
    if (packages.length !== 8) {
      throw new Error(`Expected 8 workspace packages, got ${packages.length}`);
    }

    const mappingId = this.mapping.mappingId;
    const assignments: ComponentPackageAssignment[] = components.map((comp) => {
      const isC3 = comp.ordinal === 3;
      return {
        assignmentId: makeAssignmentId(comp.componentId),
        mappingId,
        componentId: comp.componentId,
        componentOrdinal: comp.ordinal,
        componentName: comp.name,
        targetPackage: (comp.assignedPackage ??
          "elicitation") as WorkspacePackageName,
        isResolved: !isC3,
        provenanceRecordPostcode: null,
      };
    });

    const updated: ComponentPackageMapping = {
      ...this.mapping,
      assignments,
      assignmentCount: 10,
      isTotal: false, // C3 is not yet resolved
      postcode: null,
    };
    this.mapping = updated;
    return updated;
  }

  addAssignment(
    mapping: ComponentPackageMapping,
    assignment: ComponentPackageAssignment,
  ): ComponentPackageMapping {
    // Idempotent: if componentId already exists, replace it
    const existing = mapping.assignments.filter(
      (a) => a.componentId !== assignment.componentId,
    );
    const updated: ComponentPackageMapping = {
      ...mapping,
      assignments: [...existing, assignment],
      assignmentCount: existing.length + 1,
    };
    this.mapping = updated;
    return updated;
  }

  // Apply the C3 gap resolution: update the C3 assignment with the resolved package.
  applyC3Resolution(
    mapping: ComponentPackageMapping,
    resolvedGap: C3AssignmentGap,
  ): ComponentPackageMapping {
    if (!resolvedGap.isResolved || !resolvedGap.resolvedPackage) {
      throw new Error("Cannot apply C3 resolution: gap is not resolved");
    }
    const updatedAssignments = mapping.assignments.map((a) => {
      if (a.componentOrdinal !== 3) return a;
      return {
        ...a,
        targetPackage: resolvedGap.resolvedPackage!,
        isResolved: true,
        provenanceRecordPostcode: resolvedGap.resolutionProvenancePostcode,
      };
    });
    const updated: ComponentPackageMapping = {
      ...mapping,
      assignments: updatedAssignments,
    };
    this.mapping = updated;
    return updated;
  }

  // Step 4 of workflow-1: finalize mapping — all 10 resolved → isTotal=true.
  finalizeMapping(mapping: ComponentPackageMapping): ComponentPackageMapping {
    const unresolved = mapping.assignments.filter((a) => !a.isResolved);
    if (unresolved.length > 0) {
      const names = unresolved.map((a) => a.componentName).join(", ");
      throw new Error(
        `Cannot finalize: ${unresolved.length} unresolved assignments: ${names}`,
      );
    }
    if (mapping.assignments.length !== 10) {
      throw new Error(
        `Cannot finalize: expected 10 assignments, got ${mapping.assignments.length}`,
      );
    }
    // Injectivity: each componentId appears exactly once
    const componentIds = mapping.assignments.map((a) => a.componentId);
    if (new Set(componentIds).size !== 10) {
      throw new Error(
        "Duplicate componentId in assignments — mapping not injective",
      );
    }
    // All target packages must be valid
    for (const a of mapping.assignments) {
      if (!WORKSPACE_PACKAGES.includes(a.targetPackage)) {
        throw new Error(`Invalid targetPackage: ${a.targetPackage}`);
      }
    }

    const postcode = makeMappingPostcode(mapping.mappingId);
    const finalized: ComponentPackageMapping = {
      ...mapping,
      isTotal: true,
      postcode,
    };
    this.mapping = finalized;
    return finalized;
  }

  isMappingTotal(mapping: ComponentPackageMapping): boolean {
    return (
      mapping.isTotal &&
      mapping.assignments.length === 10 &&
      mapping.assignments.every((a) => a.isResolved)
    );
  }

  getAssignmentForComponent(
    mapping: ComponentPackageMapping,
    componentId: string,
  ): ComponentPackageAssignment {
    const a = mapping.assignments.find((a) => a.componentId === componentId);
    if (!a) throw new Error(`No assignment for componentId ${componentId}`);
    return a;
  }

  // Stamp each assignment with a provenanceRecordPostcode after writing audit records.
  stampProvenancePostcodes(
    mapping: ComponentPackageMapping,
    postcodeMap: Map<string, string>,
  ): ComponentPackageMapping {
    const updated: ComponentPackageMapping = {
      ...mapping,
      assignments: mapping.assignments.map((a) => ({
        ...a,
        provenanceRecordPostcode:
          postcodeMap.get(a.componentId) ?? a.provenanceRecordPostcode,
      })),
    };
    this.mapping = updated;
    return updated;
  }
}
