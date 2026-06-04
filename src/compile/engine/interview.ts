/**
 * The `ada ctx init` interview state machine — model-driven at COMPILE TIME (AXIOM A1),
 * finite, and run-and-exit (AXIOM A6/A9). Each turn is ONE model call via the injected
 * `ModelClient` (so the network stays in engine/model.ts): the running transcript (root
 * intent + answers so far) goes in, the next step comes back as strict JSON
 * `{ question, options, allowOther, field, done }`. Parsing, Seed accumulation, and the
 * termination guarantee are PURE and model-free (AXIOM A3); the grep-guard test asserts no
 * network token lives in this file.
 *
 * This is NEVER a session/daemon: a HARD turn cap bounds the loop, and the caller writes the
 * Seed and exits. The loop is factored so it is testable headlessly with a stubbed model — no
 * Ink, no live calls.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Seed } from "../../core/types.js";
import { resolvePromptDir } from "./excavate.js";
import type { ModelClient } from "./model.js";

/** The HARD turn cap (AXIOM A6/A9): the loop asks at most this many questions, ever. */
export const MAX_TURNS = 20;

/**
 * The `Seed` fields the interview is allowed to fill. Scalar fields are overwritten by the
 * latest answer; the multi-valued fields accumulate. `rootIntent` is set from the opening
 * prompt, not asked — but is allowed here so the model may refine it.
 */
export type SeedScalarField =
  | "rootIntent"
  | "domain"
  | "userRole"
  | "buildObjective"
  | "knowledgeObjective"
  | "trustObjective";

export type SeedListField =
  | "knownContext"
  | "unknownContext"
  | "assumptions"
  | "constraints"
  | "risks";

export type SeedField = SeedScalarField | SeedListField;

const SCALAR_FIELDS: readonly SeedScalarField[] = [
  "rootIntent",
  "domain",
  "userRole",
  "buildObjective",
  "knowledgeObjective",
  "trustObjective",
];
const LIST_FIELDS: readonly SeedListField[] = [
  "knownContext",
  "unknownContext",
  "assumptions",
  "constraints",
  "risks",
];

const SCALAR_SET = new Set<string>(SCALAR_FIELDS);
const LIST_SET = new Set<string>(LIST_FIELDS);

/** True when `field` is a Seed field the interview may write. */
export function isSeedField(field: string): field is SeedField {
  return SCALAR_SET.has(field) || LIST_SET.has(field);
}

/** One model-proposed step in the interview. */
export interface InterviewStep {
  /** The question Ada asks this turn. */
  question: string;
  /** 3–5 pickable options. May be empty on a malformed step. */
  options: string[];
  /** Whether the "✎ type my own…" affordance is offered (always true in practice). */
  allowOther: boolean;
  /** Which Seed field this answer fills (must be a SeedField to take effect). */
  field: string;
  /** The model's signal that the interview is complete. */
  done: boolean;
}

/** A recorded turn: the step the model proposed and the answer the user gave. */
export interface InterviewTurn {
  step: InterviewStep;
  answer: string;
}

function arr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.map((x) => String(x).trim()).filter((s) => s.length > 0)
    : [];
}

/**
 * Deterministic parse of the model's JSON step (PURE — no model, A3). Tolerates a bare JSON
 * object or fenced JSON. Clamps `options` to 3–5 entries when more are returned; never throws
 * on a missing key — a malformed step degrades to an empty question that the caller treats as
 * a stop (so a garbled model can never hang the loop).
 */
export function parseInterviewStep(raw: string): InterviewStep {
  const text = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let o: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      o = parsed as Record<string, unknown>;
    }
  } catch {
    o = {};
  }
  // Cap options at 5 (the spec's upper bound); keep order, drop blanks.
  const options = arr(o["options"]).slice(0, 5);
  return {
    question: String(o["question"] ?? "").trim(),
    options,
    // The affordance is always offered unless the model explicitly disables it.
    allowOther: o["allowOther"] === false ? false : true,
    field: String(o["field"] ?? "").trim(),
    done: o["done"] === true,
  };
}

/**
 * Apply one answer to the Seed (PURE). Scalar fields overwrite; list fields accumulate
 * (deduped, blanks dropped). An unknown/blank field or a blank answer is a no-op — the
 * answer is still recorded in the transcript by the caller, just not bound to the Seed.
 */
export function applyAnswer(seed: Seed, field: string, answer: string): Seed {
  const value = answer.trim();
  if (!value || !isSeedField(field)) return seed;
  if (SCALAR_SET.has(field)) {
    return { ...seed, [field]: value };
  }
  const key = field as SeedListField;
  const existing = seed[key];
  if (existing.includes(value)) return seed;
  return { ...seed, [key]: [...existing, value] };
}

