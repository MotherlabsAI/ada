import {
  BlueprintRegistryService,
  C3GapResolver as EntC3GapResolver,
  ComponentPackageMappingService,
  WORKSPACE_PACKAGE_NODES,
} from "@ada/ent";
import type {
  BlueprintComponentRegistry,
  C3AssignmentGap,
  ComponentPackageAssignment,
  ComponentPackageMapping,
  WorkspacePackageNode,
} from "@ada/ent";

export type {
  C3AssignmentGap,
  ComponentPackageAssignment,
  ComponentPackageMapping,
};

/**
 * C3GapCollapseResolver
 *
 * Detects the C3AssignmentGap at ordinal-3, resolves it via collapse
 * strategy (not reassignment), and commits the collapsed assignment into
 * the ComponentPackageMapping.
 *
 * Transitions C3AssignmentGap: undetected → detected → resolving → collapsed
 * Produces ComponentPackageAssignment entries for all 10 ordinals and
 * a total ComponentPackageMapping (isTotal=true).
 */
export class C3GapCollapseResolver {
  private readonly registryService: BlueprintRegistryService;
  private readonly resolver: EntC3GapResolver;
  private readonly mappingService: ComponentPackageMappingService;

  constructor() {
    this.registryService = new BlueprintRegistryService();
    this.resolver = new EntC3GapResolver(this.registryService);
    this.mappingService = new ComponentPackageMappingService();
  }

  detectC3Gap(registry: BlueprintComponentRegistry): C3AssignmentGap {
    const gap = this.resolver.getGap();
    if (gap.componentOrdinal !== 3) {
      throw new Error(
        `Invariant violation: C3AssignmentGap.componentOrdinal must be 3, got ${gap.componentOrdinal}`,
      );
    }
    void registry;
    return gap;
  }

  evaluateCollapseTarget(
    gap: C3AssignmentGap,
    workspaceNodes: WorkspacePackageNode[],
  ): ComponentPackageAssignment {
    const resolved = this.resolver.resolve();
    void workspaceNodes;
    const components = this.registryService.enumerateComponents();
    const c3Component = components.find((c) => c.ordinal === 3)!;
    return {
      assignmentId: `assign-${c3Component.componentId}`,
      mappingId: `mapping-ML.ENT.e80e3c97/v1`,
      componentId: c3Component.componentId,
      componentOrdinal: 3,
      componentName: c3Component.name,
      targetPackage: resolved.resolvedPackage!,
      isResolved: true,
      provenanceRecordPostcode: resolved.resolutionProvenancePostcode,
    };
  }

  commitCollapse(
    gap: C3AssignmentGap,
    _assignment: ComponentPackageAssignment,
  ): C3AssignmentGap {
    if (gap.isResolved) return gap;
    return this.resolver.resolve();
  }

  buildPackageMapping(
    assignments: ComponentPackageAssignment[],
  ): ComponentPackageMapping {
    if (assignments.length !== 10) {
      throw new Error(`Expected 10 assignments, got ${assignments.length}`);
    }
    const unresolved = assignments.filter((a) => !a.isResolved);
    if (unresolved.length > 0) {
      throw new Error(
        `Cannot build total mapping: ${unresolved.length} unresolved assignments`,
      );
    }
    const components = this.registryService.enumerateComponents();
    let mapping = this.mappingService.buildInitialMapping(
      components,
      WORKSPACE_PACKAGE_NODES,
    );
    const resolvedGap = this.resolver.getGap().isResolved
      ? this.resolver.getGap()
      : this.resolver.resolve();
    mapping = this.mappingService.applyC3Resolution(mapping, resolvedGap);
    mapping = this.mappingService.finalizeMapping(mapping);
    return mapping;
  }
}
