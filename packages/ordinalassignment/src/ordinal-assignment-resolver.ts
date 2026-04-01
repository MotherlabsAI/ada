import {
  BlueprintRegistryService,
  C3GapResolver,
  ComponentPackageMappingService,
  ProvenanceRecordWriter,
  WORKSPACE_PACKAGE_NODES,
} from "@ada/ent";
import type {
  BlueprintComponentRegistry,
  C3AssignmentGap,
  C3GapState,
  ComponentPackageAssignment,
  ComponentPackageMapping,
  WorkspacePackageNode,
} from "@ada/ent";

export type {
  C3AssignmentGap,
  ComponentPackageAssignment,
  ComponentPackageMapping,
  C3GapState,
};

/**
 * OrdinalAssignmentResolver
 *
 * Manages ComponentPackageMapping lifecycle, detects C3AssignmentGap at
 * ordinal 3, executes the collapse-only resolution strategy per the
 * c3-gap-collapse-resolution workflow, writes resolution provenance
 * postcodes, and asserts mapping totality (all 10 assignments resolved).
 *
 * Invariants:
 *   - C3AssignmentGap.componentOrdinal === 3
 *   - Collapse is the only permitted resolution strategy
 *   - ComponentPackageMapping.isTotal === true after resolution
 *   - All 10 assignments must be resolved with provenanceRecordPostcode
 */
export class OrdinalAssignmentResolver {
  private readonly registryService: BlueprintRegistryService;
  private readonly c3Resolver: C3GapResolver;
  private readonly mappingService: ComponentPackageMappingService;
  private readonly provenanceWriter: ProvenanceRecordWriter;
  private currentMapping: ComponentPackageMapping | null = null;

  constructor(writer?: ProvenanceRecordWriter) {
    this.registryService = new BlueprintRegistryService();
    this.c3Resolver = new C3GapResolver(this.registryService);
    this.mappingService = new ComponentPackageMappingService();
    this.provenanceWriter = writer ?? new ProvenanceRecordWriter();
  }

  buildMapping(
    registry: BlueprintComponentRegistry,
    packages: WorkspacePackageNode[],
  ): ComponentPackageMapping {
    const components = this.registryService.enumerateComponents();
    void registry;
    const mapping = this.mappingService.buildInitialMapping(
      components,
      packages,
    );
    this.currentMapping = mapping;
    return mapping;
  }

  detectC3Gap(mapping: ComponentPackageMapping): C3AssignmentGap | null {
    const unresolved = mapping.assignments.filter((a) => !a.isResolved);
    if (unresolved.length === 0) return null;

    const c3Unresolved = unresolved.find((a) => a.componentOrdinal === 3);
    if (!c3Unresolved) return null;

    const gap = this.c3Resolver.getGap();
    if (gap.componentOrdinal !== 3) {
      throw new Error(
        `Invariant violation: C3AssignmentGap.componentOrdinal must be 3, got ${gap.componentOrdinal}`,
      );
    }
    return gap;
  }

  collapseC3Gap(
    _gap: C3AssignmentGap,
    _candidates: WorkspacePackageNode[],
  ): ComponentPackageAssignment {
    const resolved = this.c3Resolver.resolve();
    const components = this.registryService.enumerateComponents();
    const c3Component = components.find((c) => c.ordinal === 3);
    if (!c3Component) {
      throw new Error(
        "Invariant violation: ordinal-3 component not found in registry",
      );
    }
    return {
      assignmentId: `assign-c3-${c3Component.componentId}`,
      mappingId: `mapping-ML.ENT.e80e3c97/v1`,
      componentId: c3Component.componentId,
      componentOrdinal: 3,
      componentName: c3Component.name,
      targetPackage: resolved.resolvedPackage!,
      isResolved: true,
      provenanceRecordPostcode: resolved.resolutionProvenancePostcode,
    };
  }

  assertMappingTotality(mapping: ComponentPackageMapping): boolean {
    if (!mapping.isTotal) {
      throw new Error(
        `Invariant violation: ComponentPackageMapping.isTotal must be true after resolution`,
      );
    }
    if (mapping.assignmentCount !== 10) {
      throw new Error(
        `Invariant violation: assignmentCount must be 10, got ${mapping.assignmentCount}`,
      );
    }
    const unresolved = mapping.assignments.filter((a) => !a.isResolved);
    if (unresolved.length > 0) {
      throw new Error(
        `Invariant violation: ${unresolved.length} assignments are still unresolved`,
      );
    }
    return true;
  }

  getAssignment(ordinal: number): ComponentPackageAssignment | null {
    if (!this.currentMapping) return null;
    return (
      this.currentMapping.assignments.find(
        (a) => a.componentOrdinal === ordinal,
      ) ?? null
    );
  }

  getGapState(): C3GapState {
    return this.c3Resolver.getGap().state;
  }

  /**
   * Convenience method: build mapping, detect C3 gap, collapse it, finalize.
   * Returns the total ComponentPackageMapping.
   */
  resolveFullMapping(): ComponentPackageMapping {
    const nodes = WORKSPACE_PACKAGE_NODES;
    const registry = this.registryService.getRegistry();
    let mapping = this.buildMapping(registry, nodes);

    const gap = this.detectC3Gap(mapping);
    if (gap) {
      const resolvedGap = this.c3Resolver.resolve();
      mapping = this.mappingService.applyC3Resolution(mapping, resolvedGap);
      mapping = this.mappingService.finalizeMapping(mapping);

      // Stamp provenance postcodes
      const postcodeMap = new Map<string, string>();
      for (const a of mapping.assignments) {
        if (a.componentOrdinal === 3) {
          postcodeMap.set(
            a.componentId,
            resolvedGap.resolutionProvenancePostcode!,
          );
        } else {
          const rec = this.provenanceWriter.writeRecord(
            "ASSIGNMENT_CONFIRMED",
            a.componentId,
            "ENT",
            [mapping.postcode ?? ""],
          );
          postcodeMap.set(a.componentId, rec.postcode);
        }
      }
      mapping = this.mappingService.stampProvenancePostcodes(
        mapping,
        postcodeMap,
      );
    }

    this.currentMapping = mapping;
    return mapping;
  }
}