/**
 * Build the interviewer prompt: the versioned template + the running transcript (root intent
 * + every prior question/answer) + which fields are still unfilled, so the model can generate
 * the next RELEVANT question and SKIP what prior answers already settled. Pure string work.
 */
export function buildInterviewPrompt(
  template: string,
  seed: Seed,
  turns: InterviewTurn[],
): string {
  const askedFields = new Set(turns.map((t) => t.step.field));
  const remaining = [...SCALAR_FIELDS, ...LIST_FIELDS].filter(
    (f) => !askedFields.has(f),
  );
  const lines = [
    template,
    "",
    "## TRANSCRIPT SO FAR",
    `root intent: ${seed.rootIntent}`,
    `turns asked: ${turns.length} of a hard cap of ${MAX_TURNS}`,
  ];
  if (turns.length === 0) {
    lines.push("(no questions asked yet — generate the FIRST question)");
  } else {
    for (const t of turns) {
      lines.push(
        `Q (${t.step.field || "—"}): ${t.step.question}`,
        `A: ${t.answer}`,
      );
    }
  }
  lines.push(
    "",
    "## FIELDS STILL UNFILLED",
    remaining.length ? remaining.join(", ") : "(all fields have an answer)",
    "",
    "## OUTPUT",
    "Return ONE step as strict JSON (no prose, no code fences) with keys:",
    '{ "question": "<one question>", "options": ["<3–5 picks>"],',
    '  "allowOther": true, "field": "<one Seed field from the list above>",',
    '  "done": <true ONLY when no further question would add real signal> }.',
    "Generate the next RELEVANT question; SKIP anything prior answers already settled.",
  );
  return lines.join("\n");
}

/** Load the versioned interviewer prompt (module-relative, so the built CLI finds it). */
export function loadInterviewerPrompt(): string {
  return readFileSync(join(resolvePromptDir(), "interviewer.md"), "utf8");
}

/**
 * One compile-time model call (A1/A9) → the next interview step for the current transcript.
 * Pure except for the single injected model call; parsing is deterministic.
 */
export async function nextStep(
  model: ModelClient,
  seed: Seed,
  turns: InterviewTurn[],
  template: string = loadInterviewerPrompt(),
): Promise<InterviewStep> {
  const prompt = buildInterviewPrompt(template, seed, turns);
  const raw = await model.complete(prompt); // the ONE model call this turn (A1/A9)
  return parseInterviewStep(raw);
}

/** How a finished interview ended — used by the caller for the exit message. */
export type InterviewStopReason = "done" | "cap" | "empty";

export interface InterviewResult {
  /** The Seed, with every answer mapped to its field. */
  seed: Seed;
  /** The full transcript (one entry per asked-and-answered turn). */
  turns: InterviewTurn[];
  /** Why the loop stopped: model said `done`, the hard cap hit, or a step came back empty. */
  stopReason: InterviewStopReason;
}

/**
 * Drive the interview to completion HEADLESSLY (no Ink) against an injected model and an
 * injected `answer` function (the UI, or a scripted stub in tests). This is the single source
 * of truth for the loop's behaviour:
 *
 *   - asks at most MAX_TURNS questions — the TERMINATION GUARANTEE: even if the model NEVER
 *     says `done`, the loop stops at the cap (it can never become a session/daemon, A6/A9);
 *   - stops as soon as the model returns `done: true` (before asking);
 *   - stops if a step parses to an empty question (a garbled model can't hang the loop);
 *   - maps each answer to its `field` via `applyAnswer` (scalars overwrite, lists accumulate),
 *     so a "type my own" free-text answer is captured into its field exactly like a pick.
 *
 * `answer(step, turnIndex)` returns the user's chosen/typed string, or `null`/`undefined` to
 * abort early (e.g. the user quit the UI) — also a clean, non-hanging stop.
 */
export async function runInterview(
  model: ModelClient,
  initialSeed: Seed,
  answer: (
    step: InterviewStep,
    turnIndex: number,
  ) => Promise<string | null | undefined> | string | null | undefined,
  options: { maxTurns?: number; template?: string } = {},
): Promise<InterviewResult> {
  const cap = Math.max(1, Math.min(options.maxTurns ?? MAX_TURNS, MAX_TURNS));
  let seed = initialSeed;
  const turns: InterviewTurn[] = [];

  for (let i = 0; i < cap; i++) {
    const step = await nextStep(model, seed, turns, options.template);
    if (step.done) return { seed, turns, stopReason: "done" };
    if (!step.question) return { seed, turns, stopReason: "empty" };
    const given = await answer(step, i);
    if (given === null || given === undefined) {
      return { seed, turns, stopReason: "done" };
    }
    const text = String(given);
    seed = applyAnswer(seed, step.field, text);
    turns.push({ step, answer: text });
  }
  // Hard cap reached — the loop is finite by construction (termination guarantee).
  return { seed, turns, stopReason: "cap" };
}
