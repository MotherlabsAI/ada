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
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Seed, CheckClass, Depth, TruthClass } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";
import { scoreNode, type RubricScore } from "../rubric.js";
import type { ModelClient } from "./model.js";

// The versioned excavator prompt lives in source. Read from the repo at compile time;
// bundling prompts for distribution is a later concern, not this slice.
const PROMPT_DIR = join(process.cwd(), "src", "compile", "prompts");

function loadExcavator(): string {
  return readFileSync(join(PROMPT_DIR, "excavator.md"), "utf8");
}

export interface ExcavateResult {
  /** The kept node, if it cleared the gate; null when rejected. */
  node: NodeSpec | null;
  /** The deterministic rubric verdict — always present, for auditing. */
  score: RubricScore;
  /** True when the gate refused the candidate. */
  rejected: boolean;
}

function buildPrompt(seed: Seed, cluster: string, template: string): string {
  return [
    template,
    "",
    "## SEED",
    `root intent: ${seed.rootIntent}`,
    `domain: ${seed.domain}`,
    `objective: ${seed.buildObjective}`,
    `cluster to excavate: ${cluster}`,
    "",
    "## OUTPUT",
    "Return exactly ONE NodeSpec as strict JSON (no prose, no code fences) with keys:",
    "id, label, cluster, depth, summary, whyItMatters, failureIfMissing,",
    "fromPrompt (string[]), compilesTo (string[]), checkClass, cCandidates (string[]),",
    "unknowns (string[]), truth, parents (string[]).",
  ].join("\n");
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

/** Deterministic parse of the model's JSON into a NodeSpec. Pure — no model here (A3). */
export function parseNodeSpec(raw: string): NodeSpec {
  const text = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const o = JSON.parse(text) as Record<string, unknown>;
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
  };
}

export async function excavateNode(
  seed: Seed,
  cluster: string,
  model: ModelClient,
): Promise<ExcavateResult> {
  const prompt = buildPrompt(seed, cluster, loadExcavator());
  const raw = await model.complete(prompt); // the ONE model call (A1/A9)
  const node = parseNodeSpec(raw);
  const score = scoreNode(node);
  if (score.verdict === "reject") {
    return { node: null, score, rejected: true };
  }
  return { node, score, rejected: false };
}
