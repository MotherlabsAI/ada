// ─── Adaptive Depth Classifier ───────────────────────────────────────────────
//
// Pure function: classifyDepth(rawIntent) → ElicitationPlan
// No LLM call, no I/O, no side effects.
//
// Governs which of the 5 axiom-derived questions to ask before compilation.
// Derived from first-principles research (project_elicitation_axioms.md).
//
// Priority stack (from axioms A4, A7):
//   Q1 scope_boundary      — always: highest entropy reduction
//   Q2 primary_actor       — always: grounds workflow derivation
//   Q3 failure_conditions  — always: becomes invariants directly
//   Q4 workflow_disambiguation — conditional: novel/complex domain only
//   Q5 business_rule       — conditional: high-invariant domain only
//
// Hard cap: 5 questions (axiom A5).
// Zero questions: well-known trivial domain, intent ≤ 15 words.

export type QuestionType =
  | "scope_boundary"
  | "primary_actor"
  | "failure_conditions"
  | "workflow_disambiguation"
  | "business_rule";

export type QuestionTargetField = "goals" | "constraints" | "unknowns";

export interface PlannedQuestion {
  readonly type: QuestionType;
  readonly rationale: string;
  readonly priority: "mandatory" | "conditional";
  readonly targetField: QuestionTargetField;
}

export interface ElicitationPlan {
  readonly questionCount: number;
  readonly questions: readonly PlannedQuestion[];
  readonly skipReason: string | null;
  readonly confidence: "high" | "low";
  readonly domainLabel: string;
  readonly terminationReason: "ready" | "needs_elicitation";
}

// ─── Signal tables ────────────────────────────────────────────────────────────

// Well-known trivial domains — scope, actor, and core workflow are all
// inferable from the intent alone. Zero questions needed if intent is short.
const KNOWN_TRIVIAL_DOMAINS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(todo|to-do|task list|task manager)\b/i, "todo"],
  [/\b(note[- ]?taking|notes app|personal notes)\b/i, "notes"],
  [/\bblog\b/i, "blog"],
  [/\bportfolio( site| website)?\b/i, "portfolio"],
  [/\blanding page\b/i, "landing-page"],
  [/\bcalculator\b/i, "calculator"],
  [/\b(timer|countdown( timer)?)\b/i, "timer"],
  [/\b(reminder app|reminders)\b/i, "reminder"],
  [/\bchecklist\b/i, "checklist"],
  [/\bshopping list\b/i, "shopping-list"],
  [/\bhabit tracker\b/i, "habit-tracker"],
  [/\blink (saver|collector)\b/i, "bookmarks"],
  [/\bpassword manager\b/i, "password-manager"],
];

// Multi-actor vocabulary — signals Q2 (primary actor) is needed.
// When multiple actors are implied, Ada cannot safely pick one.
const MULTI_ACTOR_KEYWORDS: readonly string[] = [
  "marketplace",
  "buyer",
  "seller",
  "provider",
  "consumer",
  "vendor",
  "host",
  "guest",
  "employer",
  "employee",
  "driver",
  "rider",
  "freelancer",
  "tutor",
  "student",
  "landlord",
  "tenant",
  "coach",
  "athlete",
  "recruiter",
  "candidate",
];

// Scope-ambiguous vocabulary — broad terms that admit many interpretations.
// Presence signals Q1 (scope boundary) is needed.
const SCOPE_AMBIGUOUS_KEYWORDS: readonly string[] = [
  "platform",
  "marketplace",
  "app",
  "system",
  "tool",
  "service",
  "suite",
  "hub",
  "portal",
  "dashboard",
  "solution",
  "product",
  "ecosystem",
];

// Scope-limiting patterns — if the intent already limits scope, Q1 is not needed.
const SCOPE_LIMITING_PATTERNS: readonly RegExp[] = [
  /\bonly\b/i,
  /\bjust\b/i,
  /\bspecifically\b/i,
  /\bexclusively\b/i,
  /\bsolely\b/i,
  /\bwithout\s+\w+/i,
  /\bno\s+(registration|login|auth|payment|subscription)\b/i,
  /\bnot including\b/i,
  /\bexcluding\b/i,
];

