/**
 * excavateNode — the U2F engine's smallest unit: a SEED + one cluster → ONE candidate
 * NodeSpec, gated by the deterministic, model-free rubric. The model is invoked ONCE via
 * the injected ModelClient (AXIOM A1); parsing and gating are pure (AXIOM A3). A generic
 * candidate is surfaced as `rejected`, never silently dropped.
 *
 * This is the first slice of the generic compile engine: it replaces hand-authoring a
 * node with extracting one, and proves the product bet (quality of extracted semantics)
 * on the smallest surface — one node clearing the same gate the calibration exemplars clear.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Seed,
  CheckClass,
  Depth,
  TruthClass,
  NodeType,
} from "../../core/types.js";
import { NODE_TYPES, EDGE_TYPES } from "../../core/types.js";
import type { EdgeType } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";

/**
 * Validate the model's semanticType against the closed ontology (organ 04). On an omitted or
 * out-of-enum value, default to "Mechanism" — the neutral catch-all for an Ada capsule that
 * describes a how/why — rather than inventing a wrong type (A2: an honest default, not a lie).
 */
function coerceNodeType(v: unknown): NodeType {
  return typeof v === "string" && (NODE_TYPES as readonly string[]).includes(v)
    ? (v as NodeType)
    : "Mechanism";
}

/**
 * Parse the model's typed cross-edges (organ 04, step 2). Keeps only well-formed relations: a
 * string `to` and a `type` inside the closed EDGE_TYPES vocabulary. Invalid entries are dropped
 * (not coerced — an invented edge type is a lie, A2); the assembly later drops any `to` that
 * doesn't resolve to a kept node. Returns [] when absent/garbled.
 */
function parseRelations(v: unknown): { to: string; type: EdgeType }[] {
  if (!Array.isArray(v)) return [];
  const out: { to: string; type: EdgeType }[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const to = typeof o["to"] === "string" ? o["to"].trim() : "";
    const type = o["type"];
    if (
      to &&
      typeof type === "string" &&
      (EDGE_TYPES as readonly string[]).includes(type)
    ) {
      out.push({ to, type: type as EdgeType });
    }
  }
  return out;
}
import { scoreNode, type RubricScore } from "../rubric.js";
import { parseJsonLoose } from "./json.js";
import type { ModelClient } from "./model.js";

/**
 * Resolve the versioned-prompt directory RELATIVE TO THIS MODULE — never `process.cwd()`,
 * so the built CLI works from ANY working directory (forkable/runnable). The built layout
 * is `dist/compile/engine/excavate.js` with prompts copied to `dist/compile/prompts/`
 * (see scripts/copy-prompts.mjs, wired into `pnpm build`). From this module that is the
 * sibling `../prompts`. When running un-built (e.g. `node --test` against `dist/` before the
 * copy step, or any layout where the sibling dir is absent) we fall back to the canonical
 * source tree, located by walking up to the repo root. Zero deps: node:url + node:path only.
 */
export function resolvePromptDir(moduleUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(moduleUrl));
  // Primary: prompts copied alongside the build, sibling to engine/ (dist or src layout).
  const sibling = join(here, "..", "prompts");
  if (existsSync(join(sibling, "excavator.md"))) return sibling;
  // Fallback: the canonical source tree. `here` is .../<root>/{dist|src}/compile/engine,
  // so the source prompts live at <root>/src/compile/prompts.
  const fromSource = join(here, "..", "..", "..", "src", "compile", "prompts");
  if (existsSync(join(fromSource, "excavator.md"))) return fromSource;
  // Last resort: return the sibling path so the failure names the expected build location.
  return sibling;
}

function loadExcavator(): string {
  return readFileSync(join(resolvePromptDir(), "excavator.md"), "utf8");
}

export interface ExcavateResult {
  /** The parsed candidate, always present (for auditing rejected ones too). */
  spec: NodeSpec;
  /** The kept node, if it cleared the gate; null when rejected. */
  node: NodeSpec | null;
  /** The deterministic rubric verdict — always present, for auditing. */
  score: RubricScore;
  /** True when the gate refused the candidate. */
  rejected: boolean;
}

