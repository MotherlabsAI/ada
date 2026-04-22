import * as fs from "fs";
import * as path from "path";
import React from "react";
import { render } from "ink";
import {
  watchSessionLog,
  archiveSessionLog,
  mergeSessionDelta,
  createProjectionEngine,
  extractSessionInsights,
  updateSessionPatterns,
  findRelevantTopics,
  buildTopicContext,
  type SessionPatterns,
} from "@ada/governor";
import type { GovernorSignal } from "@ada/governor";
import { loadBlueprintState } from "@ada/compiler";
import {
  RunScreen,
  addActivityEvent,
  type RunState,
} from "../ui/run-screen.js";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function appendJsonl(filePath: string, record: unknown): void {
  try {
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
  } catch {
    // Best-effort — never crash the session over persistence failures
  }
}

export async function runCommand(): Promise<void> {
  const cwd = process.cwd();
  const adaDir = path.join(cwd, ".ada");
  const statePath = path.join(adaDir, "state.json");
  const sessionLogPath = path.join(adaDir, "session-log.jsonl");
  const driftAlertsPath = path.join(adaDir, "drift-alerts.jsonl");
  const worldModelDeltaPath = path.join(adaDir, "world-model-delta.json");

  // Load blueprint
  let blueprint: Parameters<typeof watchSessionLog>[1] | undefined;
  let projectDecision: string | null = null;
  let projectConfidence = 0;

  if (fs.existsSync(statePath)) {
    try {
      const loaded = loadBlueprintState(statePath);
      blueprint = loaded.blueprint;
      const raw = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<
        string,
        unknown
      >;
      if (typeof raw["decision"] === "string") {
        projectDecision = raw["decision"];
      }
      if (typeof raw["confidence"] === "number") {
        projectConfidence = raw["confidence"];
      }
    } catch {
      // Corrupt state — run ungoverned
    }
  }

  if (!blueprint) {
    console.error(
      "  ◈ no blueprint found — run ada compile <intent> first, then start claude in another terminal",
    );
    process.exit(1);
  }

  ensureDir(adaDir);

  // Load context panel data
  const topEntities = blueprint.dataModel.entities
    .slice(0, 6)
    .map((e) => e.name);

  let totalSessions = 0;
  let avgConfidence = 0;
  const patternsPath = path.join(adaDir, "topics", "_session-patterns.json");
  if (fs.existsSync(patternsPath)) {
    try {
      const patterns = JSON.parse(
        fs.readFileSync(patternsPath, "utf8"),
      ) as SessionPatterns;
      totalSessions = patterns.totalSessions;
      avgConfidence = patterns.avgFinalConfidence;
    } catch {
      // ignore corrupt patterns
    }
  }

  // Pre-load topic context for future CLAUDE.md injection
  const relevantTopics = findRelevantTopics(adaDir, blueprint, 3);
  void buildTopicContext(relevantTopics);

  // Initial run state
  const sessionStart = Date.now();
  const state: RunState = {
    projectDecision,
    projectConfidence,
    cwd,
    sessionStart,
    events: [],
    driftCount: 0,
    criticalCount: 0,
    confidence: projectConfidence,
    lastTickMs: null,
    sessionComplete: false,
    finalDecision: null,
    eventCount: 0,
    blueprintSummary: blueprint.summary ?? null,
    topEntities,
    totalSessions,
    avgConfidence,
  };

  // Ink render
  const { rerender, unmount } = render(
    React.createElement(RunScreen, { state }),
  );

  function update(): void {
    rerender(React.createElement(RunScreen, { state }));
  }

  const projectionEngine = createProjectionEngine(blueprint);

  // Session accumulators
  let checkpointCount = 0;
  const criticalDrifts: Array<{ location: string; detail: string }> = [];
  let finalConfidence = projectConfidence;

  function writeWorldModelDelta(): void {
    try {
      const delta = {
        sessionEnd: Date.now(),
        driftCount: state.driftCount,
        criticalDrifts,
        finalConfidence,
        durationMs: Date.now() - sessionStart,
      };
      fs.writeFileSync(
        worldModelDeltaPath,
        JSON.stringify(delta, null, 2) + "\n",
        "utf8",
      );
    } catch {
      // Best-effort
    }
  }

  async function cleanup(): Promise<void> {
    writeWorldModelDelta();
    const archivedPath = archiveSessionLog(adaDir);
    const insights =
      archivedPath != null
        ? extractSessionInsights(archivedPath, {
            durationMs: Date.now() - sessionStart,
            finalConfidence,
            driftCount: state.driftCount,
            criticalDrifts,
          })
        : undefined;
    mergeSessionDelta(adaDir, insights);
    if (insights != null) updateSessionPatterns(adaDir, insights);
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    unmount();
  }

  // Abort controller — fired by Ctrl+C to stop the file watcher cleanly
  const ac = new AbortController();

  process.once("SIGINT", () => {
    ac.abort();
    state.sessionComplete = true;
    state.finalDecision = "STOPPED";
    update();
  });

  // Watch session log — Claude writes PostToolUse entries, we evaluate drift
  for await (const signal of watchSessionLog(sessionLogPath, blueprint, {
    signal: ac.signal,
  })) {
    switch (signal.type) {
      case "DRIFT": {
        state.driftCount++;
        state.eventCount++;
        if (signal.severity === "critical") {
          state.criticalCount++;
          criticalDrifts.push({
            location: signal.location,
            detail: signal.detail,
          });
        }
        appendJsonl(driftAlertsPath, {
          ts: Date.now(),
          type: "DRIFT",
          severity: signal.severity,
          location: signal.location,
          detail: signal.detail,
        });
        addActivityEvent(state, {
          kind: "drift",
          label: "DRIFT",
          detail: `${signal.severity} · ${signal.location}`,
        });
        update();
        break;
      }

      case "LOW_CONFIDENCE":
        appendJsonl(driftAlertsPath, {
          ts: Date.now(),
          type: "LOW_CONFIDENCE",
          confidence: signal.confidence,
          reason: signal.reason,
        });
        break;

      case "CHECKPOINT":
        checkpointCount++;
        addActivityEvent(state, {
          kind: "checkpoint",
          label: "checkpoint",
          detail: `#${checkpointCount}`,
        });
        update();
        break;

      case "TICK_SUMMARY": {
        state.lastTickMs = Date.now();
        state.confidence = signal.confidence;
        const evaluation = projectionEngine.evaluate(
          signal.driftCount,
          signal.criticalCount,
          signal.confidence,
        );
        if (evaluation.shouldAlert && evaluation.reason !== null) {
          addActivityEvent(state, {
            kind: "drift",
            label: "TICK",
            detail: evaluation.reason,
          });
        }
        update();
        break;
      }

      case "CONFIDENCE":
        state.confidence = signal.value ?? state.confidence;
        update();
        break;

      case "SESSION_COMPLETE":
        finalConfidence = signal.finalConfidence;
        state.sessionComplete = true;
        state.finalDecision = signal.decision;
        state.confidence = signal.finalConfidence;
        update();
        if (signal.decision === "HALT") {
          await cleanup();
          process.exit(1);
        }
        break;
    }
  }

  await cleanup();
}
