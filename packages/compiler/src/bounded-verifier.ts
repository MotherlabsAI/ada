import type {
  IntentGraph,
  Blueprint,
  BoundedVerificationResult,
  UncoveredGoal,
  ContradictoryInvariantPair,
} from "./types.js";

// ─── Bounded Verifier ─────────────────────────────────────────────────────────
//
// Pure deterministic function. No LLM. No I/O.
//
// Maps f: (IntentGraph, Blueprint) → BoundedVerificationResult
//
// Three checks:
//   1. Goal coverage  — each IntentGoal must be addressed by at least one
//      entity invariant, component responsibility, or workflow step
//   2. Invariant consistency — within each entity, detect predicates that
//      directly contradict each other on the same field
//   3. Provenance gaps — components whose name has no trace back to any
//      stated or derived goal (scope drift, not provenance failure)
//
// verificationBound classification:
//   complete    — all goals covered, zero contradictions, zero scope drift
//   partial     — ≥ 70% goals covered, zero contradictions
//   insufficient — < 70% goals covered OR contradictions exist

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "as",
  "from",
  "this",
  "that",
  "it",
  "its",
  "not",
  "no",
  "so",
  "must",
  "should",
  "will",
  "can",
  "may",
  "need",
  "have",
  "has",
  "all",
  "any",
  "each",
  "every",
  "some",
  "there",
  "their",
  "they",
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s\W]+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
}

function overlaps(a: Set<string>, b: Set<string>): boolean {
  for (const w of a) if (b.has(w)) return true;
  return false;
}

// ─── Goal coverage ────────────────────────────────────────────────────────────

function buildBlueprintCorpus(blueprint: Blueprint): Set<string> {
  const words = new Set<string>();

  // Entity names and invariants
  for (const entity of blueprint.dataModel.entities) {
    for (const w of extractKeywords(entity.name)) words.add(w);
    for (const inv of entity.invariants) {
      for (const w of extractKeywords(inv.predicate)) words.add(w);
      for (const w of extractKeywords(inv.description)) words.add(w);
    }
  }

  // Component names and responsibilities
  for (const comp of blueprint.architecture.components) {
    for (const w of extractKeywords(comp.name)) words.add(w);
    for (const w of extractKeywords(comp.responsibility)) words.add(w);
  }

  // Workflow step names and hoare triples
  for (const wf of blueprint.processModel.workflows) {
    for (const step of wf.steps) {
      for (const w of extractKeywords(step.name)) words.add(w);
      for (const w of extractKeywords(step.hoareTriple.postcondition))
        words.add(w);
    }
  }

  // NonFunctional requirements
  for (const nf of blueprint.nonFunctional) {
    for (const w of extractKeywords(nf.requirement)) words.add(w);
  }

  return words;
}

function checkGoalCoverage(
  intentGraph: IntentGraph,
  blueprint: Blueprint,
): readonly UncoveredGoal[] {
  const corpus = buildBlueprintCorpus(blueprint);
  const uncovered: UncoveredGoal[] = [];

  for (const goal of intentGraph.goals) {
    // Unstated goals are aspirational — only flag if stated/derived/implied
    if (goal.type === "unstated") continue;

    const keywords = extractKeywords(goal.description);
    if (keywords.size === 0) continue;

    if (!overlaps(keywords, corpus)) {
      uncovered.push({
        goalId: goal.id,
        description: goal.description,
        type: goal.type,
      });
    }
  }

  return uncovered;
}

// ─── Invariant consistency ────────────────────────────────────────────────────
//
// Detects direct contradictions within one entity's invariant set.
// Looks for pairs where the same field appears with opposing operators:
//   field > N  vs  field < N  (when N is the same bound)
//   field === true  vs  field === false
//   field !== null  vs  field === null

const NEGATION_PAIRS: ReadonlyArray<readonly [RegExp, RegExp]> = [
  [/(\w+)\s*===\s*true/i, /(\w+)\s*===\s*false/i],
  [/(\w+)\s*!==?\s*null/i, /(\w+)\s*===\s*null/i],
  [/(\w+)\s*>\s*0/i, /(\w+)\s*<\s*0/i],
  [/(\w+)\s*>=\s*1/i, /(\w+)\s*<=\s*0/i],
  [/must\s+be\s+(\w+)/i, /must\s+not\s+be\s+(\w+)/i],
  [/is\s+required/i, /is\s+optional/i],
];

