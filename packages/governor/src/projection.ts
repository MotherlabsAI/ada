import type { Blueprint } from "@ada/compiler";

export interface DriftThreshold {
  readonly invariantPredicate: string;
  readonly severity: "critical" | "major" | "minor";
  readonly threshold: number; // 0.0–1.0 drift score that triggers this threshold
}

export interface ProjectionEngine {
  readonly thresholds: readonly DriftThreshold[];
  readonly baselineConfidence: number;
  readonly sessionStartMs: number;
  evaluate(
    driftCount: number,
    criticalCount: number,
    confidence: number,
  ): {
    shouldAlert: boolean;
    reason: string | null;
  };
}

export function computeDriftThresholds(
  blueprint: Blueprint,
): readonly DriftThreshold[] {
  const thresholds: DriftThreshold[] = [];

  const collectInvariants = (predicates: readonly string[]): void => {
    for (const predicate of predicates) {
      const lower = predicate.toLowerCase();
      let severity: "critical" | "major" | "minor";
      let threshold: number;

      if (
        lower.includes("must not") ||
        lower.includes("never") ||
        lower.includes("always")
      ) {
        severity = "critical";
        threshold = 0.1;
      } else if (lower.includes("should")) {
        severity = "major";
        threshold = 0.3;
      } else {
        severity = "minor";
        threshold = 0.5;
      }

      thresholds.push({ invariantPredicate: predicate, severity, threshold });
    }
  };

  // Collect from bounded context invariants
  for (const ctx of blueprint.dataModel.boundedContexts) {
    collectInvariants(ctx.invariants.map((inv) => inv.predicate));
  }

  // Collect from entity-level invariants
  for (const entity of blueprint.dataModel.entities) {
    collectInvariants(entity.invariants.map((inv) => inv.predicate));
  }

  return thresholds;
}

export function createProjectionEngine(blueprint: Blueprint): ProjectionEngine {
  const thresholds = computeDriftThresholds(blueprint);

  // Derive a baseline confidence from the blueprint audit if available,
  // otherwise default to 1.0 (clean slate).
  const baselineConfidence = blueprint.audit?.confidence ?? 1.0;
  const sessionStartMs = Date.now();

  return {
    thresholds,
    baselineConfidence,
    sessionStartMs,
    evaluate(driftCount, criticalCount, confidence) {
      if (driftCount > 5 || criticalCount > 0) {
        const reason =
          criticalCount > 0
            ? `${criticalCount} critical drift signal${criticalCount === 1 ? "" : "s"} detected`
            : `high drift volume: ${driftCount} signals in this tick`;
        return { shouldAlert: true, reason };
      }

      if (confidence < baselineConfidence * 0.8) {
        const pct = Math.round(confidence * 100);
        const basePct = Math.round(baselineConfidence * 100);
        return {
          shouldAlert: true,
          reason: `confidence ${pct}% is below 80% of baseline ${basePct}%`,
        };
      }

      return { shouldAlert: false, reason: null };
    },
  };
}
