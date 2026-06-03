/**
 * Claude Code export bundle (spec cluster CLAUDE, AXIOM A6). Ordinary files first.
 *
 * P0 (FREEZE.md §4): the Hard-rules block + entity registry DERIVE from the typed IR
 * (graph nodes — label / summary / checkability.candidates / truth), not from
 * hand-authored booking strings. Provenance guard (4-d / AXIOM A2): a Hard-rule MUST
 * line traces only to Ada-authored nodes (truth ∈ inference|residue) and their
 * deterministic check candidates; a truth="source" node (ingested,
 * attacker-influenceable) is never promoted into a MUST. Each rule carries its node id.
 *
 * P3 (FREEZE.md §4, Steals 4-a/4-b/4-c):
 *   4-a — salience budget: rank candidate Hard-rules / entities by the deterministic
 *         salience signal (quality × openPriority, see export/salience.ts), inline only
 *         the top-K, demote the tail to a load-on-demand pointer into `wiki/`. The
 *         emitted CLAUDE.md is hard-capped; `densityVerdict` is the pure model-free
 *         pass/fail the C-run path uses to FAIL an over-budget pack (AXIOM A3).
 *   4-b — compaction-resistant shape: the immutable Hard-rules live under a clearly-fenced
 *         "do not summarize; re-read from this file" block, backed by the re-runnable C
 *         files, so a downstream compactor cannot dilute them.
 *   4-c — honest defeasibility: only a node whose checkClass is DETERMINISTIC (C3–C5)
 *         may contribute a MUST. A soft / non-binary node (C0–C2) NEVER becomes a hard
 *         rule — it routes to the human-gated lane + residue (AXIOM A3 D2). Enforced by
 *         `isDeterministic` + an assertion in `hardRuleItems`.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import { clusterOf } from "../core/ids.js";
import {
  rankBySalience,
  splitByCount,
  HARD_RULES_BUDGET,
  ENTITY_BUDGET,
} from "./salience.js";

export interface ExportFile {
  /** Path relative to exports/claude/. */
  path: string;
  content: string;
}

/** Ada-authored nodes only (AXIOM A2 / 4-d): ingested `source` text is never a MUST. */
function authored(nodes: NodeCapsule[]): NodeCapsule[] {
  return nodes.filter((n) => n.truth !== "source");
}

/**
 * A node's checkClass is DETERMINISTIC (C3–C5) — the only classes A3/D2 lets compile to
 * a hard MUST. C0–C2 are soft / non-binary / human-gated and are NEVER a MUST (4-c).
 */
function isDeterministic(n: NodeCapsule): boolean {
  const c = n.checkability.class;
  return c === "C3" || c === "C4" || c === "C5";
}

function isCheckable(n: NodeCapsule): boolean {
  return isDeterministic(n) && n.checkability.candidates.length > 0;
}

function entities(model: PackModel): NodeCapsule[] {
  return model.graph.nodes.filter((n) => clusterOf(n.id) === "DOMAIN");
}

/** A candidate hard rule: the emitted MUST line + the node it traces to (for ranking). */
interface RuleItem {
  rule: string;
  node: NodeCapsule;
}

/**
 * Every candidate Hard-rule, derived from Ada-authored DETERMINISTIC checkable nodes
 * (AXIOM A2/A3, 4-c/4-d). Each line is a runnable check candidate tagged with the node id
 * it traces to. Guard (4-c): a node with a non-deterministic checkClass (C0–C2) can never
 * reach here, and a truth="source" node never contributes a MUST. The assertion makes the
 * invariant load-bearing rather than implicit.
 */
function hardRuleItems(model: PackModel): RuleItem[] {
  const items = authored(model.graph.nodes)
    .filter(isCheckable)
    .flatMap((n) =>
      n.checkability.candidates.map((cand) => ({
        rule: `- MUST: ${cand} (\`${n.id}\` — ${n.label})`,
        node: n,
      })),
    );
  // 4-c invariant: no soft / non-binary (C0–C2) rule may be emitted as a hard MUST.
  for (const { node } of items) {
    if (!isDeterministic(node)) {
      throw new Error(
        `defeasibility violation (4-c): node ${node.id} (${node.checkability.class}) ` +
          `is non-deterministic and must not emit a MUST.`,
      );
    }
  }
  return items;
}

/**
 * Applies the salience budget (4-a): rank candidate hard-rules by quality × openPriority,
 * inline only the top-K within HARD_RULES_BUDGET, and demote the tail to a single
 * load-on-demand pointer into `wiki/`. Pure / deterministic (no model). When there are no
 * deterministic invariants at all, emit the honest "none" line instead of an empty block.
 */
