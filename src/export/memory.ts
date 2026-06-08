/**
 * The MEMORY POLICY projection ("compile the family", brick 5 — closes the governance loop).
 *
 * What survives, and what it takes to survive. Memory is EARNED, not generated: a promotion into
 * durable memory is gated on EVIDENCE (EVIDENCE_LEDGER.jsonl, brick 4) and verified by the verifier
 * (AGENTS.md, brick 2). This shuts the governance loop: autonomy → agents → tools → evidence → memory
 * → (recompile). Wired to THIS pack — Memory-typed nodes are promotion candidates; residue is held
 * back, never promoted. Deterministic, model-free (A3).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import type { ExportFile } from "./claude.js";

/** Build the Memory Policy markdown — the promotion/demotion gates, wired to this pack. */
export function projectMemoryPolicy(model: PackModel): string {
  const candidates = model.graph.nodes
    .filter((n: NodeCapsule) => n.semanticType === "Memory")
    .map((n) => n.id);
  const residue = model.graph.nodes.filter((n) => n.truth === "residue");
  return [
    `# Memory Policy — ${model.slug}`,
    "",
    "> What survives, and what it takes to survive. Memory is **earned, not generated** — a model",
    "> output is not memory; a verified, scoped, invalidatable, evidenced claim is. Closes the",
    "> governance loop: autonomy → agents → tools → evidence → memory → recompile.",
    "",
    "## Classes",
    "- **working** — this compile's transient context; promotion is NEVER automatic.",
    "- **durable** — verified facts, decisions, invariants; stable until invalidated.",
    "- **residue** — unresolved / contradicted / deferred; first-class, prevents false closure.",
    "",
    "## Promotion gate (a memory enters `durable` only if ALL hold)",
    "1. **provenance** — it traces to source / repo evidence / an explicit user statement (truth ∵, not Ω).",
    "2. **scope** — it declares where it applies (and where it does not).",
    "3. **no open contradiction** — no `contradicts` edge stands against it.",
    "4. **invalidation rule** — it names exactly what would make it false.",
    "5. **evidence** — an `EVIDENCE_LEDGER.jsonl` entry backs it (the verifier checks this — AGENTS.md).",
    "",
    "## Demotion (a `durable` memory MUST be demoted when)",
    "contradicted by newer evidence · stale past its freshness window · its source is gone · the user",
    "reverses the preference · the project boundary changed. Demotion is not failure — it is hygiene.",
    "",
    "## This pack",
    `- **candidate promotions** (Memory nodes): ${candidates.length ? candidates.map((c) => `\`${c}\``).join(", ") : "_none yet — no Memory nodes excavated_"}`,
    `- **residue — NOT promotable until resolved:** ${residue.length} item(s) (see RESIDUE / the POM unknowns_graph)`,
    "",
    "## Note",
    "Promotion is the recompile's job, gated by the verifier against the evidence ledger. Until a claim",
    "is evidenced, scoped, and invalidatable, it stays `working` or `residue` — a hole beats false memory.",
    "",
  ].join("\n");
}

/** The Memory Policy as an emitted pack file (written under the blueprint export dir). */
export function memoryPolicyExport(model: PackModel): ExportFile {
  return { path: "MEMORY_POLICY.md", content: projectMemoryPolicy(model) };
}
