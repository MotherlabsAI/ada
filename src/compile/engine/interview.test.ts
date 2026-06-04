import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Seed } from "../../core/types.js";
import type { ModelClient } from "./model.js";
import {
  MAX_TURNS,
  parseInterviewStep,
  applyAnswer,
  buildInterviewPrompt,
  runInterview,
  isSeedField,
  type InterviewStep,
} from "./interview.js";

function baseSeed(): Seed {
  return {
    rootIntent: "A booking tool for my dog-grooming shop",
    domain: "",
    userRole: "",
    buildObjective: "",
    knowledgeObjective: "",
    trustObjective: "",
    knownContext: [],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: [],
    risks: [],
  };
}

/** A model that returns a scripted sequence of step JSON strings, one per call. */
function scriptedModel(steps: Array<Partial<InterviewStep>>): ModelClient {
  let i = 0;
  return {
    async complete(): Promise<string> {
      const step = steps[i++] ?? { done: true };
      return JSON.stringify(step);
    },
  };
}

// ── parseInterviewStep ────────────────────────────────────────────────────────

test("parseInterviewStep reads a clean step", () => {
  const s = parseInterviewStep(
    JSON.stringify({
      question: "Who is this for?",
      options: ["Me", "My staff", "My clients"],
      allowOther: true,
      field: "userRole",
      done: false,
    }),
  );
  assert.equal(s.question, "Who is this for?");
  assert.deepEqual(s.options, ["Me", "My staff", "My clients"]);
  assert.equal(s.field, "userRole");
  assert.equal(s.done, false);
  assert.equal(s.allowOther, true);
});

test("parseInterviewStep tolerates code fences and clamps options to 5", () => {
  const s = parseInterviewStep(
    "```json\n" +
      JSON.stringify({
        question: "Pick",
        options: ["a", "b", "c", "d", "e", "f", "g"],
        field: "constraints",
      }) +
      "\n```",
  );
  assert.equal(s.question, "Pick");
  assert.equal(s.options.length, 5, "options clamped to the 5 upper bound");
});

test("parseInterviewStep degrades a garbled step to an empty question (no throw)", () => {
  const s = parseInterviewStep("not json at all");
  assert.equal(s.question, "");
  assert.deepEqual(s.options, []);
  assert.equal(s.done, false);
});

test("allowOther is on by default and only off when explicitly false", () => {
  assert.equal(parseInterviewStep("{}").allowOther, true);
  assert.equal(
    parseInterviewStep(JSON.stringify({ allowOther: false })).allowOther,
    false,
  );
});

// ── applyAnswer (Seed mapping) ────────────────────────────────────────────────

test("applyAnswer overwrites a scalar field", () => {
  const s = applyAnswer(baseSeed(), "userRole", "The shop owner");
  assert.equal(s.userRole, "The shop owner");
});

test("applyAnswer accumulates list fields and dedupes", () => {
  let s = baseSeed();
  s = applyAnswer(s, "constraints", "Under $50/mo");
  s = applyAnswer(s, "constraints", "Mobile-first");
  s = applyAnswer(s, "constraints", "Under $50/mo"); // dup ignored
  assert.deepEqual(s.constraints, ["Under $50/mo", "Mobile-first"]);
});

test("applyAnswer ignores unknown fields and blank answers (no-op)", () => {
  const before = baseSeed();
  assert.deepEqual(
    applyAnswer(before, "sources", "x"),
    before,
    "sources not writable",
  );
  assert.deepEqual(
    applyAnswer(before, "domain", "   "),
    before,
    "blank ignored",
  );
  assert.deepEqual(applyAnswer(before, "notAField", "y"), before);
});

test("isSeedField recognizes writable fields only", () => {
  assert.ok(isSeedField("domain"));
  assert.ok(isSeedField("risks"));
  assert.ok(!isSeedField("sources"));
  assert.ok(!isSeedField("nonsense"));
});

// ── runInterview: ordering + accumulation + stop-on-done ──────────────────────

test("runInterview asks in order, fills the right fields, and STOPS on done", async () => {
  const model = scriptedModel([
    {
      question: "What kind of thing is this?",
      field: "domain",
      options: ["A booking tool"],
    },
    { question: "Who is it for?", field: "userRole", options: ["The owner"] },
    {
      question: "What must it never do?",
      field: "constraints",
      options: ["Lose a booking"],
    },
    { done: true }, // the model declares the interview complete
  ]);
  const asked: string[] = [];
  const answers = [
    "Dog-grooming bookings",
    "The shop owner",
    "Double-book a slot",
  ];
  const result = await runInterview(model, baseSeed(), (step, i) => {
    asked.push(step.question);
    return answers[i]!;
  });

  assert.equal(result.stopReason, "done");
  assert.deepEqual(asked, [
    "What kind of thing is this?",
    "Who is it for?",
    "What must it never do?",
  ]);
  assert.equal(result.seed.domain, "Dog-grooming bookings");
  assert.equal(result.seed.userRole, "The shop owner");
  assert.deepEqual(result.seed.constraints, ["Double-book a slot"]);
  assert.equal(result.turns.length, 3);
});

