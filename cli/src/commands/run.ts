import * as fs from "fs";
import * as path from "path";
import { spawn } from "@ada/orchestrator";
import {
  watch,
  archiveSessionLog,
  mergeSessionDelta,
  createProjectionEngine,
} from "@ada/governor";
import type { GovernorSignal } from "@ada/governor";
import { loadBlueprintState } from "@ada/compiler";
import { glyphs } from "../ui/design-system.js";

/** Ensure a directory exists, creating it recursively if needed. */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Append a JSONL line to a file, creating it if needed. Never throws. */
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

  // Load blueprint if one exists — governor watches against it
  let blueprint: Parameters<typeof watch>[0] | undefined;

  if (fs.existsSync(statePath)) {
    try {
      const { blueprint: bp } = loadBlueprintState(statePath);
      blueprint = bp;
    } catch {
      // Corrupt state — run ungoverned, no crash
    }
  }

  if (blueprint) {
    console.log(
      `  ${glyphs.identity.core} launching claude code with governor...`,
    );
  } else {
    console.log(
      `  ${glyphs.identity.core} launching claude code (no blueprint — run 'ada compile' first)...`,
    );
  }

  const rawEvents = spawn({
    workingDir: cwd,
    outputFormat: "stream-json",
  });

  if (!blueprint) {
    // No blueprint — passthrough mode, just stream events
    for await (const event of rawEvents) {
      if (event.event.type === "content_block_start") {
        process.stdout.write(".");
      }
    }
    console.log("\n  session complete.\n");
    return;
  }

  // Build projection engine from blueprint — used for richer TICK_SUMMARY alerts
  const projectionEngine = createProjectionEngine(blueprint);

  // Governed mode — ensure .ada/ directory exists before writing
  ensureDir(adaDir);

  // Wrap the raw event stream: tee each event to session-log.jsonl
  async function* teeEvents(): AsyncGenerator<
    Awaited<
      ReturnType<(typeof rawEvents)[typeof Symbol.asyncIterator]>
    >["value"]
  > {
    for await (const event of rawEvents) {
      appendJsonl(sessionLogPath, { ts: Date.now(), event: event.event });
      yield event;
    }
  }

  // onSignal: persist DRIFT and LOW_CONFIDENCE signals to drift-alerts.jsonl
  const onSignal = (signal: GovernorSignal): void => {
    if (signal.type === "DRIFT" || signal.type === "LOW_CONFIDENCE") {
      const record =
        signal.type === "DRIFT"
          ? {
              ts: Date.now(),
              type: "DRIFT",
              severity: signal.severity,
              location: signal.location,
              detail: signal.detail,
            }
          : {
              ts: Date.now(),
              type: "LOW_CONFIDENCE",
              confidence: signal.confidence,
              reason: signal.reason,
            };
      appendJsonl(driftAlertsPath, record);
    }
  };

  // Session-level accumulators for world-model-delta
  let driftCount = 0;
  let checkpointCount = 0;
  const sessionStart = Date.now();
  const criticalDrifts: Array<{ location: string; detail: string }> = [];
  let finalConfidence = 1.0;

  for await (const signal of watch(blueprint, teeEvents(), 0.7, { onSignal })) {
    switch (signal.type) {
      case "DRIFT":
        driftCount++;
        if (signal.severity === "critical") {
          criticalDrifts.push({
            location: signal.location,
            detail: signal.detail,
          });
          console.error(
            `\n  ${glyphs.status.fail} drift [${signal.severity}] ${signal.location}: ${signal.detail}`,
          );
        }
        break;

      case "LOW_CONFIDENCE":
        console.error(
          `\n  ${glyphs.status.alert} confidence low (${Math.round(signal.confidence * 100)}%) — ${signal.reason}`,
        );
        break;

      case "CHECKPOINT":
        checkpointCount++;
        process.stdout.write(
          `\n  ${glyphs.status.pass} checkpoint ${checkpointCount} written\n`,
        );
        break;

      case "TICK_SUMMARY": {
        // Use projection engine to decide whether to surface this tick
        const evaluation = projectionEngine.evaluate(
          signal.driftCount,
          signal.criticalCount,
          signal.confidence,
        );
        if (evaluation.shouldAlert && evaluation.reason !== null) {
          process.stderr.write(
            `\n  ${glyphs.status.alert} tick alert: ${evaluation.reason} — confidence ${Math.round(signal.confidence * 100)}%\n`,
          );
        } else if (signal.driftCount > 0 || signal.criticalCount > 0) {
          process.stderr.write(
            `\n  · tick: ${signal.driftCount} drifts (${signal.criticalCount} critical), confidence ${Math.round(signal.confidence * 100)}%\n`,
          );
        }
        break;
      }

      case "CONFIDENCE":
        // Intermediate confidence update — quiet
        break;

      case "SESSION_COMPLETE": {
        finalConfidence = signal.finalConfidence;
        const pct = Math.round(signal.finalConfidence * 100);
        const icon =
          signal.decision === "ACCEPT"
            ? glyphs.status.pass
            : signal.decision === "DRIFT"
              ? glyphs.status.alert
              : glyphs.status.fail;

        console.log(`\n  ${icon} session complete — confidence ${pct}%`);
        if (driftCount > 0) {
          console.log(
            `  ${driftCount} drift signal${driftCount === 1 ? "" : "s"} detected`,
          );
        }
        if (signal.decision === "HALT") {
          // Write delta before exiting
          writeWorldModelDelta();
          process.exit(1);
        }
        break;
      }
    }
  }

  // Write idle consolidation delta after session ends
  writeWorldModelDelta();

  // Three-layer memory update
  archiveSessionLog(adaDir); // Layer 3: move session-log.jsonl to .ada/sessions/{ts}.jsonl
  mergeSessionDelta(adaDir); // Layer 1: update world-model-index.md with delta confidence

  console.log();

  function writeWorldModelDelta(): void {
    try {
      const delta = {
        sessionEnd: Date.now(),
        driftCount,
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
      // Best-effort — never crash on delta write failure
    }
  }
}
