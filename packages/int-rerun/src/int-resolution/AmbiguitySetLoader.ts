import type { AmbiguitySet } from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";
import type { CanonicalEntityRegistry } from "../entity-model/CanonicalEntityRegistry.js";

const EXPECTED_ENTITY_COUNT = 26;

/**
 * Hydrates the AmbiguitySet from the prior run's identified ambiguous entities.
 *
 * Invariants enforced:
 *   - ambiguitySet.entityCount === ambiguitySet.memberEntityIds.length
 *   - ambiguitySet.entityCount >= 1
 *   - ambiguitySet.sourceRunId non-empty
 *   - For this invocation: entityCount === 26 (C4)
 */
export class AmbiguitySetLoader {
  constructor(
    private readonly store: PipelineStore,
    private readonly registry: CanonicalEntityRegistry,
  ) {}

  loadAmbiguitySet(sourceRunId: string): AmbiguitySet {
    if (!sourceRunId || sourceRunId.length === 0) {
      throw new PipelineError(
        "AMBIGUITY_SET_MISSING",
        "sourceRunId must be non-empty",
      );
    }

    const set = this.store.getAmbiguitySet(sourceRunId);
    if (set === undefined) {
      throw new PipelineError(
        "AMBIGUITY_SET_MISSING",
        `AmbiguitySet not found for sourceRunId=${sourceRunId}; expected entityCount=${EXPECTED_ENTITY_COUNT}`,
      );
    }

    // Validate entity count matches expected
    if (!this.validateSetBounds(set, EXPECTED_ENTITY_COUNT)) {
      throw new PipelineError(
        "AMBIGUITY_SET_MISSING",
        `entityCount discrepancy: expected=${EXPECTED_ENTITY_COUNT}, actual=${set.entityCount}`,
      );
    }

    // Verify each entityId resolves in registry
    const activeIds: string[] = [];
    const staleIds: string[] = [];

    for (const entityId of set.memberEntityIds) {
      if (this.registry.entityExists(entityId)) {
        activeIds.push(entityId);
      } else {
        staleIds.push(entityId);
        console.warn(
          `[AmbiguitySetLoader] STALE_MEMBER: entityId=${entityId} not found in registry; removing from active set`,
        );
      }
    }

    if (activeIds.length === 0) {
      throw new PipelineError(
        "AMBIGUITY_SET_MISSING",
        "All 26 member entities are stale; cannot proceed",
      );
    }

    if (activeIds.length < EXPECTED_ENTITY_COUNT) {
      console.warn(
        `[AmbiguitySetLoader] PARTIAL_AMBIGUITY_SET: retained ${activeIds.length}/${EXPECTED_ENTITY_COUNT} entities after stale removal`,
      );
    }

    // Build hydrated set with only active members
    const hydrated: AmbiguitySet = {
      setId: set.setId,
      entityCount: activeIds.length,
      memberEntityIds: activeIds,
      sourceRunId: set.sourceRunId,
    };

    this.assertInvariants(hydrated);
    return hydrated;
  }

  validateSetBounds(
    ambiguitySet: AmbiguitySet,
    expectedCount: number,
  ): boolean {
    return (
      ambiguitySet.entityCount === ambiguitySet.memberEntityIds.length &&
      ambiguitySet.entityCount === expectedCount &&
      ambiguitySet.entityCount >= 1
    );
  }

  private assertInvariants(set: AmbiguitySet): void {
    if (set.entityCount !== set.memberEntityIds.length) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `AmbiguitySet.entityCount (${set.entityCount}) !== memberEntityIds.length (${set.memberEntityIds.length})`,
      );
    }
    if (set.entityCount < 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AmbiguitySet.entityCount must be >= 1",
      );
    }
    if (!set.sourceRunId || set.sourceRunId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AmbiguitySet.sourceRunId must be non-empty",
      );
    }
  }
}
