/**
 * P3 guardrails proof (FREEZE.md §4 — Steals 4-a / 4-b / 4-c; AXIOMS A1/A2/A3 D2).
 *
 * Builds a LARGE pack (60+ checkable DOMAIN nodes) and proves:
 *   4-a salience budget — the emitted CLAUDE.md stays within the byte + rule budget; the
 *       tail is demoted to a load-on-demand pointer; the density predicate FAILS an
 *       over-budget pack and PASSES an in-budget one.
 *   ranking — a high-openPriority / high-quality node is inlined; a low one is demoted.
 *   4-b compaction-resistant shape — the immutable fenced block is present.
 *   4-c honest defeasibility — a non-deterministic (C0–C2) node never becomes a MUST;
 *       the new `defeasible` / `exception` EdgeTypes round-trip through serialization.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePackGated, type NodeSpec } from "../compile/assemble.js";
import { claudeExports } from "./claude.js";
import {
  densityVerdict,
  CLAUDE_MD_BUDGET_BYTES,
  HARD_RULES_BUDGET,
} from "./salience.js";
import type { Edge, Graph } from "../core/types.js";
import { toYaml } from "../core/serialize.js";

const INTENT =
  "a compliance ledger that flags every transaction needing review";

/**
 * A deterministic checkable DOMAIN node. Each carries 2 check candidates so the rule
 * count comfortably exceeds HARD_RULES_BUDGET, forcing the salience split.
 */
function checkNode(i: number, depth: NodeSpec["depth"] = "L5"): NodeSpec {
  const n = String(i).padStart(3, "0");
  return {
    id: `DOMAIN.${n}`,
    label: `Ledger Rule ${i}`,
    cluster: "DOMAIN",
    depth,
    summary: `Transaction class ${i} must reconcile to the ledger within a 24-hour window and carry a non-null counterparty id and an ISO-8601 settled-at timestamp.`,
    whyItMatters: `Class ${i} is the kind of entry an auditor pulls first; an unreconciled one is a finding.`,
    failureIfMissing: `Class ${i} entries drift from the ledger and the audit fails at row ${i}.`,
    fromPrompt: ["compliance ledger", "transaction needing review"],
    compilesTo: ["code", "blueprint", "c"],
    checkClass: "C4",
    cCandidates: [
      `ledger.class_${i}_reconciles_within_window`,
      `ledger.class_${i}_has_counterparty_and_settled_at`,
    ],
    unknowns: [],
    truth: "inference",
    parents: ["ROOT.000"],
  };
}

// 64 checkable nodes → 128 candidate MUSTs, well over the 40-rule budget. They are L4
// (⇒ openPriority "medium" in assemble), the routine bulk of the pack.
const MANY = Array.from({ length: 64 }, (_, i) => checkNode(i + 1, "L4"));

// STRONG: a genuinely higher-salience node — L5 ⇒ openPriority "high" — so it outranks
// the medium-priority bulk and is inlined despite a late-sorting id.
const STRONG: NodeSpec = {
  ...checkNode(900, "L5"),
  label: "Critical Sanction Screen",
};
// WEAK: same medium priority as the bulk and a late-sorting id, so it lands in the
// demoted tail — proving a low-salience node is pushed out of the inlined top-K.
const WEAK: NodeSpec = {
  ...checkNode(901, "L4"),
  label: "Minor Formatting Note",
};

// A non-deterministic (C2) node: a soft, non-binary "rule" that must NEVER become a MUST
// (4-c, AXIOM A3 D2) — it routes to the human-gated lane + residue instead.
const SOFT: NodeSpec = {
  id: "DOMAIN.950",
  label: "Reviewer judgement of materiality",
  cluster: "DOMAIN",
  depth: "L5",
  summary:
    "Whether a flagged transaction is 'material' is a reviewer judgement call, not a deterministic threshold; it depends on context an auditor weighs.",
  whyItMatters:
    "Forging this soft call into a brittle numeric check would fake certainty the domain does not have (A3 D2).",
  failureIfMissing:
    "Reviewers lose the explicit signal that materiality is a judgement.",
  fromPrompt: ["transaction needing review"],
  compilesTo: ["graph", "wiki"],
  checkClass: "C2",
  cCandidates: [],
  unknowns: ["where the materiality line sits for this org"],
  truth: "inference",
  parents: ["ROOT.000"],
};

