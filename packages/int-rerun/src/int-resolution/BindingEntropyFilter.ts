import type { EntityBinding, FilterResult } from "../types.js";
import { PipelineError } from "../types.js";

const ENTROPY_THRESHOLD = 0.3;

/**
 * Filters EntityBindings by per-binding entropy against the hard threshold (< 0.30).
 *
 * Invariants enforced:
 *   - entityBinding.resolved === (entityBinding.perBindingEntropy < 0.30)
 *   - EntropyThreshold.value === 0.30, configurable === false
 */
export class BindingEntropyFilter {
  filterByEntropy(bindings: EntityBinding[], threshold: number): FilterResult {
    if (threshold !== ENTROPY_THRESHOLD) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `EntropyThreshold must be 0.30; got ${threshold}`,
      );
    }

    const retained: EntityBinding[] = [];
    const filteredOut: EntityBinding[] = [];
    let nullEntropyCount = 0;

    for (const binding of bindings) {
      // Handle null/NaN entropy: treat as >= threshold → filter out
      if (
        binding.perBindingEntropy === null ||
        binding.perBindingEntropy === undefined ||
        Number.isNaN(binding.perBindingEntropy)
      ) {
        nullEntropyCount++;
        console.warn(
          `[BindingEntropyFilter] null/NaN entropy on bindingId=${binding.bindingId}; filtering out`,
        );
        binding.state = "FILTERED_OUT";
        filteredOut.push(binding);
        continue;
      }

      if (binding.perBindingEntropy < threshold) {
        binding.state = "RESOLVED";
        retained.push(binding);
      } else {
        binding.state = "FILTERED_OUT";
        filteredOut.push(binding);
      }
    }

    if (nullEntropyCount > 0) {
      console.warn(
        `[BindingEntropyFilter] ${nullEntropyCount} bindings had null/NaN entropy (data quality issue)`,
      );
    }

    if (retained.length === 0) {
      throw new PipelineError(
        "NO_BINDINGS_RETAINED",
        "Zero bindings survived the entropy filter; cannot produce artifact. Escalate to pipeline operator.",
      );
    }

    return {
      retained,
      filteredOut,
      retainedCount: retained.length,
    };
  }

  classifyBinding(binding: EntityBinding): "RESOLVED" | "FILTERED_OUT" {
    if (binding.perBindingEntropy < ENTROPY_THRESHOLD) {
      return "RESOLVED";
    }
    return "FILTERED_OUT";
  }
}
