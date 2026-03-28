import { BlueprintRegistryService } from "@ada/ent";
import type {
  BlueprintComponentRegistry,
  NamedBlueprintComponent,
} from "@ada/ent";

export type { BlueprintComponentRegistry, NamedBlueprintComponent };

/**
 * BlueprintRegistryLoader
 *
 * Loads and validates the BlueprintComponentRegistry containing exactly
 * 10 NamedBlueprintComponents. Enforces:
 *   - totalComponentCount === 10
 *   - components.length === 10
 *   - each component has non-null componentId, name, registryId
 *   - ordinals are in range [1, 10]
 */
export class BlueprintRegistryLoader {
  private readonly service: BlueprintRegistryService;

  constructor() {
    this.service = new BlueprintRegistryService();
  }

  loadRegistry(pipelineRunId: string): BlueprintComponentRegistry {
    const registry = this.service.getRegistry();
    if (registry.pipelineRunId !== pipelineRunId) {
      throw new Error(
        `Registry pipelineRunId mismatch: expected ${pipelineRunId}, got ${registry.pipelineRunId}`,
      );
    }
    this.validateRegistryInvariants(registry);
    return registry;
  }

  getComponentByOrdinal(
    _registry: BlueprintComponentRegistry,
    ordinal: number,
  ): NamedBlueprintComponent {
    return this.service.getComponentByOrdinal(ordinal);
  }

  validateRegistryInvariants(registry: BlueprintComponentRegistry): boolean {
    if (registry.totalComponentCount !== 10) {
      throw new Error(
        `Invariant violation: totalComponentCount must be 10, got ${registry.totalComponentCount}`,
      );
    }
    if (registry.components.length !== 10) {
      throw new Error(
        `Invariant violation: components.length must be 10, got ${registry.components.length}`,
      );
    }
    if (!registry.registryId || registry.registryId.length === 0) {
      throw new Error(
        "Invariant violation: registryId must be non-null and non-empty",
      );
    }
    if (!registry.pipelineRunId || registry.pipelineRunId.length === 0) {
      throw new Error(
        "Invariant violation: pipelineRunId must be non-null and non-empty",
      );
    }
    return this.service.validateRegistryIntegrity();
  }
}
