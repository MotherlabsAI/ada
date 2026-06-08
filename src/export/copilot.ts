/**
 * The GitHub Copilot export ("compile the family", brick 6 — the reach beyond Claude).
 *
 * The same compiled context, projected into GitHub Copilot's repository custom-instructions file
 * (`.github/copilot-instructions.md`). This is the "outperform on ANY harness" move: Ada's governed
 * context stops being Claude-only. Copilot's instructions are plain repo rules, so this is a leaner
 * projection than CLAUDE.md — the project's intent, the invariants it must respect, and a pointer to
 * the governed family (POM, autonomy/agent/tool contracts) for the depth Copilot can't infer.
 * Deterministic, model-free (A3); honest (no claim of a backing the pack doesn't ship).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const byType = (model: PackModel, ...types: string[]): NodeCapsule[] =>
  model.graph.nodes.filter(
    (n) => n.semanticType && types.includes(n.semanticType),
  );

const rule = (n: NodeCapsule): string => {
  const s = n.localContext?.summary?.trim();
  return `- **${n.label}**${s ? ` — ${s}` : ""}`;
};

/** Project the pack into GitHub Copilot repository custom instructions. */
export function copilotExports(model: PackModel): ExportFile[] {
  const { seed } = model;
  const invariants = byType(model, "Invariant", "Constraint");
  const actions = byType(model, "Action");
  return [
    {
      path: ".github/copilot-instructions.md",
      content: [
        `# ${seed.domain} — Copilot instructions`,
        "",
        "This repository has a **compiled Ada context pack**. Build from it, not from a raw prompt.",
        `Intent: ${seed.rootIntent}`,
        "",
        "## Load the governed context first",
        "- `exports/blueprint/POM.md` — the Problem Operating Model: intent, constraints, unknowns,",
        "  verifier, residue. Operate on it; do not re-derive it. Never fill an Ω (unknown) with a guess.",
        "- `exports/blueprint/AUTONOMY_CONTRACT.md` — what you may do, and at what authority.",
        "- `exports/blueprint/AGENTS.md` · `TOOL_CONTRACTS.md` — the governed roles + permissioned tools.",
        "",
        "## Invariants you must respect",
        invariants.length
          ? invariants.map(rule).join("\n")
          : "_(none surfaced — see the POM constraint_graph)_",
        "",
        "## What is being built (the plan)",
        actions.length
          ? actions.map((a) => `- ${a.label}`).join("\n")
          : "_(no Action nodes yet)_",
        "",
        "## Authority (defer to the Autonomy Contract — A4)",
        "Default to **A1 (propose-only)**: suggest diffs, never assume permission for irreversible",
        "actions (merges, deploys, deletes, spend). Raising authority is the human's call. Honour the",
        "residue: an unresolved unknown blocks action — a hole is better than a confident wrong guess.",
        "",
      ].join("\n"),
    },
  ];
}