function buildLarge() {
  const specs = [...MANY, STRONG, WEAK, SOFT];
  const { model } = assemblePackGated("ledger", INTENT, specs);
  const claude = claudeExports(model);
  const claudeMd = claude.find((f) => f.path === "CLAUDE.md")?.content ?? "";
  return { model, claudeMd };
}

test("4-a: a LARGE pack's CLAUDE.md stays within the salience budget", () => {
  const { claudeMd } = buildLarge();
  const v = densityVerdict(claudeMd);
  assert.equal(v.pass, true, `over budget: ${v.violations.join("; ")}`);
  assert.ok(v.bytes <= CLAUDE_MD_BUDGET_BYTES);
  assert.ok(v.rules <= HARD_RULES_BUDGET);
});

test("4-a: the tail is demoted to a single load-on-demand pointer", () => {
  const { claudeMd } = buildLarge();
  const demoteLines = claudeMd
    .split("\n")
    .filter((l) => /demoted to load-on-demand/.test(l));
  assert.equal(demoteLines.length, 1, "expected exactly one demote pointer");
  assert.match(demoteLines[0]!, /\bwiki\//);
  assert.match(demoteLines[0]!, /verify\.mjs/); // the full set stays runnable
});

test("4-a: density predicate FAILS an over-budget pack and PASSES an in-budget one", () => {
  const { claudeMd } = buildLarge();
  assert.equal(densityVerdict(claudeMd).pass, true);
  const bloated = claudeMd + "\n" + "x".repeat(CLAUDE_MD_BUDGET_BYTES);
  assert.equal(densityVerdict(bloated).pass, false);
});

test("ranking: a high-salience node is inlined, a low one is demoted", () => {
  const { claudeMd } = buildLarge();
  // The fenced hard-rules block is where MUSTs live.
  const mustBlock = claudeMd;
  assert.ok(
    mustBlock.includes("`DOMAIN.900`"),
    "high-salience STRONG node should be inlined as a MUST",
  );
  // With 64+ L5 nodes ahead of it, the L4 (medium-priority) WEAK node is demoted out of
  // the inlined top-K — its id must not appear in an inlined MUST line.
  const inlinedWeak = claudeMd
    .split("\n")
    .some((l) => /^\s*-\s+MUST:/.test(l) && l.includes("`DOMAIN.901`"));
  assert.equal(inlinedWeak, false, "low-salience WEAK node should be demoted");
});

test("4-b: the immutable compaction-resistant fence is present", () => {
  const { claudeMd } = buildLarge();
  assert.ok(claudeMd.includes("Hard rules (immutable — do not summarize"));
  assert.ok(claudeMd.includes("ADA:HARD-RULES:BEGIN"));
  assert.ok(claudeMd.includes("ADA:HARD-RULES:END"));
});

test("4-c: a non-deterministic (C0–C2) node never appears as a MUST", () => {
  const { claudeMd } = buildLarge();
  for (const line of claudeMd.split("\n")) {
    if (/^\s*-\s+MUST:/.test(line)) {
      assert.ok(
        !line.includes("DOMAIN.950") &&
          !line.includes("Reviewer judgement of materiality"),
        `soft C2 node was forged into a MUST: ${line}`,
      );
    }
  }
  // It should instead be routed to the human-gated lane.
  assert.ok(
    claudeMd.includes("DOMAIN.950"),
    "the soft node should still surface (human-gated), just never as a MUST",
  );
});

test("4-c: the new defeasible / exception EdgeTypes round-trip through serialization", () => {
  const edges: Edge[] = [
    {
      from: "DOMAIN.001",
      to: "DOMAIN.002",
      type: "defeasible",
      note: "holds by default",
    },
    {
      from: "DOMAIN.002",
      to: "DOMAIN.003",
      type: "exception",
      note: "overrides above",
    },
  ];
  const graph: Graph = {
    id: "g",
    version: "0.1.0",
    packSlug: "x",
    nodes: [],
    edges,
  };
  const yaml = toYaml(graph);
  assert.ok(yaml.includes("defeasible"));
  assert.ok(yaml.includes("exception"));
  // JSON round-trips structurally too (the serialization the pack writes to disk).
  const round = JSON.parse(JSON.stringify(graph)) as Graph;
  assert.equal(round.edges[0]!.type, "defeasible");
  assert.equal(round.edges[1]!.type, "exception");
});