// Failure condition patterns — if present, Q3 (failure conditions) is not needed.
const FAILURE_CONDITION_PATTERNS: readonly RegExp[] = [
  /\bshould never\b/i,
  /\bmust not\b/i,
  /\bcannot\b/i,
  /\bcan't\b/i,
  /\bprevent\s+\w+/i,
  /\bno duplicate\b/i,
  /\bavoid\s+\w+/i,
  /\bprohibit\b/i,
  /\brestrict\b/i,
  /\bnot allowed\b/i,
  /\bforbidden\b/i,
  /\bnever\s+(store|expose|share|leak|allow|accept)\b/i,
];

// High-invariant domain keywords — trigger Q5 (business rule).
// These domains have known regulatory or correctness traps.
const HIGH_INVARIANT_KEYWORDS: readonly string[] = [
  "payment",
  "billing",
  "invoice",
  "charge",
  "subscription",
  "stripe",
  "checkout",
  "health",
  "medical",
  "doctor",
  "patient",
  "clinic",
  "hipaa",
  "prescription",
  "legal",
  "contract",
  "compliance",
  "gdpr",
  "regulatory",
  "insurance",
  "claim",
  "scheduling",
  "booking",
  "appointment",
  "reservation",
  "financial",
  "banking",
  "money",
  "wallet",
  "transaction",
  "tax",
];

