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

export interface WatchOptions {
  /** Called synchronously whenever watch() yields a signal. Use for side-effects (e.g. file persistence). */
  readonly onSignal?: (signal: GovernorSignal) => void;
  /** Idle tick interval in milliseconds. Defaults to 30 000. */
  readonly tickMs?: number;
}

/** Resolves after `ms` milliseconds. Returns "timeout" so Promise.race callers can discriminate. */
function idleTimeout(ms: number): Promise<"timeout"> {
  return new Promise((resolve) => setTimeout(() => resolve("timeout"), ms));
}

export async function* watch(
  blueprint: Blueprint,
  events: AsyncIterable<ClaudeEvent>,
  confidenceThreshold: number = 0.7,
  options: WatchOptions = {},
): AsyncGenerator<GovernorSignal> {
  const { onSignal, tickMs = 30_000 } = options;
  const confidence = new ConfidenceTracker(confidenceThreshold);
  const sessionStart = Date.now();
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

  // Tick-level state: reset on each tick evaluation.
  let tickDriftCount = 0;
  let tickCriticalCount = 0;
  let tickLowConfidenceStreak = 0;
  let lastTickLowConfidence = false;

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

  /** Emit a signal and also fire the onSignal callback. */
  function* emitSignal(sig: GovernorSignal): Generator<GovernorSignal> {
    onSignal?.(sig);
    yield sig;
  }

  /** Evaluate accumulated tick state, yield summary signals if warranted, reset counters. */
  function* runTick(): Generator<GovernorSignal> {
    const shouldCheckpoint = tickDriftCount >= 3 || tickCriticalCount > 0;

    if (shouldCheckpoint) {
      const tickSummary: GovernorSignal = {
        type: "TICK_SUMMARY",
        driftCount: tickDriftCount,
        criticalCount: tickCriticalCount,
        confidence: confidence.current,
        sessionMs: Date.now() - sessionStart,
      };
      yield* emitSignal(tickSummary);

      // Also emit a checkpoint signal so callers can write state.
      const checkpointSig: GovernorSignal = {
        type: "CHECKPOINT",
        sessionId,
        timestamp: Date.now(),
      };
      yield* emitSignal(checkpointSig);
    }

    // Track consecutive ticks where confidence has been below threshold.
    if (confidence.isLow) {
      tickLowConfidenceStreak += 1;
    } else {
      tickLowConfidenceStreak = 0;
    }

    if (tickLowConfidenceStreak >= 3 && !lastTickLowConfidence) {
      lastTickLowConfidence = true;
      const lcSig: GovernorSignal = {
        type: "LOW_CONFIDENCE",
        confidence: confidence.current,
        reason:
          "Confidence has been below threshold for 3 or more consecutive ticks",
      };
      yield* emitSignal(lcSig);
    } else if (!confidence.isLow) {
      lastTickLowConfidence = false;
    }

    // Reset tick counters.
    tickDriftCount = 0;
    tickCriticalCount = 0;
  }

  // Build an async iterator from the events source so we can pull manually.
  const eventIterator = events[Symbol.asyncIterator]();

  try {
    // Event-pump loop using Promise.race between next event and idle timeout.
    while (true) {
      const nextEventPromise = eventIterator.next();

      const raceResult = await Promise.race([
        nextEventPromise.then((r) => ({ kind: "event" as const, result: r })),
        idleTimeout(tickMs).then(() => ({ kind: "timeout" as const })),
      ]);

      if (raceResult.kind === "timeout") {
        // Idle tick — evaluate accumulated state, yield tick signals.
        for (const sig of runTick()) {
          yield sig;
        }
        // Drain pending semantic signals accumulated while we were waiting.
        while (pendingSignals.length > 0) {
          const sig = pendingSignals.shift();
          if (sig) {
            onSignal?.(sig);
            yield sig;
          }
        }
        // Don't consume nextEventPromise — continue to await it next iteration
        // by letting the outer loop create a new race. We must still await the
        // outstanding promise to avoid an unhandled rejection, but we do so
        // without blocking — the iterator stays valid.
        //
        // However, async iterators don't support "peeking". The cleanest
        // approach: await the outstanding next() so it's consumed, then decide.
        const deferred = await nextEventPromise;
        if (deferred.done) break;
        // Process the event we received while ticking.
        const event = deferred.value;
        sessionId = event.session_id;
        eventBuffer.push(event);
        if (eventBuffer.length > 40) eventBuffer.shift();

        if (event.event.type === "content_block_stop") {
          const toolOutput = JSON.stringify(event.event);
          const drifts = evaluateInvariants(blueprint, toolOutput);
          for (const drift of drifts) {
            confidence.onDrift();
            tickDriftCount++;
            if (drift.severity === "critical") tickCriticalCount++;
            const sig: GovernorSignal = {
              type: "DRIFT",
              severity: drift.severity,
              location: `[heuristic] ${drift.location}`,
              detail: drift.detail,
            };
            yield* emitSignal(sig);
          }
          eventCountSinceSemantic += 1;
          if (eventCountSinceSemantic >= semanticInterval) {
            eventCountSinceSemantic = 0;
            runSemanticPass(eventBuffer.slice(-20));
          }
        }

        if (
          event.event.type === "message_stop" &&
          event.parent_tool_use_id !== null
        ) {
          if (!hasEmittedConfidence) {
            hasEmittedConfidence = true;
            yield* emitSignal({
              type: "CONFIDENCE",
              value: confidence.current,
            });
          }
          writeCheckpoint({
            sessionId,
            blueprint,
            iterationCount: 0,
            gateHistory: [],
            lastGovernorDecision: null,
            timestamp: Date.now(),
          });
          yield* emitSignal({
            type: "CHECKPOINT",
            sessionId,
            timestamp: Date.now(),
          });
          eventCountSinceSemantic = 0;
          runSemanticPass(eventBuffer.slice(-20));
        }

        while (pendingSignals.length > 0) {
          const sig = pendingSignals.shift();
          if (sig) {
            onSignal?.(sig);
            yield sig;
          }
        }

        if (confidence.isLow && !hasEmittedLowConfidence) {
          hasEmittedLowConfidence = true;
          yield* emitSignal({
            type: "LOW_CONFIDENCE",
            confidence: confidence.current,
            reason:
              "Accumulated drift signals reduced confidence below threshold",
          });
        }

        continue;
      }

      // Normal event received.
      const { result } = raceResult;
      if (result.done) break;

      const event = result.value;
      sessionId = event.session_id;
      eventBuffer.push(event);
      if (eventBuffer.length > 40) eventBuffer.shift();

      // On content_block_stop — check invariants (heuristic, fast path)
      if (event.event.type === "content_block_stop") {
        const toolOutput = JSON.stringify(event.event);
        const drifts = evaluateInvariants(blueprint, toolOutput);

        for (const drift of drifts) {
          confidence.onDrift();
          tickDriftCount++;
          if (drift.severity === "critical") tickCriticalCount++;
          const sig: GovernorSignal = {
            type: "DRIFT",
            severity: drift.severity,
            location: `[heuristic] ${drift.location}`,
            detail: drift.detail,
          };
          yield* emitSignal(sig);
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
          yield* emitSignal({ type: "CONFIDENCE", value: confidence.current });
        }

        writeCheckpoint({
          sessionId,
          blueprint,
          iterationCount: 0,
          gateHistory: [],
          lastGovernorDecision: null,
          timestamp: Date.now(),
        });

        yield* emitSignal({
          type: "CHECKPOINT",
          sessionId,
          timestamp: Date.now(),
        });

        // Run a semantic pass at subagent boundaries — natural reasoning unit.
        eventCountSinceSemantic = 0;
        runSemanticPass(eventBuffer.slice(-20));
      }

      // Drain any pending semantic-drift signals accumulated so far.
      while (pendingSignals.length > 0) {
        const sig = pendingSignals.shift();
        if (sig) {
          onSignal?.(sig);
          yield sig;
        }
      }

      // Low confidence warning — emit once when threshold is crossed
      if (confidence.isLow && !hasEmittedLowConfidence) {
        hasEmittedLowConfidence = true;
        yield* emitSignal({
          type: "LOW_CONFIDENCE",
          confidence: confidence.current,
          reason:
            "Accumulated drift signals reduced confidence below threshold",
        });
      }
    }
  } catch {
    // All errors become DRIFT signals — watch() never throws
    const errSig: GovernorSignal = {
      type: "DRIFT",
      severity: "critical",
      location: "governor.watch",
      detail: "Event stream error",
    };
    yield* emitSignal(errSig);
  }

  // Drain any in-flight semantic passes before declaring session complete.
  if (inflightSemantic.length > 0) {
    await Promise.allSettled(inflightSemantic);
  }
  while (pendingSignals.length > 0) {
    const sig = pendingSignals.shift();
    if (sig) {
      onSignal?.(sig);
      yield sig;
    }
  }

  // Session complete
  const finalDecision =
    confidence.current >= 0.8
      ? ("ACCEPT" as const)
      : confidence.current >= 0.5
        ? ("DRIFT" as const)
        : ("HALT" as const);

  const completeSig: GovernorSignal = {
    type: "SESSION_COMPLETE",
    finalConfidence: confidence.current,
    decision: finalDecision,
  };
  yield* emitSignal(completeSig);
}
