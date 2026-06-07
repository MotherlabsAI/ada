/**
 * normalizeIntent — the INTENT FRONT-END (the stage that makes the thesis true for non-experts).
 *
 * `engineSeed` is only a floor: it reshapes the intent string (domain ≈ rootIntent, unknowns
 * empty). That is fine when an EXPERT hands a rich intent, but a non-expert types five vague
 * words — and a thin seed excavates a thin graph. This stage closes that gap: ONE compile-time
 * model call (A1/A9 — the network stays in model.ts) that EXPANDS the thin intent into a rich
 * Seed before proposal/excavation — inferring the domain, ranking objectives, and above all
 * surfacing the UNKNOWN context (the unknown-unknowns the user never thought to say).
 *
 * It is excavation, so a model is allowed (A2: ∴-inferred, traced to the intent). The PARSE is
 * pure and model-free (A3). On garbled output the floor is returned verbatim — a thin seed beats
 * a fabricated one (A2: a hole beats a lie). The pack's checks never touch this path.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Seed } from "../../core/types.js";
import { resolvePromptDir } from "./excavate.js";
import { parseJsonLoose } from "./json.js";
import type { ModelClient } from "./model.js";

function loadNormalizerPrompt(): string {
  return readFileSync(join(resolvePromptDir(), "intent-normalizer.md"), "utf8");
}

/** Build the one normalization prompt: the instructions + the intent + optional repo context. */
export function buildNormalizePrompt(
  intent: string,
  repoContext: string | undefined,
  template: string,
): string {
  const parts = [template, "", "## INTENT", intent];
  if (repoContext) {
    parts.push(
      "",
      "## REPO CONTEXT (∵ source — the existing system this intent is about)",
      repoContext,
    );
  }
  parts.push(
    "",
    "## OUTPUT",
    "Return ONE strict JSON object (no prose, no code fences) with exactly these fields:",
    '{ "domain": "<the field of expertise — NOT a restatement of the intent>",',
    '  "userRole": "<who brought this, one phrase>",',
    '  "buildObjective": "<the working artifact to produce>",',
    '  "knowledgeObjective": "<the map to compound>",',
    '  "trustObjective": "<how correctness is verified>",',
    '  "knownContext": ["<only what the intent/repo asserts>"],',
    '  "unknownContext": ["<3–8 genuine open decisions, at the semantic level>"],',
    '  "assumptions": ["..."], "constraints": ["..."], "risks": ["..."] }',
  );
  return parts.join("\n");
}

const str = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const arr = (v: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(v)) return fallback;
  const out = v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
  return out.length ? out : fallback;
};

/**
 * Deterministic parse of the model's expansion into a rich Seed (PURE — no model, A3). Tolerates
 * fenced JSON / trailing prose via `parseJsonLoose`. Each field falls back to the floor when the
 * model omitted it or returned junk — so a partial answer degrades gracefully and a garbled one
 * returns the floor verbatim. `rootIntent`/`sources`/`repoContext` are preserved from the floor
 * (the normalizer expands the intent, it does not get to rewrite what the user actually said).
 */
export function parseSeedExpansion(raw: string, floor: Seed): Seed {
  const parsed = parseJsonLoose(raw);
  const o: Record<string, unknown> =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return {
    rootIntent: floor.rootIntent,
    domain: str(o["domain"], floor.domain),
    userRole: str(o["userRole"], floor.userRole),
    buildObjective: str(o["buildObjective"], floor.buildObjective),
    knowledgeObjective: str(o["knowledgeObjective"], floor.knowledgeObjective),
    trustObjective: str(o["trustObjective"], floor.trustObjective),
    knownContext: arr(o["knownContext"], floor.knownContext),
    unknownContext: arr(o["unknownContext"], floor.unknownContext),
    assumptions: arr(o["assumptions"], floor.assumptions),
    sources: floor.sources,
    constraints: arr(o["constraints"], floor.constraints),
    risks: arr(o["risks"], floor.risks),
    ...(floor.repoContext ? { repoContext: floor.repoContext } : {}),
  };
}

/**
 * One compile-time model call (A1/A9) → a rich Seed expanded from the thin intent. The model is
 * the only thing here that touches a network; the parse is pure. A missing key (or any client
 * error) propagates so the CLI/TUI surface the `ada key` guidance, exactly like the other stages.
 */
export async function normalizeIntent(
  intent: string,
  floor: Seed,
  model: ModelClient,
): Promise<Seed> {
  const prompt = buildNormalizePrompt(
    intent,
    floor.repoContext,
    loadNormalizerPrompt(),
  );
  const raw = await model.complete(prompt); // the ONE model call (A1/A9)
  return parseSeedExpansion(raw, floor);
}
