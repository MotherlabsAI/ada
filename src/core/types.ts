/**
 * Core domain model for Ada.
 *
 * These types ARE the contract. The pack writer, compilers, C engine, exporters,
 * and TUI all compile against this file. Mirrors the node-capsule YAML contract in
 * ADA_WORLD_MODEL_SCHEMA_GRAPH.md §8, kept deterministic per AXIOM A5.
 */

// ── Semantic grammar (spec §2/§3) ──────────────────────────────────────────────

export type Colour =
  | "clay"
  | "terracotta"
  | "plum"
  | "deep_blue"
  | "sage"
  | "amber"
  | "green"
  | "rose"
  | "slate"
  | "cyan"
  | "ink";

/** Primary object glyph for a node. */
export type Glyph =
  | "◈" // root
  | "◆" // cluster
  | "◇" // node
  | "◎" // active
  | "●" // finished
  | "○" // draft
  | "◌" // latent
  | "✦" // insight
  | "⟡" // primitive
  | "⟦⟧" // seed
  | "⌁" // stream
  | "📄" // wiki
  | "κ" // check
  | "λ" // skill
  | "π" // blueprint
  | "⧉" // artifact
  | "∵" // evidence
  | "!" // gate
  | "→"; // edge

export type Status = "finished" | "draft" | "latent" | "active";

/** Truth class of a claim: source-backed, inferred, or a known gap. */
export type TruthClass = "source" | "inference" | "residue";

/** Checkability ladder (spec §4). C0 uncheckable … C5 static/type/db constraint. */
export type CheckClass = "C0" | "C1" | "C2" | "C3" | "C4" | "C5";

export type Depth = "L1" | "L2" | "L3" | "L4" | "L5";

/**
 * The SEMANTIC node-type ontology (NORTH-STAR organ 04). A typed graph, not a folder-tree of
 * generic capsules: every node IS one of these atoms, so edges and checks can reason about it.
 * Closed enum — the verifier rejects anything outside it. (Distinct from `NodeRole.nodeType`,
 * which is the fixed render-role descriptor; this is the meaning of the node.)
 */
export type NodeType =
  | "Intent"
  | "Constraint"
  | "Claim"
  | "Evidence"
  | "Assumption"
  | "Unknown"
  | "Risk"
  | "Mechanism"
  | "Invariant"
  | "Decision"
  | "Action"
  | "Artifact"
  | "Tool"
  | "Eval"
  | "Memory";

/** The 15 semantic node types, as a runtime list (for validation + the `typed-nodes` check). */
export const NODE_TYPES: readonly NodeType[] = [
  "Intent",
  "Constraint",
  "Claim",
  "Evidence",
  "Assumption",
  "Unknown",
  "Risk",
  "Mechanism",
  "Invariant",
  "Decision",
  "Action",
  "Artifact",
  "Tool",
  "Eval",
  "Memory",
];

/** Where a node projects (spec §4). */
export type Projection =
  | "graph"
  | "wiki"
  | "code"
  | "c"
  | "blueprint"
  | "claude"
  | "pack"
  | "gov"
  | "source";

/**
 * Semantic edge types (spec cluster EDGESEM).
 *
 * `defeasible` / `exception` (4-c, AXIOM A3 D2): honest defeasibility. A `defeasible`
 * edge marks a soft / non-binary rule — one that holds by default but yields to context —
 * and an `exception` edge names the case that overrides it. These are DATA in the
 * exploratory layer (A1), never a model in the checker (A3): a node a `defeasible` edge
 * touches routes to C0–C2 + residue, and is never forged into a brittle C3–C5 MUST.
 */
export type EdgeType =
  | "contains"
  | "depends_on"
  | "enables"
  | "blocks"
  | "contradicts"
  | "supports"
  | "derived_from"
  | "compiles_to"
  | "exports_to"
  | "guarded_by"
  | "verified_by"
  | "missed_by"
  | "generalizes_to"
  | "residue_of"
  | "promotes_to_memory"
  | "recompiles"
  | "defeasible"
  | "exception";

export type Confidence = "low" | "medium" | "high";
export type GateStatus = "passed" | "pending" | "failed" | "not_applicable";
export type Score = "low" | "medium" | "high";

// ── Node capsule (spec §8) ──────────────────────────────────────────────────────

export interface NodeRole {
  cluster: string;
  nodeType: string;
  compileTargets: Projection[];
}