// Workflow complexity patterns — trigger Q4 (workflow disambiguation).
// Signals non-obvious multi-step coordination between actors or systems.
const WORKFLOW_COMPLEXITY_PATTERNS: readonly RegExp[] = [
  /\bcoordinat\w*\b/i,
  /\bbetween\s+\w+\s+and\s+\w+/i,
  /\bacross\s+(multiple|different|several)\b/i,
  /\bmulti[- ]step\b/i,
  /\bworkflow\b/i,
  /\bpipeline\b/i,
  /\bintegrat\w*\b/i,
  /\borchestrat\w*\b/i,
  /\bhandoff\b/i,
  /\bapproval\s+(process|flow|chain)\b/i,
  /\breview\s+and\s+(approve|reject)\b/i,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function detectDomain(text: string): string {
  for (const [pattern, label] of KNOWN_TRIVIAL_DOMAINS) {
    if (pattern.test(text)) return label;
  }
  if (text.toLowerCase().includes("marketplace")) return "marketplace";
  if (text.toLowerCase().includes("platform")) return "platform";
  if (matchesAnyKeyword(text, HIGH_INVARIANT_KEYWORDS)) return "high-invariant";
  return "unknown";
}

// ─── classifyDepth ────────────────────────────────────────────────────────────

/**
 * Pure function. Analyzes raw intent text and returns an ElicitationPlan
 * specifying which questions (0–5) to ask before compilation.
 *
 * No LLM call. No side effects.
 */
export function classifyDepth(rawIntent: string): ElicitationPlan {
  const text = rawIntent.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const domainLabel = detectDomain(text);
  const isTrivialDomain = KNOWN_TRIVIAL_DOMAINS.some(([p]) => p.test(text));

  // ── Fast path: trivial well-known domain with concise intent ─────────────
  // Scope, actor, and workflow are all inferable. Zero questions needed.
  if (isTrivialDomain && wordCount <= 15) {
    return {
      questionCount: 0,
      questions: [],
      skipReason: `Domain "${domainLabel}" is well-understood. Scope, actor, and workflow are all inferable.`,
      confidence: "high",
      domainLabel,
      terminationReason: "ready",
    };
  }

  const questions: PlannedQuestion[] = [];

  // ── Q1: Scope boundary ───────────────────────────────────────────────────
  // Needed when the intent uses broad scope vocabulary without explicit limits.
  // Ada proposes scope (not asks) — this gap always produces a proposal, not a question.
  // Do NOT fire on wordCount alone: detailed intents are usually specific enough for Ada to derive scope.
  const hasScopeLimiting = matchesAnyPattern(text, SCOPE_LIMITING_PATTERNS);
  const hasScopeAmbiguity = matchesAnyKeyword(text, SCOPE_AMBIGUOUS_KEYWORDS);

  if (!hasScopeLimiting && hasScopeAmbiguity) {
    questions.push({
      type: "scope_boundary",
      rationale: `Intent uses broad scope vocabulary without explicit boundaries — Ada will propose scope definition`,
      priority: "mandatory",
      targetField: "constraints",
    });
  }

  // ── Q2: Primary actor + core need ────────────────────────────────────────
  // Needed if multi-actor vocabulary or actor is not stated.
  // Primary actor determines core workflow → entity model → architecture.
  const hasMultiActor = matchesAnyKeyword(text, MULTI_ACTOR_KEYWORDS);
  const hasExplicitActor =
    /\bfor\s+(users?|customers?|clients?|employees?|admins?|managers?|teachers?|students?|team members?)\b/i.test(
      text,
    );

  if (hasMultiActor || (!hasExplicitActor && wordCount >= 4)) {
    questions.push({
      type: "primary_actor",
      rationale: hasMultiActor
        ? "Multi-actor domain — primary actor and their core goal must be determined before compilation"
        : "Actor not explicitly stated; ambiguous actor produces wrong workflow",
      priority: "mandatory",
      targetField: "goals",
    });
  }

  // ── Q3: Failure conditions ────────────────────────────────────────────────
  // Always ask unless explicitly present (A2: omissions are the #1 failure mode).
  // Failure conditions become invariants directly — highest-value question.
  const hasFailureConditions = matchesAnyPattern(
    text,
    FAILURE_CONDITION_PATTERNS,
  );

  if (!hasFailureConditions) {
    questions.push({
      type: "failure_conditions",
      rationale:
        "No failure conditions or invariants stated — these become the most critical constraints in the compiled blueprint",
      priority: "mandatory",
      targetField: "constraints",
    });
  }

  // ── Q4: Workflow disambiguation ───────────────────────────────────────────
  // Conditional: only for complex/novel domains with coordination patterns.
  const hasWorkflowComplexity = matchesAnyPattern(
    text,
    WORKFLOW_COMPLEXITY_PATTERNS,
  );

  if (hasWorkflowComplexity && !isTrivialDomain) {
    questions.push({
      type: "workflow_disambiguation",
      rationale:
        "Intent describes multi-step coordination — workflow sequence must be explicit before entity and process stages can compile correctly",
      priority: "conditional",
      targetField: "unknowns",
    });
  }

  // ── Q5: Business rule ─────────────────────────────────────────────────────
  // Conditional: only for high-invariant domains (money, health, legal, scheduling).
  const isHighInvariant = matchesAnyKeyword(text, HIGH_INVARIANT_KEYWORDS);

  if (isHighInvariant) {
    questions.push({
      type: "business_rule",
      rationale:
        "Domain has known regulatory or correctness constraints that must be made explicit before invariants can be compiled",
      priority: "conditional",
      targetField: "constraints",
    });
  }

  // Hard cap at 5 (axiom A5: ~5 question tolerance)
  const capped = questions.slice(0, 5);

  // ── Zero questions via signal analysis ───────────────────────────────────
  // Intent has enough clarity that all mandatory signals are satisfied.
  if (capped.length === 0) {
    return {
      questionCount: 0,
      questions: [],
      skipReason:
        "Intent contains sufficient scope, actor, and constraint signal for direct compilation",
      confidence: "low", // signal-based, not domain-knowledge-based
      domainLabel,
      terminationReason: "ready",
    };
  }

  return {
    questionCount: capped.length,
    questions: capped,
    skipReason: null,
    confidence: isTrivialDomain || hasScopeLimiting ? "high" : "low",
    domainLabel,
    terminationReason: "needs_elicitation",
  };
}
