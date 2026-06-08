/**
 * The AUTONOMY CONTRACT projection (the AUTHORITY link — "compile the family", brick 1).
 *
 * The family-of-assets spec's operating formula is: intent → compile → assets → context → AUTHORITY
 * → work → evidence → memory → residue. Ada already compiles up to the work (the Action nodes / the
 * plan), but its actions carry no authority — so an executor can't tell which are safe to auto-run.
 * This projects the missing link: every compiled Action is bound to an autonomy level, defaulting to
 * the safe floor A1 (propose-only). Raising authority (touching files, branches, deploys, spend) is a
 * human gate — AXIOM A4 (humans govern; agents execute). Deterministic, model-free (A3): a pure view
 * over the typed graph, exactly like the POM projection.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

/** The A0–A5 ladder (from the spec): rising authority, each line one bounded grant. */
const LADDER: string[] = [
  "- **A0 read-only** — inspect / summarize / classify; no edits, no tools, no spend.",
  "- **A1 propose-only** — plan / diff / recommend; applies nothing without approval. ← DEFAULT",
  "- **A2 sandbox-edit** — edit a sandbox, run tests, produce a patch; no merge / deploy / delete.",
  "- **A3 branch+PR** — branch, commit, open PR, run CI; no merge to protected, no prod deploy.",
  "- **A4 staging-deploy** — deploy to staging + integration checks; no prod without approval.",
  "- **A5 production-bounded** — prod action only inside an explicit contract (approval matrix · rollback · audit · kill switch).",
];

const actionsOf = (model: PackModel): NodeCapsule[] =>
  model.graph.nodes.filter((n) => n.semanticType === "Action");

/** Build the Autonomy Contract markdown from the typed graph's Action nodes. */
export function projectAutonomyContract(model: PackModel): string {
  const actions = actionsOf(model);
  const item = (n: NodeCapsule): string => {
    const blast = n.localContext?.failureIfMissing?.trim();
    return (
      `- \`${n.id}\` **A1** · ${n.label}` +
      (blast ? `\n  - blast radius if mis-run: ${blast}` : "")
    );
  };
  return [
    `# Autonomy Contract — ${model.slug}`,
    "",
    "> Bounded authority for autonomous execution: no agent acts against raw ambiguity, every action",
    "> runs at a declared autonomy level, and raising authority is a HUMAN gate (AXIOM A4 — humans",
    "> govern; agents execute). Projected deterministically from the plan (Action nodes). Reversible",
    "> outranks irreversible; a hole is better than an unauthorized leap.",
    "",
    "## Autonomy ladder",
    ...LADDER,
    "",
    "## Work items — each starts at the safe floor (A1, propose-only)",
    actions.length
      ? actions.map(item).join("\n")
      : "_(no Action nodes in this pack — nothing to authorize yet)_",
    "",
    "## Raising authority (the human gate — A4)",
    "Every action above is **A1 by default**. Moving any to A2+ (touching files, branches, deploys,",
    "or spend) is the owner's call — Ada proposes; the human governs. Record each promotion here with a",
    "named approver and a rollback path; an A5 action additionally requires an approval matrix + kill switch.",
    "",
    "## Note",
    "Per-action autonomy CLASSIFICATION (judging each move's reversibility / blast radius to assign a",
    "level above A1) is the next increment. Today the floor is A1 for all — which is exactly the spec's",
    "posture: reversible, proposed, human-governed until evidence earns more authority.",
    "",
  ].join("\n");
}

/** The Autonomy Contract as an emitted pack file (written under the blueprint export dir). */
export function autonomyContractExport(model: PackModel): ExportFile {
  return {
    path: "AUTONOMY_CONTRACT.md",
    content: projectAutonomyContract(model),
  };
}
