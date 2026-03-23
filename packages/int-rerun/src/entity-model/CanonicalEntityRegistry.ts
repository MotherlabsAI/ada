import type { CanonicalEntity } from "../types.js";
import type { PipelineStore } from "../store.js";
import { PipelineError } from "../types.js";

/**
 * Reference data source for CanonicalEntity lookup.
 *
 * Invariants enforced:
 *   - canonicalEntity.entityId !== null && length > 0
 *   - canonicalEntity.label !== null && length > 0
 *   - all entityId values are unique within the context
 */
export class CanonicalEntityRegistry {
  constructor(private readonly store: PipelineStore) {}

  getEntityById(entityId: string): CanonicalEntity {
    const entity = this.store.getCanonicalEntity(entityId);
    if (entity === undefined) {
      throw new PipelineError(
        "ENTITY_NOT_FOUND",
        `CanonicalEntity not found: ${entityId}`,
      );
    }
    this.assertInvariants(entity);
    return entity;
  }

  entityExists(entityId: string): boolean {
    return this.store.getCanonicalEntity(entityId) !== undefined;
  }

  getEntitiesByIds(entityIds: string[]): CanonicalEntity[] {
    return entityIds.map((id) => this.getEntityById(id));
  }

  private assertInvariants(entity: CanonicalEntity): void {
    if (!entity.entityId || entity.entityId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "CanonicalEntity.entityId must be non-empty",
      );
    }
    if (!entity.label || entity.label.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "CanonicalEntity.label must be non-empty",
      );
    }
  }
}
