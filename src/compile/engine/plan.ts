/**
 * proposeActions — the PLANNER pass (the execution_plan compiler).
 *
 * The excavator DESCRIBES the world (invariants, mechanisms, unknowns, risks); a plan is a
 * different cut — the concrete MOVES from the current repo to the goal. Dogfooding Ada on its
 * own repo proved a type cue alone can't make a descriptive frame emit prescriptive Action nodes
 * (Risk/Eval appeared; Action did not). So this is a distinct stage: ONE compile-time model call
 * (A1/A9) that reads the goal + the excavated world and names the next moves, each an Action
 * TRACED to the gap (an open unknown, a live risk, an unenforced invariant) it closes — never a
 * move the system already makes (A2). Every action is gated by the SAME deterministic rubric the
 * excavator's nodes clear (A3); a generic move is rejected, not kept. The kept Actions flow into
 * the POM's `execution_plan`, giving the problem model a plan, not just a constraint atlas.
 */
import type { Seed } from "../../core/types.js";
import type { NodeSpec } from "../assemble.js";
import { scoreNode, type RubricScore } from "../rubric.js";
import { parseJsonLoose } from "./json.js";
import type { ModelClient } from "./model.js";
import type { RejectedSpec } from "./orchestrate.js";

/** The cluster the plan's Action nodes live under (domain-adaptive registry adds the label). */
export const PLAN_CLUSTER = "PLAN";

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

/** A parsed action draft, pre-gate and pre-id. `closesGap` names the world node it resolves. */
export interface ActionDraft {
  label: string;
  summary: string;
  whyItMatters: string;
  failureIfMissing: string;
  fromPrompt: string[];
  compilesTo: string[];
  checkClass: NodeSpec["checkClass"];
  cCandidates: string[];
  unknowns: string[];
  truth: NodeSpec["truth"];
  /** The label (or id) of the world node this move closes — resolved to a real id downstream. */
  closesGap: string;
}

/** Compress the excavated world to the gaps a plan acts on: what must hold, and what's open. */
function worldDigest(world: NodeSpec[]): string {
  const pick = (...types: string[]): NodeSpec[] =>
    world.filter((n) => n.semanticType && types.includes(n.semanticType));
  const block = (title: string, ns: NodeSpec[]): string =>
    ns.length
      ? `${title}\n${ns.map((n) => `- ${n.label}: ${n.summary}`).join("\n")}`
      : `${title}\n- (none)`;
  return [
    block("INVARIANTS that must hold:", pick("Invariant", "Constraint")),
    block("OPEN gaps / unknowns:", pick("Unknown")),
    block("RISKS to mitigate:", pick("Risk")),
  ].join("\n\n");
}

/** Build the planner prompt: move from this world → the goal, as gated, traced Action nodes. */
export function buildPlanPrompt(seed: Seed, world: NodeSpec[]): string {
  return [
    "You are Ada's PLANNER. The excavator has described the world below. Your job is the OTHER",
    "cut: the concrete NEXT MOVES that get from the current repo to the goal — the execution plan.",
    "",
    `GOAL: ${seed.buildObjective || seed.rootIntent}`,
    `DOMAIN: ${seed.domain}`,
    "",
    worldDigest(world),
    "",
    "Return a JSON array (no prose, no fences) of 3–6 Action objects (each is a node of type",
    "Action). Each is a concrete move,",
    "verb-first and specific, that CLOSES one of the gaps above (resolves an unknown, mitigates a",
    "risk, or enforces an invariant that isn't yet enforced). Keys per action:",
    "  label, summary, whyItMatters, failureIfMissing, fromPrompt (string[] — trace to the goal or",
    "  a gap), compilesTo (string[], ≥2 concrete artifacts), checkClass, cCandidates (string[]),",
    "  unknowns (string[]), truth, closesGap (the exact label of the world node this move closes).",
    "",
    "HONESTY (A2): only name a move that is NOT already done. If the system already does it, it is",
    "not an action — drop it. A vague move ('improve quality', 'make it robust') will be rejected by",
    "a deterministic rubric; state the mechanism, the artifact it produces, and the gap it closes.",
  ].join("\n");
}

