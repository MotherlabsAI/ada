/**
 * Unit tests for classifyDepth — pure function, no I/O, no LLM calls.
 * Run: node --test dist/depth-classifier.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyDepth } from "./depth-classifier.js";

// ─── Trivial domain fast path ─────────────────────────────────────────────────

test("trivial domain: 'a todo app' → 0 questions, terminationReason=ready", () => {
  const plan = classifyDepth("a todo app");
  assert.equal(plan.questionCount, 0);
  assert.equal(plan.questions.length, 0);
  assert.equal(plan.terminationReason, "ready");
  assert.equal(plan.confidence, "high");
  assert.notEqual(plan.skipReason, null);
  assert.equal(plan.domainLabel, "todo");
});

test("trivial domain: 'simple blog' → 0 questions", () => {
  const plan = classifyDepth("simple blog");
  assert.equal(plan.questionCount, 0);
  assert.equal(plan.terminationReason, "ready");
});

test("trivial domain: 'a habit tracker' → 0 questions", () => {
  const plan = classifyDepth("a habit tracker");
  assert.equal(plan.questionCount, 0);
  assert.equal(plan.terminationReason, "ready");
});

test("trivial domain: 'portfolio site' → 0 questions", () => {
  const plan = classifyDepth("portfolio site");
  assert.equal(plan.questionCount, 0);
  assert.equal(plan.terminationReason, "ready");
});

test("trivial domain: 'calculator' → 0 questions", () => {
  const plan = classifyDepth("calculator");
  assert.equal(plan.questionCount, 0);
  assert.equal(plan.terminationReason, "ready");
});

// ─── Trivial domain + long intent — NOT fast path ─────────────────────────────

test("trivial domain with >15 words does NOT skip — goes to signal analysis", () => {
  const plan = classifyDepth(
    "I want to build a todo app that syncs across devices and has offline support with conflict resolution",
  );
  // Domain is trivial but wordCount > 15, so it goes through signal analysis
  assert.equal(plan.terminationReason, "needs_elicitation");
});

// ─── Vague / broad intent → multiple questions ────────────────────────────────

test("vague one-sentence: 'I want to build an app' → 3+ questions", () => {
  const plan = classifyDepth("I want to build an app");
  assert.ok(
    plan.questionCount >= 3,
    `expected >= 3 questions, got ${plan.questionCount}`,
  );
  assert.equal(plan.terminationReason, "needs_elicitation");
});

test("broad platform: 'a marketplace for services' → 3+ questions", () => {
  const plan = classifyDepth("a marketplace for services");
  assert.ok(
    plan.questionCount >= 3,
    `expected >= 3, got ${plan.questionCount}`,
  );
  // should include scope_boundary (marketplace is scope-ambiguous)
  const types = plan.questions.map((q) => q.type);
  assert.ok(types.includes("scope_boundary"), "should ask scope_boundary");
});

test("vague platform: 'I need a platform' → includes scope and actor questions", () => {
  const plan = classifyDepth("I need a platform");
  const types = plan.questions.map((q) => q.type);
  assert.ok(types.includes("scope_boundary"), "should ask scope_boundary");
  assert.ok(
    types.includes("failure_conditions"),
    "should ask failure_conditions",
  );
});

// ─── Scope-limiting patterns → fewer questions ────────────────────────────────

test("scope-limited: 'only a landing page for sign-ups' → no scope_boundary question", () => {
  const plan = classifyDepth("only a landing page for sign-ups");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    !types.includes("scope_boundary"),
    "scope_boundary should be suppressed when 'only' is present",
  );
});

test("scope-limited: 'just a simple dashboard without auth' → no scope_boundary question", () => {
  const plan = classifyDepth("just a simple dashboard without auth");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    !types.includes("scope_boundary"),
    "scope_boundary should be suppressed when 'just' is present",
  );
});

// ─── Failure conditions already stated → no failure_conditions question ───────

test("explicit constraints: 'app that must not expose user data and cannot allow duplicates' → no failure_conditions question", () => {
  const plan = classifyDepth(
    "app that must not expose user data and cannot allow duplicates",
  );
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    !types.includes("failure_conditions"),
    "failure_conditions should be suppressed when already stated",
  );
});

test("explicit constraint: 'never store passwords in plaintext' → no failure_conditions question", () => {
  const plan = classifyDepth("never store passwords in plaintext");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    !types.includes("failure_conditions"),
    "failure_conditions suppressed by 'never store' pattern",
  );
});

// ─── High-invariant domains → business_rule question ─────────────────────────

test("payment domain → includes business_rule question", () => {
  const plan = classifyDepth("a payment processing system for subscriptions");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("business_rule"),
    "payment domain must ask business_rule",
  );
  assert.equal(plan.terminationReason, "needs_elicitation");
});

test("medical domain → includes business_rule question", () => {
  const plan = classifyDepth("a patient scheduling system for a clinic");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("business_rule"),
    "medical domain must ask business_rule",
  );
});

test("legal/compliance domain → includes business_rule question", () => {
  const plan = classifyDepth("a contract management tool with GDPR compliance");
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("business_rule"),
    "compliance domain must ask business_rule",
  );
});

// ─── Multi-actor domains → primary_actor question ─────────────────────────────

test("marketplace with buyer/seller → includes primary_actor question", () => {
  const plan = classifyDepth(
    "a marketplace where buyers and sellers can trade goods",
  );
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("primary_actor"),
    "multi-actor domain must ask primary_actor",
  );
});

test("ride-sharing (driver/rider) → primary_actor question present", () => {
  const plan = classifyDepth(
    "a ride-sharing app connecting drivers and riders",
  );
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("primary_actor"),
    "driver/rider domain must ask primary_actor",
  );
});

// ─── Workflow complexity → workflow_disambiguation question ───────────────────

test("approval workflow → includes workflow_disambiguation question", () => {
  const plan = classifyDepth(
    "a system for coordinating approval process between managers and employees",
  );
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("workflow_disambiguation"),
    "approval workflow must trigger workflow_disambiguation",
  );
});

test("multi-step pipeline → includes workflow_disambiguation", () => {
  const plan = classifyDepth(
    "a multi-step onboarding pipeline that integrates with Stripe and sends emails",
  );
  const types = plan.questions.map((q) => q.type);
  assert.ok(
    types.includes("workflow_disambiguation"),
    "multi-step workflow must ask workflow_disambiguation",
  );
});

// ─── Hard cap: never more than 5 questions ────────────────────────────────────

test("hard cap: questionCount is always <= 5", () => {
  const intents = [
    "a payment marketplace platform coordinating buyers and sellers with multi-step approval workflows across multiple jurisdictions",
    "a medical billing system with complex insurance claim workflows for patients, doctors, and insurance providers with GDPR compliance",
    "a financial trading platform that orchestrates transactions between employers, employees, and vendors across multiple regulatory frameworks",
  ];
  for (const intent of intents) {
    const plan = classifyDepth(intent);
    assert.ok(
      plan.questionCount <= 5,
      `questionCount exceeded 5 for: "${intent.slice(0, 50)}..."`,
    );
    assert.equal(
      plan.questions.length,
      plan.questionCount,
      "questions.length must equal questionCount",
    );
  }
});

// ─── Structural invariants ────────────────────────────────────────────────────

test("questions.length always equals questionCount", () => {
  const cases = [
    "build me something",
    "a todo app",
    "a platform for managing freelancers and clients with payment integration",
    "only a simple notes app for students",
  ];
  for (const intent of cases) {
    const plan = classifyDepth(intent);
    assert.equal(
      plan.questions.length,
      plan.questionCount,
      `questions.length !== questionCount for: "${intent}"`,
    );
  }
});

test("terminationReason is 'ready' iff questionCount === 0", () => {
  const cases = [
    "a todo app",
    "a blog",
    "calculator",
    "a platform for managing freelancers",
    "a payment system for subscriptions",
  ];
  for (const intent of cases) {
    const plan = classifyDepth(intent);
    if (plan.questionCount === 0) {
      assert.equal(
        plan.terminationReason,
        "ready",
        `expected 'ready' when 0 questions for: "${intent}"`,
      );
    } else {
      assert.equal(
        plan.terminationReason,
        "needs_elicitation",
        `expected 'needs_elicitation' when questions > 0 for: "${intent}"`,
      );
    }
  }
});

test("skipReason is null when there are questions, non-null when no questions", () => {
  const withQuestions = classifyDepth("a platform for managing services");
  const withoutQuestions = classifyDepth("a todo app");
  assert.equal(withQuestions.skipReason, null);
  assert.notEqual(withoutQuestions.skipReason, null);
});

test("domainLabel is non-empty string for all inputs", () => {
  const cases = ["a todo app", "some random intent", "payment system"];
  for (const intent of cases) {
    const plan = classifyDepth(intent);
    assert.ok(
      typeof plan.domainLabel === "string" && plan.domainLabel.length > 0,
      `domainLabel must be non-empty for: "${intent}"`,
    );
  }
});

test("mandatory questions have priority='mandatory', conditional have 'conditional'", () => {
  const plan = classifyDepth(
    "a payment platform coordinating buyers and sellers with approval workflow",
  );
  for (const q of plan.questions) {
    if (
      q.type === "scope_boundary" ||
      q.type === "primary_actor" ||
      q.type === "failure_conditions"
    ) {
      assert.equal(q.priority, "mandatory", `${q.type} must be mandatory`);
    } else if (
      q.type === "workflow_disambiguation" ||
      q.type === "business_rule"
    ) {
      assert.equal(q.priority, "conditional", `${q.type} must be conditional`);
    }
  }
});
