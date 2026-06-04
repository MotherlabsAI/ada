import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { Interview } from "./Interview.js";
import type {
  InterviewStep,
  InterviewTurn,
} from "../../compile/engine/interview.js";

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ESC = String.fromCharCode(27);
const DOWN = ESC + "[B";

function step(partial: Partial<InterviewStep>): InterviewStep {
  return {
    question: "What kind of thing is this?",
    options: ["A booking tool", "A storefront", "A dashboard"],
    allowOther: true,
    field: "domain",
    done: false,
    ...partial,
  };
}

test("Interview renders the first question and its options + the type-my-own row", async () => {
  const steps = [step({})];
  let i = 0;
  const { lastFrame } = render(
    h(Interview, {
      rootIntent: "A booking tool for my dog-grooming shop",
      getNextStep: async () => steps[i++] ?? null,
      onFinish: () => {},
      maxTurns: 20,
    }),
  );
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /you ›/, "the chat-style user prefix");
  assert.match(f, /ada ›/, "the chat-style Ada prefix");
  assert.match(f, /What kind of thing is this\?/, "the first question");
  assert.match(f, /A booking tool/, "an option");
  assert.match(
    f,
    /type my own/,
    "the type-my-own affordance is always present",
  );
  assert.match(f, /ctx init/, "the calm header");
});

test("picking an option records the answer and advances to the next question", async () => {
  const steps = [
    step({ question: "What kind of thing is this?", field: "domain" }),
    step({
      question: "Who is it for?",
      field: "userRole",
      options: ["The owner", "Staff"],
    }),
  ];
  let i = 0;
  const captured: InterviewTurn[] = [];
  const { stdin, lastFrame } = render(
    h(Interview, {
      rootIntent: "A booking tool",
      getNextStep: async () => steps[i++] ?? null,
      onFinish: (t) => captured.push(...t),
      maxTurns: 20,
    }),
  );
  await tick();
  stdin.write("\r"); // pick the highlighted first option
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /Who is it for\?/, "advanced to the second question");
  assert.match(
    f,
    /A booking tool/,
    "first option shows as the recorded answer in transcript",
  );
});

test("the type-my-own row opens a text input and captures free text", async () => {
  const steps = [step({ options: ["A", "B"] })];
  let i = 0;
  let finished: InterviewTurn[] | undefined;
  const { stdin, lastFrame } = render(
    h(Interview, {
      rootIntent: "intent",
      getNextStep: async () => steps[i++] ?? null,
      onFinish: (t) => {
        finished = t;
      },
      maxTurns: 20,
    }),
  );
  await tick();
  // Move down to the "type my own" row (2 options → index 2), select it.
  stdin.write(DOWN);
  stdin.write(DOWN);
  await tick();
  stdin.write("\r"); // open the text input
  await tick();
  for (const ch of "my own answer") stdin.write(ch);
  await tick();
  stdin.write("\r"); // send
  await tick();
  // The next fetch returns null → interview finishes; onFinish carries the typed answer.
  assert.ok(finished, "onFinish fired");
  const turns = finished as InterviewTurn[];
  assert.equal(
    turns[0]!.answer,
    "my own answer",
    "free text captured into the turn",
  );
  assert.equal(turns[0]!.step.field, "domain");
});
