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
import type { Seed, CheckClass, Depth, TruthClass } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";
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
    "unknowns (string[]), truth, parents (string[]).",
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