function hardRuleLines(model: PackModel): string[] {
  const items = hardRuleItems(model);
  if (!items.length) {
    return [
      "- (no deterministically checkable invariants in this pack; see the wiki for residue and human-gated context)",
    ];
  }
  const ranked = rankBySalience(
    items,
    (it) => it.node,
    (it) => it.node.id,
  );
  const { inline, demoted } = splitByCount(ranked, HARD_RULES_BUDGET);
  const lines = inline.map((it) => it.rule);
  if (demoted.length) {
    lines.push(
      `- …${demoted.length} more lower-salience invariant${demoted.length === 1 ? "" : "s"} demoted to load-on-demand — see \`wiki/index.md\` and \`c/C.md\` (the full set stays runnable via \`c/checks/verify.mjs\`).`,
    );
  }
  return lines;
}

/**
 * The entity registry, salience-budgeted (4-a). Ranks DOMAIN entities by quality ×
 * openPriority, inlines the top-K within ENTITY_BUDGET, demotes the tail to a pointer.
 * Entities are descriptive context, not MUSTs, so no 4-c/4-d guard applies here.
 */
function entityLines(model: PackModel): string[] {
  const ents = entities(model);
  if (!ents.length)
    return ["- (no DOMAIN-cluster entities surfaced in this pack)"];
  const ranked = rankBySalience(
    ents,
    (n) => n,
    (n) => n.id,
  );
  const { inline, demoted } = splitByCount(ranked, ENTITY_BUDGET);
  const lines = inline.map(
    (n) => `- **${n.label}** (\`${n.id}\`) — ${n.localContext.summary}`,
  );
  if (demoted.length) {
    lines.push(
      `- …${demoted.length} more entit${demoted.length === 1 ? "y" : "ies"} in \`wiki/index.md\` (load on demand).`,
    );
  }
  return lines;
}

/**
 * The human-gate rule, derived from C0–C2 Ada-authored nodes (AXIOM A4). These are
 * the surfaces the executor must stop and ask about rather than guess.
 */
function gateRule(model: PackModel): string[] {
  const gated = authored(model.graph.nodes).filter((n) => {
    const c = n.checkability.class;
    return c === "C0" || c === "C1" || c === "C2";
  });
  if (!gated.length) return [];
  const ids = gated.map((n) => n.id).join(", ");
  return [
    `- Human-gated surfaces (not deterministically checkable) — ask before acting: ${ids}. See \`exports/blueprint/GATES.md\`.`,
  ];
}

