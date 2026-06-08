/**
 * The MEMORY-LOOP CLOSERS projection ("compile the family", lane B — L10, the compounding rung).
 *
 * The value ladder's top: memory → next compile. Two artifacts close the loop:
 *   • recompile_triggers.yaml — the conditions that INVALIDATE this pack (a changed SEED, an axiom
 *     re-freeze, a resolved unknown, a stale repo source, a weakened gate). When one fires, recompile.
 *   • SUCCESSOR_UPDATE.md — the handoff to the NEXT compile: the residue it must still address, the
 *     decisions it must NOT re-litigate, the memory candidates, and the still-OWED outcome eval. So
 *     the next compile starts from this one's frozen state instead of from zero — the loop compounds.
 * Deterministic projections of the graph (A3); the owed outcome eval (L9b) is carried forward honestly.
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const ids = (ns: NodeCapsule[]): string =>
  ns.length ? ns.map((n) => `\`${n.id}\``).join(", ") : "_(none)_";

export function projectLoopClosers(model: PackModel): ExportFile[] {
  const ns = model.graph.nodes;
  const residue = ns.filter(
    (n) => n.truth === "residue" || n.semanticType === "Unknown",
  );
  const decisions = ns.filter((n) => n.semanticType === "Decision");
  const memory = ns.filter((n) => n.semanticType === "Memory");

  const triggers: ExportFile = {
    path: "recompile_triggers.yaml",
    content: [
      `# recompile triggers — ${model.slug}`,
      "# When any condition fires, this pack is stale → recompile (export taxonomy §14).",
      "recompile_when:",
      "  - the SEED changes (intent / scope / known-or-unknown context edited)",
      "  - the AXIOMS freeze tag changes (the constitution the pack traced to moved)",
      "  - the repo source digest changes (repo-aware compile: the code drifted under the pack)",
      "  - a gate is weakened (a previously-passing check or invariant is dropped — selfImprove.ts)",
      "  - any of these open unknowns resolves (a hole closing changes the world):",
      ...(residue.length
        ? residue.map((n) => `      - ${n.id}: ${n.label}`)
        : ["      - (none open)"]),
      "",
    ].join("\n"),
  };

  const successor: ExportFile = {
    path: "SUCCESSOR_UPDATE.md",
    content: [
      `# Successor Update — ${model.slug}`,
      "",
      "> The handoff to the NEXT compile, so it starts from this frozen state, not from zero. The loop",
      "> compounds only if residue, decisions, and the owed proof survive into the successor.",
      "",
      "## carry-forward residue (still owed — do NOT drop, do NOT guess)",
      `${ids(residue)}`,
      "",
      "## decisions to honour (already made — do NOT re-litigate)",
      `${ids(decisions)}`,
      "",
      "## memory candidates (promote only if evidence-gated — see MEMORY_POLICY.md)",
      `${ids(memory)}`,
      "",
      "## the OWED outcome eval (carried until measured)",
      "L9b — does an executor working from this pack outperform raw-prompt on the same task? Held-out,",
      "human/model-judged, the north-star gate (A4). Still OWED. The successor inherits this debt; it is",
      "not discharged by any structural score. See EVAL_PLAN.md.",
      "",
    ].join("\n"),
  };

  return [triggers, successor];
}
