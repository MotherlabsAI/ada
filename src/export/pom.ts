/**
 * The PROBLEM OPERATING MODEL projection (the unique function — epistemic action compilation).
 *
 * A semantic compiler's defining output is not prose or a flat graph: it is a governed problem
 * STATE that separates what is known / assumed / unknown / constrained / verifiable / safe-to-act,
 * so humans, agents, and tools can operate on it without losing truth or uncertainty. This pass
 * PROJECTS the typed graph (organ 04's `semanticType`) into that state — fully deterministic, no
 * model (A3): each POM section is just a view over the nodes of a given type. The substrate is the
 * typed ontology; this is the projection the doc (docs/NORTH-STAR.md) calls for.
 */
import type { PackModel, NodeCapsule, NodeType } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const byType = (model: PackModel, ...types: NodeType[]): NodeCapsule[] =>
  model.graph.nodes.filter(
    (n) => n.semanticType && types.includes(n.semanticType),
  );

const line = (n: NodeCapsule): string => `- \`${n.id}\` ${n.label}`;
const bullets = (ns: NodeCapsule[]): string =>
  ns.length ? ns.map(line).join("\n") : "_(none)_";

/** Build the Problem Operating Model markdown from the typed graph + the seed (intent kernel). */
export function projectPOM(model: PackModel): string {
  const seed = model.seed;
  const residue = model.graph.nodes.filter((n) => n.truth === "residue");
  // contradictions: pairs in genuine conflict (a held claim vs its negation, or a soft rule).
  const tensions = model.graph.edges.filter(
    (e) => e.type === "contradicts" || e.type === "defeasible",
  );
  // distinctions (the distinguish operator): pairs the intent FUSED that the excavator split.
  // A conflation made explicit is NOT a contradiction — it gets its own current_state surface so
  // an operator reads two concepts where the prompt glossed one (NORTH-STAR: distinguish).
  const distinctions = model.graph.edges.filter(
    (e) => e.type === "disambiguates",
  );
  // verification questions: every node's open unknowns, attributed to the node.
  const questions = model.graph.nodes.flatMap((n) =>
    n.epistemics.unknowns.map((u) => `- \`${n.id}\` ${u}`),
  );
  // the tests the pack can verify with: Eval nodes + any node carrying check candidates.
  const tests = model.graph.nodes.flatMap((n) =>
    n.checkability.candidates.map((c) => `- \`${n.id}\` ${c}`),
  );

  return [
    `# Problem Operating Model — ${model.slug}`,
    "",
    "> The compiled epistemic state: what is known, assumed, unknown, constrained, and verifiable —",
    "> projected deterministically from the typed graph (`semanticType`). Operate on THIS; do not",
    "> re-derive it. Truth class is preserved (∵ source · ∴ inferred · Ω residue).",
    "",
    "## intent_kernel",
    `- **goal:** ${seed.rootIntent}`,
    `- **domain:** ${seed.domain}`,
    `- **desired_state:** ${seed.buildObjective}`,
    `- **success (trust):** ${seed.trustObjective}`,
    `- **non_goals:** ${seed.unknownContext.length ? "" : "_(none stated)_"}`,
    "",
    "### intents",
    bullets(byType(model, "Intent")),
    "",
    "## current_state",
    "### claims",
    bullets(byType(model, "Claim", "Evidence")),
    "### assumptions",
    bullets(byType(model, "Assumption")),
    "### contradictions",
    tensions.length
      ? tensions.map((e) => `- \`${e.from}\` ${e.type} \`${e.to}\``).join("\n")
      : "_(none surfaced)_",
    "### distinctions (fused concepts split apart)",
    distinctions.length
      ? distinctions
          .map((e) => `- \`${e.from}\` disambiguates \`${e.to}\``)
          .join("\n")
      : "_(none surfaced)_",
    "",
    "## constraint_graph",
    "### invariants (must hold)",
    bullets(byType(model, "Invariant")),
    "### constraints",
    bullets(byType(model, "Constraint")),
    "### risks",
    bullets(byType(model, "Risk")),
    "",
    "## unknowns_graph",
    "### unknowns",
    bullets(byType(model, "Unknown")),
    "### residue (Ω — unresolved, not fabricated)",
    residue.length ? residue.map(line).join("\n") : "_(none)_",
    "### verification_questions",
    questions.length ? questions.join("\n") : "_(none)_",
    "",
    "## solution_space",
    "### candidate paths (mechanisms / decisions)",
    bullets(byType(model, "Mechanism", "Decision")),
    "",
    "## execution_plan",
    "### next_actions",
    bullets(byType(model, "Action")),
    "",
    "## verifier",
    "### evals",
    bullets(byType(model, "Eval")),
    "### tests / evidence required",
    tests.length
      ? tests.join("\n")
      : "_(no deterministic check candidates yet)_",
    "",
    "## memory",
    "### promoted",
    bullets(byType(model, "Memory")),
    "### residue carried forward",
    residue.length
      ? `${residue.length} open item(s) — see unknowns_graph.`
      : "_(none)_",
    "",
  ].join("\n");
}

/** The POM as an emitted pack file (written under the blueprint export dir). */
export function pomExport(model: PackModel): ExportFile {
  return { path: "POM.md", content: projectPOM(model) };
}