/** Parse the planner's JSON array into action drafts. Tolerant; drops malformed entries. */
export function parseActionList(raw: string): ActionDraft[] {
  const parsed = parseJsonLoose(raw);
  if (!Array.isArray(parsed)) return [];
  const out: ActionDraft[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const label = typeof o["label"] === "string" ? o["label"].trim() : "";
    if (!label) continue;
    out.push({
      label,
      summary: String(o["summary"] ?? ""),
      whyItMatters: String(o["whyItMatters"] ?? ""),
      failureIfMissing: String(o["failureIfMissing"] ?? ""),
      fromPrompt: arr(o["fromPrompt"]),
      compilesTo: arr(o["compilesTo"]),
      checkClass: (o["checkClass"] as NodeSpec["checkClass"]) ?? "C0",
      cCandidates: arr(o["cCandidates"]),
      unknowns: arr(o["unknowns"]),
      truth: (o["truth"] as NodeSpec["truth"]) ?? "inference",
      closesGap:
        typeof o["closesGap"] === "string" ? o["closesGap"].trim() : "",
    });
  }
  return out;
}

function normLabel(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface ProposeActionsResult {
  /** Gated Action NodeSpecs, PLAN-clustered, with positional ids and gap-resolved relations. */
  actions: NodeSpec[];
  /** Drafts the rubric refused or that duplicated a kept action — for the audit trail. */
  rejected: RejectedSpec[];
}

/**
 * The planner stage: ONE model call → gated Action nodes. Each draft is turned into a NodeSpec
 * (semanticType Action, cluster PLAN), scored by the SAME rubric the excavator uses (A3), and —
 * when its `closesGap` resolves to a real world node — wired to it with an `enables` edge so the
 * plan is traceable in the graph. Degrades to no actions on non-array/garbled output.
 */
export async function proposeActions(
  seed: Seed,
  world: NodeSpec[],
  model: ModelClient,
): Promise<ProposeActionsResult> {
  const raw = await model.complete(buildPlanPrompt(seed, world)); // the ONE planner call (A1/A9)
  const drafts = parseActionList(raw);
  const byLabel = new Map(world.map((n) => [normLabel(n.label), n.id]));
  const actions: NodeSpec[] = [];
  const rejected: RejectedSpec[] = [];
  const seen = new Set<string>();

  for (const d of drafts) {
    const gapId = byLabel.get(normLabel(d.closesGap));
    const spec: NodeSpec = {
      id: "PLAN.000", // positional id assigned on keep
      label: d.label,
      cluster: PLAN_CLUSTER,
      depth: "L3",
      summary: d.summary,
      whyItMatters: d.whyItMatters,
      failureIfMissing: d.failureIfMissing,
      fromPrompt: d.fromPrompt,
      compilesTo: d.compilesTo,
      checkClass: d.checkClass,
      cCandidates: d.cCandidates,
      unknowns: d.unknowns,
      truth: d.truth,
      parents: ["ROOT.000"],
      semanticType: "Action",
      // Wire the move to the gap it closes — only when that gap resolves to a real node (A2).
      relations: gapId ? [{ to: gapId, type: "enables" }] : [],
    };
    const score: RubricScore = scoreNode(spec);
    if (score.verdict === "reject") {
      rejected.push({ spec, score, reason: "gate" });
      continue;
    }
    const key = normLabel(spec.label);
    if (seen.has(key)) {
      rejected.push({ spec, score, reason: "duplicate" });
      continue;
    }
    seen.add(key);
    actions.push({
      ...spec,
      id: `${PLAN_CLUSTER}.${String(actions.length + 1).padStart(3, "0")}`,
    });
  }
  return { actions, rejected };
}
