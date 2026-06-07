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

export interface ArmComparison {
  baseline: MuStats;
  treatment: MuStats;
  /** baseline.mean − treatment.mean; positive = treatment has fewer open holes */
  deltaMean: number;
  /** every treatment run strictly below every baseline run (the strongest, clean separation) */
  strictlyBelow: boolean;
  /** Δ mean exceeds the combined spread → a trustworthy signal, not run-to-run noise */
  separated: boolean;
}

export function compareArms(
  baseline: number[],
  treatment: number[],
): ArmComparison {
  const b = muStats(baseline);
  const t = muStats(treatment);
  const deltaMean = b.mean - t.mean;
  const strictlyBelow =
    baseline.length > 0 &&
    treatment.length > 0 &&
    Math.max(...treatment) < Math.min(...baseline);
  const separated = deltaMean > 0 && deltaMean > b.stdev + t.stdev;
  return { baseline: b, treatment: t, deltaMean, strictlyBelow, separated };
}
