import type { Blueprint } from "@ada/compiler";
import type { ClaudeEvent } from "@ada/orchestrator";
import { writeCheckpoint } from "@ada/orchestrator";
import type { GovernorSignal } from "./signals.js";
import { ConfidenceTracker } from "./confidence.js";
import { evaluateInvariants } from "./drift.js";
import { evaluateSemanticDrift } from "./semantic-drift.js";
import { getApiKey } from "./llm-client.js";

function readInt(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function* watch(
  blueprint: Blueprint,
  events: AsyncIterable<ClaudeEvent>,
  confidenceThreshold: number = 0.7,
): AsyncGenerator<GovernorSignal> {
  const confidence = new ConfidenceTracker(confidenceThreshold);
  let sessionId = "";
  let hasEmittedConfidence = false;
  let hasEmittedLowConfidence = false;

  // Semantic-drift buffer: recent events kept for periodic LLM evaluation.
  const semanticInterval = readInt("ADA_SEMANTIC_DRIFT_INTERVAL", 10);
  const semanticEnabled = getApiKey() !== null;
  const eventBuffer: ClaudeEvent[] = [];
  let eventCountSinceSemantic = 0;

  // Fire-and-forget semantic drift checks — never block the event stream.
  // Results arrive as signals yielded from the pending queue.
  const pendingSignals: GovernorSignal[] = [];
  const inflightSemantic: Promise<void>[] = [];

  const runSemanticPass = (windowEvents: readonly ClaudeEvent[]): void => {
    if (!semanticEnabled || windowEvents.length === 0) return;
    const snapshot = [...windowEvents];
    const task = (async () => {
      const results = await evaluateSemanticDrift(blueprint, snapshot);
      if (!results) return;
      for (const r of results) {
        confidence.onDrift();
        pendingSignals.push({
          type: "DRIFT",
          severity: r.severity,
          location: `[semantic] ${r.location}`,
          detail: r.detail,
        });
      }
    })().catch(() => {
      // swallow — semantic drift is fail-open
    });
    inflightSemantic.push(task);
  };

  try {
    for await (const event of events) {
      sessionId = event.session_id;
      eventBuffer.push(event);
      if (eventBuffer.length > 40) eventBuffer.shift();

      // On PostToolUse — check invariants (heuristic, fast path)
      if (event.event.type === "content_block_stop") {
        const toolOutput = JSON.stringify(event.event);
        const drifts = evaluateInvariants(blueprint, toolOutput);

        for (const drift of drifts) {
          confidence.onDrift();
          yield {
            type: "DRIFT",
            severity: drift.severity,
            location: `[heuristic] ${drift.location}`,
            detail: drift.detail,
          };
        }

        eventCountSinceSemantic += 1;
        if (eventCountSinceSemantic >= semanticInterval) {
          eventCountSinceSemantic = 0;
          runSemanticPass(eventBuffer.slice(-20));
        }
      }

      // On SubagentStop — checkpoint + postcondition check + semantic pass
      if (
        event.event.type === "message_stop" &&
        event.parent_tool_use_id !== null
      ) {
        if (!hasEmittedConfidence) {
          hasEmittedConfidence = true;
          yield { type: "CONFIDENCE", value: confidence.current };
        }

        writeCheckpoint({
          sessionId,
          blueprint,
          iterationCount: 0,
          gateHistory: [],
          lastGovernorDecision: null,
          timestamp: Date.now(),
        });

        yield { type: "CHECKPOINT", sessionId, timestamp: Date.now() };

        // Run a semantic pass at subagent boundaries — natural reasoning unit.
        eventCountSinceSemantic = 0;
        runSemanticPass(eventBuffer.slice(-20));
      }

      // Drain any pending semantic-drift signals accumulated so far.
      while (pendingSignals.length > 0) {
        const sig = pendingSignals.shift();
        if (sig) yield sig;
      }

      // Low confidence warning — emit once when threshold is crossed
      if (confidence.isLow && !hasEmittedLowConfidence) {
        hasEmittedLowConfidence = true;
        yield {
          type: "LOW_CONFIDENCE",
          confidence: confidence.current,
          reason:
            "Accumulated drift signals reduced confidence below threshold",
        };
      }
    }
  } catch {
    // All errors become DRIFT signals — watch() never throws
    yield {
      type: "DRIFT",
      severity: "critical",
      location: "governor.watch",
      detail: "Event stream error",
    };
  }

  // Drain any in-flight semantic passes before declaring session complete.
  if (inflightSemantic.length > 0) {
    await Promise.allSettled(inflightSemantic);
  }
  while (pendingSignals.length > 0) {
    const sig = pendingSignals.shift();
    if (sig) yield sig;
  }

  // Session complete
  const finalDecision =
    confidence.current >= 0.8
      ? ("ACCEPT" as const)
      : confidence.current >= 0.5
        ? ("DRIFT" as const)
        : ("HALT" as const);

  yield {
    type: "SESSION_COMPLETE",
    finalConfidence: confidence.current,
    decision: finalDecision,
  };
}