test("a 'type my own' free-text answer is captured into its field", async () => {
  // The model offers picks for `risks`; the user types something NOT in the list.
  const model = scriptedModel([
    {
      question: "What could go wrong?",
      field: "risks",
      options: ["No-shows", "Refund abuse"],
    },
    { done: true },
  ]);
  const typed =
    "Staff forget to mark a slot taken and we overbook on Saturdays";
  const result = await runInterview(model, baseSeed(), () => typed);
  assert.deepEqual(result.seed.risks, [typed], "free text bound to the field");
});

// ── runInterview: termination guarantee ───────────────────────────────────────

test("runInterview STOPS at the hard cap even if the model NEVER says done", async () => {
  // The model is adversarial: it never returns done, always a fresh question.
  let calls = 0;
  const model: ModelClient = {
    async complete(): Promise<string> {
      calls++;
      return JSON.stringify({
        question: `Question ${calls}?`,
        field: "knownContext",
        options: ["yes", "no"],
        done: false,
      });
    },
  };
  const result = await runInterview(model, baseSeed(), () => "yes");
  assert.equal(result.stopReason, "cap", "hard cap, not an infinite session");
  assert.equal(result.turns.length, MAX_TURNS, "asked exactly the cap");
  assert.equal(calls, MAX_TURNS, "never exceeded the cap in model calls");
});

test("runInterview honours a smaller injected cap (still clamped ≤ MAX_TURNS)", async () => {
  let calls = 0;
  const model: ModelClient = {
    async complete(): Promise<string> {
      calls++;
      return JSON.stringify({
        question: `q${calls}`,
        field: "assumptions",
        done: false,
      });
    },
  };
  const result = await runInterview(model, baseSeed(), () => "a", {
    maxTurns: 3,
  });
  assert.equal(result.turns.length, 3);
  assert.equal(result.stopReason, "cap");
});

test("runInterview stops cleanly if a step parses empty (garbled model can't hang)", async () => {
  const model: ModelClient = {
    complete: async () => "garbage not json",
  };
  const result = await runInterview(model, baseSeed(), () => "x");
  assert.equal(result.stopReason, "empty");
  assert.equal(result.turns.length, 0);
});

test("runInterview aborts cleanly when the UI returns null (user quit)", async () => {
  const model = scriptedModel([
    { question: "First?", field: "domain", options: ["a"] },
    { question: "Second?", field: "userRole", options: ["b"] },
  ]);
  const result = await runInterview(model, baseSeed(), (_s, i) =>
    i === 0 ? "answered" : null,
  );
  assert.equal(result.stopReason, "done", "early abort is a clean stop");
  assert.equal(result.seed.domain, "answered");
  assert.equal(result.turns.length, 1);
});

// ── prompt construction ───────────────────────────────────────────────────────

test("buildInterviewPrompt includes the transcript and the unfilled-field list", () => {
  const seed = applyAnswer(baseSeed(), "domain", "Dog grooming");
  const p = buildInterviewPrompt("TEMPLATE", seed, [
    {
      step: {
        question: "Kind?",
        options: [],
        allowOther: true,
        field: "domain",
        done: false,
      },
      answer: "Dog grooming",
    },
  ]);
  assert.match(p, /TEMPLATE/);
  assert.match(p, /root intent: A booking tool for my dog-grooming shop/);
  assert.match(p, /Q \(domain\): Kind\?/);
  assert.match(p, /A: Dog grooming/);
  assert.match(p, /FIELDS STILL UNFILLED/);
  assert.doesNotMatch(
    p,
    /\bdomain,/,
    "an already-asked field is not listed as unfilled",
  );
  assert.match(p, /userRole/, "an unasked field is still listed");
});

// ── versioned prompt ships ────────────────────────────────────────────────────

test("the interviewer prompt exists in src/compile/prompts (copied into dist by build)", () => {
  const here = join(
    process.cwd(),
    "src",
    "compile",
    "prompts",
    "interviewer.md",
  );
  const body = readFileSync(here, "utf8");
  assert.match(body, /Interviewer prompt \(versioned\)/);
});

// ── grep-guard: the A1/A9 boundary is structural ──────────────────────────────

test("no model/network token lives in interview.ts (only model.ts may)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/interview.ts"),
    "utf8",
  ).toLowerCase();
  for (const tok of ["anthropic", "openai", "fetch("]) {
    assert.ok(!src.includes(tok), `forbidden token in interview.ts: ${tok}`);
  }
});
