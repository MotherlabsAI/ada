/**
 * proposeClusters — the compile-time, model-driven step that derives DOMAIN-APPROPRIATE
 * area clusters from the SEED, instead of forcing every intent through one hardcoded
 * (marketing-shaped) cluster set. ONE model call via the injected `ModelClient` — so the
 * network stays in `model.ts` (AXIOM A1: model at compile time only; A9: that single
 * compile-time call is the only outbound call). Parsing and assembly here are PURE and
 * model-free (AXIOM A3); the grep-guard test asserts no network token lives in this file.
 *
 * ROOT (the world-model anchor) and UNK (unknown-unknowns) are STRUCTURAL — they are always
 * present and are NOT proposed by the model; if the model proposes them anyway, the engine's
 * canonical versions win and the model's are discarded. On empty/garbled output we fall back
 * to a sane, domain-agnostic default set (which already contains ROOT+UNK).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Seed } from "../../core/types.js";
import { resolvePromptDir } from "./excavate.js";
import type { ModelClient } from "./model.js";

/** A domain area cluster: a short UPPERCASE code + a human-readable label. */
export interface ClusterDef {
  /** Short UPPERCASE token, e.g. ARCH / PIPE / GOV / EXEC. The id prefix on its nodes. */
  code: string;
  /** Human name shown in the TUI / wiki, e.g. "Architecture". */
  label: string;
}

/** The world-model anchor — always first, never proposed by the model. */
export const ROOT_CLUSTER: ClusterDef = { code: "ROOT", label: "Context root" };
/** Unknown-unknowns — always last, never proposed by the model. */
export const UNK_CLUSTER: ClusterDef = {
  code: "UNK",
  label: "Unknown-unknowns",
};

/**
 * The fallback when the model returns nothing usable. Domain-agnostic on purpose: ARCH /
 * FLOW / DATA / CHECK are the structural areas almost any knowledge domain has (the thing's
 * shape, how it moves, what it holds, how it's verified), wrapped by the ROOT+UNK anchors.
 * NOT a marketing vocabulary — a non-software pack hits the same buckets.
 */
export const DEFAULT_PROPOSED_CLUSTERS: ClusterDef[] = [
  ROOT_CLUSTER,
  { code: "ARCH", label: "Architecture" },
  { code: "FLOW", label: "Workflows" },
  { code: "DATA", label: "Data & state" },
  { code: "CHECK", label: "Checks" },
  UNK_CLUSTER,
];

/** Model proposes between MIN and MAX domain areas (excluding the two anchors). */
const MIN_AREAS = 3;
const MAX_AREAS = 6;

function loadProposerPrompt(): string {
  return readFileSync(join(resolvePromptDir(), "cluster-proposer.md"), "utf8");
}

/** Sanitize a model-proposed code to a short UPPERCASE token; "" if nothing usable. */
function sanitizeCode(raw: unknown): string {
  const s = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  // Must start with a letter (a check id prefix is a token, never leading-digit).
  const m = /^[A-Z][A-Z0-9]*/.exec(s);
  return m ? m[0].slice(0, 12) : "";
}

/**
 * Deterministic parse of the model's proposal into clean ClusterDefs (PURE — no model, A3).
 * Tolerates a bare JSON array, a `{ "clusters": [...] }` wrapper, or fenced JSON. Sanitizes
 * codes, drops empties, dedupes by code, strips the structural anchors (the engine injects
 * those), and caps at MAX_AREAS. Returns [] when there is nothing usable (→ caller falls back).
 */
export function parseClusterProposal(raw: string): ClusterDef[] {
  const text = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  if (!text) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const list: unknown = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)["clusters"]
      : undefined;
  if (!Array.isArray(list)) return [];

  const out: ClusterDef[] = [];
  const seen = new Set<string>([ROOT_CLUSTER.code, UNK_CLUSTER.code]);
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const code = sanitizeCode(o["code"]);
    if (!code || seen.has(code)) continue; // empty, or a dup / a structural anchor
    const label = String(o["label"] ?? "").trim() || code;
    seen.add(code);
    out.push({ code, label });
    if (out.length >= MAX_AREAS) break;
  }
  return out;
}

function buildProposalPrompt(seed: Seed, template: string): string {
  return [
    template,
    "",
    "## SEED",
    `root intent: ${seed.rootIntent}`,
    `domain: ${seed.domain}`,
    `build objective: ${seed.buildObjective}`,
    `knowledge objective: ${seed.knowledgeObjective}`,
    "",
    "## OUTPUT",
    `Return a strict JSON array of ${MIN_AREAS}–${MAX_AREAS} objects (no prose, no code fences),`,
    'each: { "code": "<SHORT_UPPERCASE_TOKEN>", "label": "<human area name>" }.',
    "Do NOT include ROOT or UNK — the engine adds those.",
  ].join("\n");
}

/**
 * One compile-time model call (A1/A9) → 3–6 domain area clusters for this intent, wrapped by
 * the ROOT anchor (first) and the UNK unknown-unknowns area (last). On empty/garbled output,
 * or when the model yields fewer than MIN_AREAS usable areas, falls back to the sane default
 * set. The model is the only thing that touches a network — this function is otherwise pure.
 */
export async function proposeClusters(
  seed: Seed,
  model: ModelClient,
): Promise<ClusterDef[]> {
  const prompt = buildProposalPrompt(seed, loadProposerPrompt());
  const raw = await model.complete(prompt); // the ONE model call (A1/A9)
  const areas = parseClusterProposal(raw);
  // A real domain has at least a few areas; too few means the model failed to engage with the
  // intent — prefer the honest default over a thin, forced set.
  if (areas.length < MIN_AREAS) return DEFAULT_PROPOSED_CLUSTERS;
  return [ROOT_CLUSTER, ...areas, UNK_CLUSTER];
}
