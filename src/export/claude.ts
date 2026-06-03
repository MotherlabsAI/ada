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
 * The salience budget / top-K density cap is Phase P3, out of scope here — P0 derives
 * honestly and emits every entity.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import { clusterOf } from "../core/ids.js";

export interface ExportFile {
  /** Path relative to exports/claude/. */
  path: string;
  content: string;
}

/** Ada-authored nodes only (AXIOM A2 / 4-d): ingested `source` text is never a MUST. */
function authored(nodes: NodeCapsule[]): NodeCapsule[] {
  return nodes.filter((n) => n.truth !== "source");
}

function isCheckable(n: NodeCapsule): boolean {
  const c = n.checkability;
  return (
    (c.class === "C3" || c.class === "C4" || c.class === "C5") &&
    c.candidates.length > 0
  );
}

function entities(model: PackModel): NodeCapsule[] {
  return model.graph.nodes.filter((n) => clusterOf(n.id) === "DOMAIN");
}

/**
 * The Hard-rules MUST list, derived from Ada-authored checkable nodes (AXIOM A2/A3,
 * 4-d). Each line is a runnable check candidate tagged with the node id it traces to.
 * A truth="source" node never contributes a MUST.
 */
function hardRules(model: PackModel): string[] {
  const rules = authored(model.graph.nodes)
    .filter(isCheckable)
    .flatMap((n) =>
      n.checkability.candidates.map(
        (cand) => `- MUST: ${cand} (\`${n.id}\` — ${n.label})`,
      ),
    );
  return rules.length
    ? rules
    : [
        "- (no deterministically checkable invariants in this pack; see the wiki for residue and human-gated context)",
      ];
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
  const ents = entities(model);
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
      "## Hard rules (derived from the pack's checkable nodes — every rule traces to a node id)",
      ...hardRules(model),
      "- Do not invent constraints that are listed as open questions — see `wiki/open-questions.md`.",
      ...gateRule(model),
      "",
      "## Entities in this pack",
      ...(ents.length
        ? ents.map(
            (n) => `- **${n.label}** (\`${n.id}\`) — ${n.localContext.summary}`,
          )
        : ["- (no DOMAIN-cluster entities surfaced in this pack)"]),
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
      ...hardRules(model),
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