export interface LocalContext {
  summary: string;
  whyItMatters: string;
  failureIfMissing: string;
}

export interface WorldLinks {
  parents: string[];
  children: string[];
  siblings: string[];
  dependsOn: string[];
  exportsTo: string[];
  guardedBy: string[];
}

export interface Epistemics {
  claimClass: string;
  confidence: Confidence;
  sourceStatus: string;
  assumptions: string[];
  unknowns: string[];
}

export interface Checkability {
  class: CheckClass;
  explanation: string;
  /** Candidate check identifiers (names from the C registry). */
  candidates: string[];
}

export interface NodeUi {
  visibleBadges: string[];
  /** Compact graph prefix, e.g. "◇ ● ∴ κ ⇒". */
  graphSymbol: string;
  openPriority: "high" | "medium" | "low";
}

export interface NodeQuality {
  gateStatus: GateStatus;
  genericnessScore: Score;
  actionEnablementScore: Score;
}

export interface NodeCapsule {
  id: string;
  label: string;
  glyph: Glyph;
  colour: Colour;
  status: Status;
  depth: Depth;
  truth: TruthClass;
  /** The semantic node-type (organ 04). Optional for back-compat with packs compiled before it. */
  semanticType?: NodeType;
  role: NodeRole;
  localContext: LocalContext;
  worldLinks: WorldLinks;
  epistemics: Epistemics;
  checkability: Checkability;
  ui: NodeUi;
  quality: NodeQuality;
  /** Whether the user has flagged this node for inclusion. */
  flagged?: boolean;
  /** Whether the user has rejected this node. */
  rejected?: boolean;
}

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  note?: string;
}

// ── Graph + SEED + Pack ──────────────────────────────────────────────────────────

export interface Graph {
  id: string;
  version: string;
  packSlug: string;
  nodes: NodeCapsule[];
  edges: Edge[];
}

/** Normalized starting context (spec cluster SEED). */
export interface Seed {
  rootIntent: string;
  domain: string;
  userRole: string;
  buildObjective: string;
  knowledgeObjective: string;
  trustObjective: string;
  knownContext: string[];
  unknownContext: string[];
  assumptions: string[];
  sources: string[];
  constraints: string[];
  risks: string[];
  /**
   * Optional COMPILED digest of an existing repo (repo-aware compile, spine step 1).
   * When present, the excavator reads it as ∵ source so it builds ON the real code instead
   * of inventing holes for what already exists. Density-bounded (`repoDigest`), never a dump.
   */
  repoContext?: string;
}

export interface WikiPage {
  /** Relative path under wiki/, e.g. "index.md" or node id slug. */
  slug: string;
  title: string;
  markdown: string;
}

export interface PackManifest {
  slug: string;
  product: string;
  schemaVersion: string;
  createdNote: string;
  nodeCount: number;
  edgeCount: number;
  checkCount: number;
  residueCount: number;
  clusters: string[];
  /**
   * Proposed area code→label registry (P7, domain-adaptive clustering). Carried as DATA so
   * the TUI/wiki resolve dynamic labels (e.g. ARCH→"Architecture") for whatever areas this
   * intent's domain has, instead of a hardcoded marketing-shaped map. Optional: packs
   * compiled before P7 (and the showcase) omit it and fall back to the built-in map.
   */
  clusterLabels?: Record<string, string>;
}

export interface PackModel {
  slug: string;
  seed: Seed;
  graph: Graph;
  /** Wiki pages projected from nodes (spec §9). */
  wiki: WikiPage[];
  /** Provenance note: how this pack was produced. */
  provenance: string;
  /**
   * Proposed area code→label registry (P7). When present it is written into the manifest so
   * downstream projections (TUI/wiki) show domain-appropriate area names. Optional — the
   * showcase and pre-P7 packs omit it and fall back to the built-in label map.
   */
  clusterLabels?: Record<string, string>;
  /**
   * Whether this pack ships RUNNABLE C checks (a real `c/checks/verify.mjs` whose
   * checks correspond to its MUST rules). Only the booking showcase does today;
   * the generic engine emits κ candidates the executor must implement, so it
   * leaves this false. Gates the honesty of the executor export (AXIOM A2 — a
   * pack must not claim a backing it does not ship). Default false.
   */
  shipsRunnableChecks?: boolean;
}