export function buildPrompt(
  seed: Seed,
  cluster: string,
  template: string,
  avoid: string[],
): string {
  const lines = [
    template,
    "",
    "## SEED",
    `root intent: ${seed.rootIntent}`,
    `domain: ${seed.domain}`,
    `objective: ${seed.buildObjective}`,
    `cluster to excavate: ${cluster}`,
  ];
  // Repo-aware compile (spine step 1): the compiled repo digest enters as ∵ source so the
  // excavator builds ON existing code and cites paths, instead of inventing holes for it.
  if (seed.repoContext && seed.repoContext.trim()) {
    lines.push(
      "",
      "## REPO CONTEXT (∵ source — existing code; build on it, cite paths, do NOT re-derive what already exists)",
      seed.repoContext.trim(),
    );
  }
  if (avoid.length) {
    lines.push(
      "",
      "## ALREADY EXCAVATED — do NOT repeat or restate these; surface a DIFFERENT, non-overlapping capsule (a distinct mechanism, not the same insight from another angle):",
      ...avoid.map((l) => `- ${l}`),
    );
  }
  lines.push(
    "",
    "## OUTPUT",
    "Return exactly ONE NodeSpec as strict JSON (no prose, no code fences) with keys:",
    "id, label, cluster, depth, summary, whyItMatters, failureIfMissing,",
    "fromPrompt (string[]), compilesTo (string[]), checkClass, cCandidates (string[]),",
    "unknowns (string[]), truth, parents (string[]), semanticType, relations.",
    "",
    "semanticType is the node's TYPE — exactly one of: Intent, Constraint, Claim, Evidence,",
    "Assumption, Unknown, Risk, Mechanism, Invariant, Decision, Action, Artifact, Tool, Eval,",
    "Memory. Pick the single best fit by what the node GENUINELY is:",
    "  • Intent — a goal/outcome the cluster serves      • Action — a concrete next move or unbuilt gap",
    "  • Eval — a test/check that would verify a claim    • Decision — a resolved choice (and its rejected alt)",
    "  • Risk — a failure mode that may occur             • Claim — an asserted fact · Evidence — a grounded one",
    "  • Invariant/Constraint — a rule/boundary that must hold   • Mechanism — a how/why   • Unknown — an open gap",
    "  • Artifact — a produced file   • Tool — an external capability   • Memory — a durable learning",
    "TYPE DIVERSITY: a healthy compile carries a RANGE of these. If every node is an Invariant you are",
    "under-excavating — the next moves (Action) and the tests (Eval) are there too; a graph of only",
    "Invariants gives the POM no plan and no verifier. Do NOT collapse a concrete next-move into an",
    "Invariant or a test into a Mechanism. But NEVER force a type: type accurately by what the node is —",
    "only emit an Action/Eval/Decision when one is genuinely present (a forced type is a lie, A2).",
    "",
    "relations is an array of TYPED cross-edges to OTHER node ids you can name (the graph layer",
    'over the tree): each {"to":"<node id>","type":"<edge type>"} where edge type is one of:',
    "depends_on, enables, blocks, contradicts, disambiguates, supports, derived_from, compiles_to,",
    "exports_to, guarded_by, verified_by, missed_by, generalizes_to, residue_of, promotes_to_memory,",
    "recompiles, defeasible, exception. Add only edges you are confident name a real relation;",
    "[] is fine. Do NOT use `contains` (the engine builds the structural spine itself).",
    "",
    "DISTINGUISH (important): if the intent FUSES two concepts that are not the same — e.g. idea vs",
    "product, usage vs retention, a build-goal vs a knowledge-goal — do NOT gloss them into one node.",
    "Split them: excavate the distinct concept as its own node and add a `disambiguates` edge from it",
    "to the node it was conflated with. A conflation made explicit is the compiler's job; a gloss is a lie.",
  );
  return lines.join("\n");
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

/** Deterministic parse of the model's JSON into a NodeSpec. Pure — no model here (A3). */
export function parseNodeSpec(raw: string): NodeSpec {
  // Tolerant: extract the first balanced JSON object even if the model wrapped it in
  // fences or added a trailing sentence. A malformed response degrades to an empty spec
  // (which the rubric then rejects) instead of crashing the whole compile.
  const parsed = parseJsonLoose(raw);
  const o = (
    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  ) as Record<string, unknown>;
  const id = String(o["id"] ?? "");
  const clusterRaw = o["cluster"];
  const cluster =
    typeof clusterRaw === "string" && clusterRaw
      ? clusterRaw
      : id.split(".")[0] || "UNK";
  return {
    id,
    label: String(o["label"] ?? ""),
    cluster,
    depth: (o["depth"] as Depth) ?? "L3",
    summary: String(o["summary"] ?? ""),
    whyItMatters: String(o["whyItMatters"] ?? ""),
    failureIfMissing: String(o["failureIfMissing"] ?? ""),
    fromPrompt: arr(o["fromPrompt"]),
    compilesTo: arr(o["compilesTo"]),
    checkClass: (o["checkClass"] as CheckClass) ?? "C0",
    cCandidates: arr(o["cCandidates"]),
    unknowns: arr(o["unknowns"]),
    truth: (o["truth"] as TruthClass) ?? "inference",
    parents: arr(o["parents"]),
    semanticType: coerceNodeType(o["semanticType"]),
    relations: parseRelations(o["relations"]),
  };
}

export async function excavateNode(
  seed: Seed,
  cluster: string,
  model: ModelClient,
  avoid: string[] = [],
): Promise<ExcavateResult> {
  const prompt = buildPrompt(seed, cluster, loadExcavator(), avoid);
  const raw = await model.complete(prompt); // the ONE model call (A1/A9)
  const spec = parseNodeSpec(raw);
  const score = scoreNode(spec);
  if (score.verdict === "reject") {
    return { spec, node: null, score, rejected: true };
  }
  return { spec, node: spec, score, rejected: false };
}
