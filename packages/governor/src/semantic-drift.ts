import type { Blueprint } from "@ada/compiler";
import type { ClaudeEvent } from "@ada/orchestrator";
import type { DriftResult } from "./drift.js";
import { callWithExtendedThinking, getApiKey } from "./llm-client.js";

/**
 * semantic-drift — LLM-evaluated drift across event windows.
 *
 * Complements the heuristic `evaluateInvariants` path in drift.ts.
 * Heuristic drift catches per-event violations via regex. Semantic drift
 * catches drift that only emerges across a sequence of calls: silent
 * invariant drops, process precondition violations, scope creep.
 *
 * Fail-open: returns null if LLM unavailable. Watch loop falls back to
 * heuristic-only signaling when this returns null.
 */

export interface SemanticDriftOptions {
  readonly thinkingBudget?: number;
  readonly maxEventsInWindow?: number;
  readonly timeoutMs?: number;
}

export interface SemanticDriftResult extends DriftResult {
  readonly source: "semantic";
  readonly invariantsViolated: readonly string[];
}

const SYSTEM_PROMPT = `You are the Ada runtime governor. You observe sequences of tool calls made by a Claude Code agent against a compiled semantic blueprint. Your job is to detect semantic drift — cases where the agent's recent actions have silently weakened or broken the invariants, workflows, or bounded contexts in the blueprint.

You are NOT checking syntax. You are NOT running the code. You are reasoning about whether the sequence of recent actions preserves the compiled intent.

Rules:
- Only flag drift that is specific. Name the entity, the invariant, or the workflow postcondition that is at risk.
- Do NOT flag cosmetic changes (renames that preserve meaning, formatting, comments).
- DO flag: dropped null checks, removed validation, weakened invariants, scope creep past bounded context boundaries, workflow postconditions no longer satisfiable.
- Severity: critical = core invariant lost; major = bounded context breach or edge case dropped; minor = weakening but still satisfied.
- Be calibrated. False positives here cost the user trust. Under uncertainty, prefer no drift.`;

function buildUserPrompt(
  blueprint: Blueprint,
  events: readonly ClaudeEvent[],
): string {
  const entities = blueprint.dataModel.entities
    .map((e) => {
      const invLines = e.invariants
        .map(
          (i) =>
            `    - ${i.predicate}${i.description ? ` (${i.description})` : ""}`,
        )
        .join("\n");
      return `  Entity ${e.name} [${e.category}]:\n${invLines || "    (no invariants)"}`;
    })
    .join("\n\n");

  const workflows = blueprint.processModel.workflows
    .slice(0, 10)
    .map((w) => {
      const steps = w.steps
        .slice(0, 6)
        .map(
          (s) =>
            `    - ${s.name}: { pre: ${s.hoareTriple.precondition}, post: ${s.hoareTriple.postcondition} }`,
        )
        .join("\n");
      return `  Workflow ${w.name}:\n${steps || "    (no steps)"}`;
    })
    .join("\n\n");

  const eventSummaries = events
    .map((ev, idx) => {
      const t = ev.event.type;
      const body = summarizeEvent(ev);
      return `  [${idx}] type=${t} ${body}`;
    })
    .join("\n");

  return `# Blueprint summary
${blueprint.summary}

# Entities and invariants
${entities || "(none)"}

# Workflows (first 10)
${workflows || "(none)"}

# Recent tool-call events (chronological)
${eventSummaries || "(none)"}

# Task

Return a JSON object with this shape:

{
  "drifts": [
    {
      "severity": "critical" | "major" | "minor",
      "location": "<entity-name>.<invariant>" or "<workflow-name>.<step>",
      "detail": "<one sentence describing what drifted>",
      "invariantsViolated": ["<predicate string>"]
    }
  ]
}

If no drift, return { "drifts": [] }. Do not wrap in prose — JSON only.`;
}

function summarizeEvent(ev: ClaudeEvent): string {
  const e = ev.event as { type: string; [key: string]: unknown };
  if (e.type === "content_block_start" || e.type === "content_block_stop") {
    const block = (e["content_block"] ?? {}) as {
      type?: string;
      name?: string;
    };
    return `block=${block.type ?? "?"}${block.name ? ` name=${block.name}` : ""}`;
  }
  if (e.type === "message_start" || e.type === "message_stop") {
    return `parent=${ev.parent_tool_use_id ?? "root"}`;
  }
  return "";
}

export async function evaluateSemanticDrift(
  blueprint: Blueprint,
  recentEvents: readonly ClaudeEvent[],
  options: SemanticDriftOptions = {},
): Promise<readonly SemanticDriftResult[] | null> {
  if (!getApiKey()) return null;
  if (recentEvents.length === 0) return [];

  const windowSize = options.maxEventsInWindow ?? 20;
  const window = recentEvents.slice(-windowSize);

  const result = await callWithExtendedThinking({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(blueprint, window),
    thinkingBudget: options.thinkingBudget ?? 6000,
    timeoutMs: options.timeoutMs ?? 30_000,
  });

  if (!result || !result.json) return null;

  return parseDrifts(result.json);
}

function parseDrifts(json: unknown): readonly SemanticDriftResult[] {
  if (!json || typeof json !== "object") return [];
  const obj = json as { drifts?: unknown };
  if (!Array.isArray(obj.drifts)) return [];

  const out: SemanticDriftResult[] = [];
  for (const raw of obj.drifts) {
    if (!raw || typeof raw !== "object") continue;
    const d = raw as {
      severity?: unknown;
      location?: unknown;
      detail?: unknown;
      invariantsViolated?: unknown;
    };

    const sev = typeof d.severity === "string" ? d.severity : "minor";
    if (sev !== "critical" && sev !== "major" && sev !== "minor") continue;

    const location = typeof d.location === "string" ? d.location : "unknown";
    const detail =
      typeof d.detail === "string" ? d.detail : "Unspecified drift";
    const invariantsViolated = Array.isArray(d.invariantsViolated)
      ? d.invariantsViolated.filter((v): v is string => typeof v === "string")
      : [];

    out.push({
      hasDrift: true,
      severity: sev,
      location,
      detail,
      source: "semantic",
      invariantsViolated,
    });
  }
  return out;
}
