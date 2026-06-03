/**
 * Salience-budget unit proofs (FREEZE.md §4, 4-a; AXIOM A1/A3).
 *
 *   - salienceScore is a pure monotone function of quality × openPriority;
 *   - rankBySalience orders high-priority/high-quality first, deterministically;
 *   - splitByCount inlines the top-K and demotes the tail;
 *   - densityVerdict is a pure pass/fail predicate: fails over-budget, passes in-budget.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { NodeCapsule } from "../core/types.js";
import {
  salienceScore,
  rankBySalience,
  splitByCount,
  densityVerdict,
  densityWithinBudget,
  CLAUDE_MD_BUDGET_BYTES,
  HARD_RULES_BUDGET,
} from "./salience.js";

function cap(
  id: string,
  openPriority: NodeCapsule["ui"]["openPriority"],
  generic: NodeCapsule["quality"]["genericnessScore"],
  action: NodeCapsule["quality"]["actionEnablementScore"],
): NodeCapsule {
  return {
    id,
    label: id,
    glyph: "◇",
    colour: "deep_blue",
    status: "finished",
    depth: "L5",
    truth: "inference",
    role: {
      cluster: "DOMAIN",
      nodeType: "context_capsule",
      compileTargets: [],
    },
    localContext: { summary: "", whyItMatters: "", failureIfMissing: "" },
    worldLinks: {
      parents: [],
      children: [],
      siblings: [],
      dependsOn: [],
      exportsTo: [],
      guardedBy: [],
    },
    epistemics: {
      claimClass: "context_capsule",
      confidence: "high",
      sourceStatus: "excavated_from_intent",
      assumptions: [],
      unknowns: [],
    },
    checkability: { class: "C4", explanation: "", candidates: [] },
    ui: { visibleBadges: [], graphSymbol: "", openPriority },
    quality: {
      gateStatus: "passed",
      genericnessScore: generic,
      actionEnablementScore: action,
    },
  };
}

test("salienceScore: high-priority, low-generic, high-action beats the opposite", () => {
  const strong = cap("A", "high", "low", "high");
  const weak = cap("B", "low", "high", "low");
  assert.ok(salienceScore(strong) > salienceScore(weak));
});

test("salienceScore: openPriority strictly orders equal-quality nodes", () => {
  const hi = cap("A", "high", "low", "high");
  const med = cap("B", "medium", "low", "high");
  const lo = cap("C", "low", "low", "high");
  assert.ok(salienceScore(hi) > salienceScore(med));
  assert.ok(salienceScore(med) > salienceScore(lo));
});

test("salienceScore is pure: identical capsule → identical score", () => {
  const a = cap("A", "high", "low", "high");
  const b = cap("A", "high", "low", "high");
  assert.equal(salienceScore(a), salienceScore(b));
});

test("rankBySalience puts the salient node first and is deterministic", () => {
  const nodes = [
    cap("low-1", "low", "high", "low"),
    cap("high-1", "high", "low", "high"),
    cap("med-1", "medium", "medium", "medium"),
  ];
  const ranked = rankBySalience(
    nodes,
    (n) => n,
    (n) => n.id,
  );
  assert.equal(ranked[0]!.id, "high-1");
  assert.equal(ranked[2]!.id, "low-1");
  // stable + total: re-ranking yields the identical order.
  const again = rankBySalience(
    nodes,
    (n) => n,
    (n) => n.id,
  );
  assert.deepEqual(
    again.map((n) => n.id),
    ranked.map((n) => n.id),
  );
});

test("splitByCount inlines top-K and demotes the tail", () => {
  const items = [1, 2, 3, 4, 5];
  const { inline, demoted } = splitByCount(items, 2);
  assert.deepEqual(inline, [1, 2]);
  assert.deepEqual(demoted, [3, 4, 5]);
});

test("densityVerdict PASSES an in-budget pack", () => {
  const small = "# tiny\n\n- MUST: x (`A` — a)\n";
  const v = densityVerdict(small);
  assert.equal(v.pass, true);
  assert.equal(v.violations.length, 0);
  assert.equal(densityWithinBudget(small), true);
});

test("densityVerdict FAILS an over-byte-budget pack", () => {
  const big = "# big\n" + "x".repeat(CLAUDE_MD_BUDGET_BYTES + 1);
  const v = densityVerdict(big);
  assert.equal(v.pass, false);
  assert.ok(v.bytes > v.byteBudget);
  assert.ok(v.violations.some((m) => /bytes/.test(m)));
});

test("densityVerdict FAILS an over-rule-budget pack", () => {
  const lines = ["# rules", ""];
  for (let i = 0; i <= HARD_RULES_BUDGET; i++) {
    lines.push(`- MUST: rule ${i} (\`N.${i}\` — n)`);
  }
  const v = densityVerdict(lines.join("\n"));
  assert.equal(v.pass, false);
  assert.ok(v.rules > v.ruleBudget);
  assert.ok(v.violations.some((m) => /MUST rules/.test(m)));
});
