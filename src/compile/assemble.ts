/**
 * Assembles a PackModel from excavated node specs (the output of the compile
 * workforce). This is the real compile's assembly step: System 1 (creative context
 * graph) content arrives from the workforce; here it becomes the filesystem-backed
 * world model. Exploratory by design (AXIOM A1) — provenance preserved via `truth`
 * and `fromPrompt` (AXIOM A2).
 */
import type {
  NodeCapsule,
  Edge,
  Graph,
  Seed,
  PackModel,
  Colour,
  Glyph,
  TruthClass,
  CheckClass,
  Depth,
  Projection,
} from "../core/types.js";
import { TRUTH_GLYPH } from "../core/grammar.js";
import { clusterOf } from "../core/ids.js";
import { projectWiki } from "../pack/wiki.js";

export interface NodeSpec {
  id: string;
  label: string;
  cluster: string;
  depth: Depth;
  summary: string;
  whyItMatters: string;
  failureIfMissing: string;
  fromPrompt: string[];
  compilesTo: string[];
  checkClass: CheckClass;
  cCandidates: string[];
  unknowns: string[];
  truth: TruthClass;
  parents: string[];
}

const CLUSTER_COLOUR: Record<string, Colour> = {
  ROOT: "terracotta",
  ATT: "plum",
  COPY: "terracotta",
  SEO: "cyan",
  UNK: "amber",
  C: "green",
};

function colourFor(cluster: string): Colour {
  return CLUSTER_COLOUR[cluster] ?? "deep_blue";
}

function isCheckable(c: CheckClass): boolean {
  return c === "C3" || c === "C4" || c === "C5";
}

function targetsFor(spec: NodeSpec): Projection[] {
  const t: Projection[] = ["graph", "wiki"];
  if (spec.cCandidates.length || isCheckable(spec.checkClass)) t.push("c");
  if (spec.depth === "L4" || spec.depth === "L5") t.push("claude", "blueprint");
  return t;
}

function graphSymbol(glyph: Glyph, truth: TruthClass, c: CheckClass): string {
  const parts: string[] = [glyph, "●", TRUTH_GLYPH[truth]];
  if (isCheckable(c)) parts.push("κ");
  parts.push("⇒");
  return parts.join(" ");
}

function toCapsule(spec: NodeSpec): NodeCapsule {
  const cluster = clusterOf(spec.id);
  const glyph: Glyph = spec.truth === "residue" ? "◌" : "◇";
  const targets = targetsFor(spec);
  return {
    id: spec.id,
    label: spec.label,
    glyph,
    colour: colourFor(cluster),
    status: "finished",
    depth: spec.depth,
    truth: spec.truth,
    role: { cluster, nodeType: "context_capsule", compileTargets: targets },
    localContext: {
      summary: spec.summary,
      whyItMatters: spec.whyItMatters,
      failureIfMissing: spec.failureIfMissing,
    },
    worldLinks: {
      parents: spec.parents,
      children: [],
      siblings: [],
      dependsOn: [],
      exportsTo: targets.includes("claude") ? ["CLAUDE.md", "CONTEXT.md"] : [],
      guardedBy: [],
    },
    epistemics: {
      claimClass: "context_capsule",
      confidence: spec.truth === "residue" ? "low" : "high",
      sourceStatus:
        spec.truth === "source"
          ? "grounded_in_domain_knowledge"
          : spec.truth === "residue"
            ? "open_question"
            : "excavated_from_intent",
      assumptions: [],
      unknowns: spec.unknowns,
    },
    checkability: {
      class: spec.checkClass,
      explanation: spec.cCandidates.length
        ? "Has deterministic check candidates."
        : "Exploratory context; not a deterministic guarantee.",
      candidates: spec.cCandidates,
    },
    ui: {
      visibleBadges: [spec.depth, spec.checkClass, spec.truth],
      graphSymbol: graphSymbol(glyph, spec.truth, spec.checkClass),
      openPriority: spec.depth === "L5" ? "high" : "medium",
    },
    quality: {
      gateStatus: "passed",
      genericnessScore: "low",
      actionEnablementScore: "high",
    },
  };
}

function buildEdges(nodes: NodeCapsule[]): Edge[] {
  const ids = new Set(nodes.map((n) => n.id));
  const edges: Edge[] = [];
  // contains: ROOT.000 -> the first node of each cluster (illustrative spine)
  const seen = new Set<string>();
  for (const n of nodes) {
    const c = clusterOf(n.id);
    if (!seen.has(c)) {
      seen.add(c);
      if (ids.has("ROOT.000"))
        edges.push({ from: "ROOT.000", to: n.id, type: "contains" });
    }
    for (const p of n.worldLinks.parents) {
      if (ids.has(p)) edges.push({ from: p, to: n.id, type: "contains" });
    }
  }
  return edges;
}

function rootNode(intent: string, clusters: string[]): NodeCapsule {
  return toCapsule({
    id: "ROOT.000",
    label: "Context Engineering World Model",
    cluster: "ROOT",
    depth: "L5",
    summary: `The working world model compiled from one intent. It does not model everything — only the bounded context needed to act: ${clusters.join(", ")}.`,
    whyItMatters:
      "The map the executor operates inside. Without it, Claude Code builds from a raw prompt.",
    failureIfMissing: "The build proceeds on guesses instead of structure.",
    fromPrompt: [intent.slice(0, 80) + "…"],
    compilesTo: [
      "graph.json",
      "wiki/index.md",
      "exports/claude",
      "exports/blueprint",
    ],
    checkClass: "C0",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  });
}

export function assemblePack(
  slug: string,
  intent: string,
  specs: NodeSpec[],
): PackModel {
  const clusters = [...new Set(specs.map((s) => clusterOf(s.id)))];
  const nodes = [rootNode(intent, clusters), ...specs.map(toCapsule)];
  const edges = buildEdges(nodes);
  const seed: Seed = {
    rootIntent: intent,
    domain:
      "Context engineering for a local service-business recognition system",
    userRole: "Non-technical builder using Claude Code",
    buildObjective:
      "A website/context system that ranks, gets cited by agents, converts attention to bookings, and gives Claude Code a real map.",
    knowledgeObjective:
      "A navigable, compounding world model of the attention → decision → trust → discovery stack.",
    trustObjective:
      "Deterministic C checks where the structure is checkable; honest residue where it is not.",
    knownContext: [
      "The user works in Claude Code.",
      "The output must feed Claude Code as governed context.",
    ],
    unknownContext: specs
      .filter((s) => s.truth === "residue")
      .flatMap((s) => [s.label, ...s.unknowns])
      .slice(0, 8),
    assumptions: ["A single local service business to start."],
    sources: [
      "User intent",
      "Ada context-engineering domain schema (321-node taxonomy)",
    ],
    constraints: [
      "Local-first.",
      "No subjective claim promoted as deterministic C (AXIOM A3).",
    ],
    risks: [
      "Marketing/attention is largely non-deterministic; do not fake certainty.",
    ],
  };
  const graph: Graph = {
    id: `graph-${slug}`,
    version: "0.1.0",
    packSlug: slug,
    nodes,
    edges,
  };
  const wiki = projectWiki(graph, seed);
  return {
    slug,
    seed,
    graph,
    wiki,
    provenance:
      "Excavated by the Ada compile workforce from one intent, aligned to the context-engineering taxonomy; every node anti-generic-gated. Exploratory layer (AXIOM A1); provenance via truth-class + fromPrompt (AXIOM A2).",
  };
}
