import type { EntityBinding, AggregateEntropy } from "../types.js";
import { PipelineError } from "../types.js";

const HARD_CAP = 0.3 as const;

/**
 * Computes aggregate entropy across all resolved bindings for a run.
 * Evaluates the G4 exit criterion (aggregate entropy <= 0.30).
 *
 * Invariants enforced:
 *   - aggregateEntropy.value in [0,1]
 *   - aggregateEntropy.bindingCount >= 0
 *   - aggregateEntropy.runId non-empty
 *   - aggregateEntropy.hardCap === 0.30
 *   - aggregateEntropy.satisfiesConstraint === (value <= 0.30)
 */
export class AggregateEntropyCalculator {
  computeAggregateEntropy(
    bindings: EntityBinding[],
    runId: string,
  ): AggregateEntropy {
    if (!runId || runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AggregateEntropy.runId must be non-empty",
      );
    }

    if (bindings.length === 0) {
      throw new PipelineError(
        "EMPTY_BINDING_SET",
        "Cannot compute aggregate entropy over zero bindings; this state should have been caught in BindingEntropyFilter",
      );
    }

    const sum = bindings.reduce((acc, b) => acc + b.perBindingEntropy, 0);
    const value = sum / bindings.length;

    if (value < 0 || value > 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `Computed aggregateEntropy=${value} is outside [0,1]`,
      );
    }

    // Re-verify each retained binding's entropy if aggregate exceeds hard cap
    if (value > HARD_CAP) {
      const offenders = bindings.filter((b) => b.perBindingEntropy >= HARD_CAP);
      if (offenders.length > 0) {
        console.error(
          `[AggregateEntropyCalculator] ${offenders.length} bindings have perBindingEntropy >= 0.30 but passed filter — arithmetic anomaly`,
        );
      }
      throw new PipelineError(
        "G4_FAILED",
        `Aggregate entropy ${value.toFixed(4)} exceeds hard cap 0.30; failing G4. Abort artifact production.`,
      );
    }

    const aggregateEntropy: AggregateEntropy = {
      value,
      bindingCount: bindings.length,
      runId,
      hardCap: HARD_CAP,
      satisfiesConstraint: value <= HARD_CAP,
      priorRunValue: 0.72,
    };

    this.assertInvariants(aggregateEntropy);
    return aggregateEntropy;
  }

  evaluateExitCriterion(
    aggregateEntropy: AggregateEntropy,
    targetThreshold: number,
  ): boolean {
    if (targetThreshold !== HARD_CAP) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `Target threshold must be 0.30; got ${targetThreshold}`,
      );
    }
    return aggregateEntropy.satisfiesConstraint;
  }

  private assertInvariants(ae: AggregateEntropy): void {
    if (!ae.runId || ae.runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AggregateEntropy.runId must be non-empty",
      );
    }
    if (ae.bindingCount < 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AggregateEntropy.bindingCount must be >= 0",
      );
    }
    if (ae.value < 0 || ae.value > 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `AggregateEntropy.value=${ae.value} out of [0,1]`,
      );
    }
    if (ae.hardCap !== HARD_CAP) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "AggregateEntropy.hardCap must be 0.30",
      );
    }
    if (ae.satisfiesConstraint !== ae.value <= ae.hardCap) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `AggregateEntropy.satisfiesConstraint inconsistent with value=${ae.value}`,
      );
    }
  }
}
