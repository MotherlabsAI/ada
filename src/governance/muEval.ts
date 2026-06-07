/**
 * μ-eval — make Δμ across self-application turns SIGNAL, not run-to-run noise.
 *
 * The compile is stochastic, so a single μ pair (65 vs 51) proves a direction, not a
 * magnitude. This aggregates μ over N runs per arm (intent-only vs repo-aware) and reports
 * whether the arms genuinely SEPARATE. It is the non-circular measure the field lacks: μ is
 * a uniform structural count of open holes (memory: context-engineering-research), computed
 * identically for both arms — the grading is not authored inside either artifact, so there is
 * no pack-scope circularity (the failure that sank the A8 runs; see [[a8-next-experiment]]).
 *
 * Pure, deterministic — no model (A3). The runner feeds it μ samples; this just does the math.
 */
export interface MuStats {
  n: number;
  mean: number;
  min: number;
  max: number;
  stdev: number;
}

export function muStats(samples: number[]): MuStats {
  const n = samples.length;
  if (!n) return { n: 0, mean: 0, min: 0, max: 0, stdev: 0 };
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n; // population
  return {
    n,
    mean,
    min: Math.min(...samples),
    max: Math.max(...samples),
    stdev: Math.sqrt(variance),
  };
}

/**
 * Which direction counts as "better": `lower` for μ (fewer holes = converged), `higher`
 * for μ′ (more grounded unknowns = better excavation). Default `lower` (back-compat).
 */
export type BetterDirection = "lower" | "higher";

export interface ArmComparison {
  baseline: MuStats;
  treatment: MuStats;
  direction: BetterDirection;
  /** baseline.mean − treatment.mean (signed, unchanged regardless of direction) */
  deltaMean: number;
  /** every treatment run strictly below every baseline run (clean separation, lower-is-better) */
  strictlyBelow: boolean;
  /** every treatment run strictly above every baseline run (clean separation, higher-is-better) */
  strictlyAbove: boolean;
  /** the favourable-direction Δ exceeds the combined spread → signal, not run-to-run noise */
  separated: boolean;
}

export function compareArms(
  baseline: number[],
  treatment: number[],
  direction: BetterDirection = "lower",
): ArmComparison {
  const b = muStats(baseline);
  const t = muStats(treatment);
  const deltaMean = b.mean - t.mean;
  const both = baseline.length > 0 && treatment.length > 0;
  const strictlyBelow = both && Math.max(...treatment) < Math.min(...baseline);
  const strictlyAbove = both && Math.min(...treatment) > Math.max(...baseline);
  // improvement in the favourable direction must clear the combined spread
  const improvement = direction === "lower" ? deltaMean : -deltaMean;
  const separated = improvement > 0 && improvement > b.stdev + t.stdev;
  return {
    baseline: b,
    treatment: t,
    direction,
    deltaMean,
    strictlyBelow,
    strictlyAbove,
    separated,
  };
}