function extractField(text: string, pattern: RegExp): string | null {
  const m = pattern.exec(text);
  return m?.[1] ?? null;
}

function checkInvariantConsistency(
  blueprint: Blueprint,
): readonly ContradictoryInvariantPair[] {
  const contradictions: ContradictoryInvariantPair[] = [];

  for (const entity of blueprint.dataModel.entities) {
    const invTexts = entity.invariants.map((i) =>
      `${i.predicate} ${i.description}`.toLowerCase(),
    );

    for (let i = 0; i < invTexts.length; i++) {
      for (let j = i + 1; j < invTexts.length; j++) {
        const a = invTexts[i]!;
        const b = invTexts[j]!;

        for (const [patA, patB] of NEGATION_PAIRS) {
          const fieldA = extractField(a, patA);
          const fieldB = extractField(b, patB);

          if (fieldA && fieldB && fieldA === fieldB) {
            contradictions.push({
              entity: entity.name,
              a: entity.invariants[i]!.predicate,
              b: entity.invariants[j]!.predicate,
            });
            break;
          }

          // Symmetric check
          const fieldA2 = extractField(a, patB);
          const fieldB2 = extractField(b, patA);
          if (fieldA2 && fieldB2 && fieldA2 === fieldB2) {
            contradictions.push({
              entity: entity.name,
              a: entity.invariants[i]!.predicate,
              b: entity.invariants[j]!.predicate,
            });
            break;
          }
        }
      }
    }
  }

  return contradictions;
}

// ─── Provenance gaps (scope drift) ────────────────────────────────────────────
//
// A component has a provenance gap when its name/responsibility has NO
// keyword overlap with any stated or derived goal. This indicates scope drift —
// the component was added but has no traceability to the original intent.

function checkProvenanceGaps(
  intentGraph: IntentGraph,
  blueprint: Blueprint,
): readonly string[] {
  const goalCorpus = new Set<string>();
  for (const goal of intentGraph.goals) {
    if (goal.type === "unstated") continue;
    for (const w of extractKeywords(goal.description)) goalCorpus.add(w);
  }
  for (const c of intentGraph.constraints) {
    for (const w of extractKeywords(c.description)) goalCorpus.add(w);
  }

  if (goalCorpus.size === 0) return [];

  const gaps: string[] = [];
  for (const comp of blueprint.architecture.components) {
    const compWords = new Set([
      ...extractKeywords(comp.name),
      ...extractKeywords(comp.responsibility),
    ]);
    if (!overlaps(compWords, goalCorpus)) {
      gaps.push(comp.name);
    }
  }

  return gaps;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function runBoundedVerification(
  intentGraph: IntentGraph,
  blueprint: Blueprint,
): BoundedVerificationResult {
  const totalCheckableGoals = intentGraph.goals.filter(
    (g) => g.type !== "unstated",
  ).length;

  const uncoveredGoals = checkGoalCoverage(intentGraph, blueprint);
  const contradictoryInvariants = checkInvariantConsistency(blueprint);
  const provenanceGaps = checkProvenanceGaps(intentGraph, blueprint);

  const coveredCount = totalCheckableGoals - uncoveredGoals.length;
  const coverageRatio =
    totalCheckableGoals > 0 ? coveredCount / totalCheckableGoals : 1.0;

  let verificationBound: BoundedVerificationResult["verificationBound"];

  if (
    uncoveredGoals.length === 0 &&
    contradictoryInvariants.length === 0 &&
    provenanceGaps.length === 0
  ) {
    verificationBound = "complete";
  } else if (coverageRatio >= 0.7 && contradictoryInvariants.length === 0) {
    verificationBound = "partial";
  } else {
    verificationBound = "insufficient";
  }

  return {
    uncoveredGoals,
    contradictoryInvariants,
    provenanceGaps,
    coverageRatio,
    verificationBound,
  };
}