export function claudeExports(model: PackModel): ExportFile[] {
  const { seed } = model;
  const claudeMd: ExportFile = {
    path: "CLAUDE.md",
    content: [
      `# ${seed.domain} — executor instructions`,
      "",
      "This project has a compiled Ada context pack. Build from it, not from a raw prompt.",
      "",
      "## What to load first",
      "- `wiki/index.md` — the map and the high-value nodes",
      "- `exports/blueprint/BLUEPRINT.md` — the deterministic build contract",
      "- `exports/blueprint/ACCEPTANCE.md` — the must-pass conditions",
      "- `c/C.md` — the deterministic checks",
      "",
      // 4-b — compaction-resistant emit shape. The immutable hard-rules sit under an
      // explicitly fenced "do not summarize; re-read from this file" block so a downstream
      // compactor won't dilute them. Pure formatting; every rule is backed by a
      // re-runnable C file under `c/checks/` (the real source of truth).
      "## Hard rules (immutable — do not summarize; re-read from this file)",
      "<!-- ADA:HARD-RULES:BEGIN — immutable. Do NOT summarize, compress, or paraphrase this",
      "     block. If context is compacted, re-read it verbatim from this file. Each rule is",
      "     backed by a runnable check in `c/checks/` — `node c/checks/verify.mjs`. -->",
      "Every rule below traces to a checkable node id and is enforced by a deterministic C check.",
      ...hardRuleLines(model),
      "- Do not invent constraints that are listed as open questions — see `wiki/open-questions.md`.",
      ...gateRule(model),
      "<!-- ADA:HARD-RULES:END -->",
      "",
      "## Entities in this pack",
      ...entityLines(model),
      "",
      "## Definition of done",
      "Run the pack's own verification before claiming done:",
      "",
      "```bash",
      "node c/checks/verify.mjs                   # bundled clean dataset → all checks pass",
      "node c/checks/verify.mjs --data DATA.json  # YOUR data, exported as JSON",
      "```",
      "",
      "A feature is done when the code satisfies ACCEPTANCE.md AND the C checks pass when run",
      "against your real data via `--data` (export your records to JSON), not just the fixtures.",
      "",
    ].join("\n"),
  };

  const skill: ExportFile = {
    path: "skills/ada-context/SKILL.md",
    content: [
      "---",
      "name: ada-context",
      `description: Use when building the ${seed.domain}. Loads the compiled Ada pack — world model, blueprint, and deterministic C checks — so the build follows governed context instead of a raw prompt.`,
      "---",
      "",
      "# Ada Context Pack",
      "",
      "You are building from a compiled world model. The pack separates exploration",
      "(graph + wiki) from constraint (blueprint + C checks). Honour that separation.",
      "",
      "## Procedure",
      "1. Read `wiki/index.md` and the high-value nodes it lists.",
      "2. Read `exports/blueprint/BLUEPRINT.md` and `ACCEPTANCE.md`.",
      "3. Implement against the blueprint's data model and task graph.",
      "4. Before claiming done, run `node c/checks/verify.mjs`. All checks must pass on real data.",
      "5. If output is wrong but checks pass, that is a *missed failure*: propose a new invariant",
      "   for `c/registry.yaml` rather than patching silently (the C growth loop).",
      "",
      "## The invariants you must preserve (derived from the pack's checkable nodes)",
      ...hardRuleLines(model),
      "",
    ].join("\n"),
  };

  const scout: ExportFile = {
    path: "agents/ada-context-scout.md",
    content: [
      "---",
      "name: ada-context-scout",
      "description: Reads the Ada pack and answers 'what does this domain require?' with citations to specific nodes.",
      "---",
      "",
      "Read the pack's `wiki/` and `nodes/` and summarize the entities, workflows, and",
      "invariants relevant to the task. Cite node ids (e.g. the ids listed in the pack's",
      "wiki index). Surface open questions from `wiki/open-questions.md` rather than guessing.",
      "",
    ].join("\n"),
  };

  const blueprintWriter: ExportFile = {
    path: "agents/ada-blueprint-writer.md",
    content: [
      "---",
      "name: ada-blueprint-writer",
      "description: Turns a pack's blueprint into a concrete implementation plan and executes it task by task.",
      "---",
      "",
      "Follow `exports/blueprint/BLUEPRINT.md` and `TASK_GRAPH.json` exactly. Do not",
      "over-engineer beyond the stated scope (non-goals are listed). After each task,",
      "ensure the relevant C checks still pass.",
      "",
    ].join("\n"),
  };

  const cVerifier: ExportFile = {
    path: "agents/ada-c-verifier.md",
    content: [
      "---",
      "name: ada-c-verifier",
      "description: Runs the pack's deterministic C checks and blocks acceptance on any failure.",
      "---",
      "",
      "Run `node c/checks/verify.mjs --json` and parse the report. If any check fails on",
      "real data, the work is not done — report the violating records and stop. Never",
      "weaken a check to make it pass; that violates the trust contract (AXIOM A3).",
      "",
    ].join("\n"),
  };

  const installPrompt: ExportFile = {
    path: "prompts/install-ada.md",
    content: [
      "# Install this Ada pack",
      "",
      "Copy `exports/claude/CLAUDE.md` to your project root as `CLAUDE.md`, and copy",
      "`exports/claude/skills/ada-context/` into `.claude/skills/`. Then start a session;",
      "Claude Code will load the pack as governed context.",
      "",
    ].join("\n"),
  };

  const loadPrompt: ExportFile = {
    path: "prompts/load-pack.md",
    content: [
      "# Load pack",
      "",
      "Read `wiki/index.md`, `exports/blueprint/BLUEPRINT.md`, and `c/C.md`. Confirm you",
      "can list the entities, the workflows, and the C invariants before writing code.",
      "",
    ].join("\n"),
  };

  const testPrompt: ExportFile = {
    path: "prompts/test-pack.md",
    content: [
      "# Test pack (the A8 experiment)",
      "",
      "Build the pack's headline feature TWICE: once from this pack, once from only the",
      "raw intent. For each, run `node c/checks/verify.mjs` against the result's data",
      "layer. The pack run should make the pack's invariants obvious and enforced; the raw",
      "run usually will not. That delta is the product thesis (AXIOM A8).",
      "",
    ].join("\n"),
  };

  return [
    claudeMd,
    skill,
    scout,
    blueprintWriter,
    cVerifier,
    installPrompt,
    loadPrompt,
    testPrompt,
  ];
}
