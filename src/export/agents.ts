/**
 * The AGENT CHARTERS projection ("compile the family", brick 2 — who may act, and how bounded).
 *
 * The family spec's thesis: a generic agent is an unbounded improviser; a GOVERNED agent has a role,
 * a declared autonomy, an allowed/forbidden set, and a stop condition. This projects the standard
 * governed set (governor · architect · implementer · verifier) and WIRES each to THIS pack's real
 * assets — the implementer is scoped to the actual Action ids (the plan), the verifier binds to the
 * pack's checks, all of them obey AUTONOMY_CONTRACT.md and never raise their own authority (AXIOM A4).
 * Deterministic, model-free (A3): a pure view over the typed graph, like the POM and the contract.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const idsOf = (model: PackModel, type: string): string[] =>
  model.graph.nodes.filter((n) => n.semanticType === type).map((n) => n.id);

/** Build the governed agent charters, each bound to this pack's assets + the autonomy contract. */
export function projectAgentCharters(model: PackModel): string {
  const actions = idsOf(model, "Action");
  const scope = actions.length ? actions.join(", ") : "(no Action nodes yet)";
  const hasChecks = model.graph.nodes.some(
    (n: NodeCapsule) =>
      n.semanticType === "Eval" ||
      (n.checkability?.candidates?.length ?? 0) > 0,
  );
  return [
    `# Agent Charters — ${model.slug}`,
    "",
    "> The governed set that executes this pack. Each agent has a role, a declared autonomy level, a",
    "> forbidden set, and a STOP condition — a generic agent is an unbounded improviser; these are not.",
    "> All obey `AUTONOMY_CONTRACT.md` and none raises its own authority (AXIOM A4 — humans govern,",
    "> agents execute). Projected deterministically from the typed graph.",
    "",
    "## governor — authority A0 (gates transitions)",
    "- **reads:** `AXIOMS.md` (the laws), `AUTONOMY_CONTRACT.md`, the C-checks",
    "- **allowed:** approve/deny stage transitions; block any unsafe or unauthorized action",
    "- **forbidden:** edit source; raise any agent's autonomy; promote memory without evidence",
    "- **stops when:** a required gate is missing, or a C-check fails",
    "",
    "## architect — authority A1 (propose-only)",
    "- **reads:** `POM.md` (intent_kernel · constraints · unknowns), the context graph",
    "- **allowed:** propose architecture; decompose the plan's Actions into tasks; flag unknowns",
    "- **forbidden:** edit source; treat an assumption as a fact; act past a blocking Unknown",
    "- **stops when:** a residue / blocking Unknown gates the work (a hole beats a guess)",
    "",
    "## implementer — authority A1, bounded by `AUTONOMY_CONTRACT.md`",
    `- **scope (the plan):** ${scope}`,
    "- **reads:** the Action nodes above, `AUTONOMY_CONTRACT.md`",
    "- **allowed:** propose diffs for its A1 Actions; run sandbox tests only when a human raises it to A2",
    "- **forbidden:** any Action above its granted level; merge; deploy; spend; widen its own scope",
    "- **stops when:** an Action needs A2+ → it halts and routes to the human gate (A4)",
    "",
    "## verifier — authority A0 (outranks the generator)",
    `- **reads:** the pack's checks ${hasChecks ? "(Eval nodes / C-check candidates)" : "(none yet — see RESIDUE)"}, the graph`,
    "- **allowed:** run the checks; emit a pass/fail verdict; **BLOCK** promotion",
    "- **forbidden:** edit the artifact it checks; pass on the unseen — it must **fail closed**",
    "- **stops when:** a check cannot be run → INDETERMINATE, treated as blocking (never a silent pass)",
    "",
    "## Note",
    "These four are the spec's minimum governed set wired to this pack. A `memory_curator` (evidence-",
    "gated promotion) and an `exporter` (multi-target emit) are the next charters; they ride the same",
    "rule — declared authority, forbidden set, stop condition, no self-elevation.",
    "",
  ].join("\n");
}

/** The Agent Charters as an emitted pack file (written under the blueprint export dir). */
export function agentChartersExport(model: PackModel): ExportFile {
  return { path: "AGENTS.md", content: projectAgentCharters(model) };
}
