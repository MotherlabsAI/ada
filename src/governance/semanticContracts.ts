/**
 * Latent semantic-contract registry (ada-improvement-blueprint PLAN.003 — "register latent semantic
 * contracts as first-class shared objects to catch disjoint-write conflicts"). A cross-node behavioral
 * invariant — a token format, a wire enum, an event schema — is something MULTIPLE nodes/agents must
 * agree on. When two agents each write a disjoint part of the same contract, a structurally-valid merge
 * can still be semantically broken: the merge scheduler's blind spot (the blueprint's named risk).
 *
 * The compiler-side deliverable is the REGISTRY: surface each Invariant/Constraint as a first-class
 * contract with its party set (the nodes bound to it), and flag the multi-party ones as the watch-list.
 * The DETECTION of a disjoint-write conflict happens at merge time — that is RUNTIME (the merge
 * scheduler, executor-side), handed back. Pure, model-free (A3).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "../export/claude.js";

export interface SemanticContract {
  id: string;
  label: string;
  /** The node ids bound to this contract (connected by any cross-edge). */
  parties: string[];
  /** ≥2 parties → a genuine cross-node agreement, the disjoint-write conflict surface. */
  shared: boolean;
}

const isContract = (n: NodeCapsule): boolean =>
  n.semanticType === "Invariant" || n.semanticType === "Constraint";

/** Register the cross-node contracts (Invariant/Constraint nodes) with their party sets. */
export function semanticContracts(model: PackModel): SemanticContract[] {
  const edges = model.graph.edges;
  return model.graph.nodes.filter(isContract).map((c) => {
    const parties = [
      ...new Set(
        edges
          .filter((e) => e.from === c.id || e.to === c.id)
          .map((e) => (e.from === c.id ? e.to : e.from))
          .filter((id) => id !== c.id),
      ),
    ].sort();
    return { id: c.id, label: c.label, parties, shared: parties.length >= 2 };
  });
}

/** Project the contract registry; the disjoint-write detection is the runtime merge scheduler's job. */
export function projectSemanticContracts(model: PackModel): ExportFile {
  const cs = semanticContracts(model);
  const shared = cs.filter((c) => c.shared);
  const line = (c: SemanticContract): string =>
    `- \`${c.id}\` ${c.label} — parties: ${c.parties.length ? c.parties.map((p) => `\`${p}\``).join(", ") : "_(none yet)_"}${c.shared ? "  ⚠ shared" : ""}`;
  return {
    path: "SEMANTIC_CONTRACTS.md",
    content: [
      `# Semantic Contracts — ${model.slug}`,
      "",
      "> Cross-node behavioral invariants multiple agents must agree on (token formats, wire enums,",
      "> event schemas). Registered as first-class objects so a structurally-valid merge can't silently",
      "> break a shared agreement. Detection of disjoint-write conflicts is the RUNTIME merge scheduler's",
      "> job (executor-side); this is the compiler-side registry it checks against (blueprint PLAN.003).",
      "",
      "## registry",
      cs.length
        ? cs.map(line).join("\n")
        : "_(no Invariant/Constraint contracts in this pack)_",
      "",
      "## watch-list (shared — ≥2 parties → disjoint-write conflict surface)",
      shared.length
        ? shared
            .map(
              (c) =>
                `- \`${c.id}\` — ${c.parties.length} parties; the merge scheduler must serialize or reconcile writes here`,
            )
            .join("\n")
        : "_(none — no contract is bound by ≥2 nodes yet)_",
      "",
      "## handoff",
      "At fleet runtime, before merging two agents' writes, the merge scheduler MUST check both against",
      "every shared contract above: a structurally-disjoint write-set that touches the same contract is a",
      "semantic conflict, not a clean merge. That check is runtime (ada-foundation / agent-runtime).",
      "",
    ].join("\n"),
  };
}
