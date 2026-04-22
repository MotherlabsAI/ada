import * as fs from "fs";
import * as path from "path";
import { loadBlueprintState } from "@ada/compiler";
import { watchSessionLog } from "@ada/governor";

/** Append a JSONL line to a file. Never throws. */
function appendJsonl(filePath: string, record: unknown): void {
  try {
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
  } catch {
    // Best-effort — never crash the watcher over persistence failures
  }
}

export async function governCommand(argv: readonly string[]): Promise<void> {
  const cwd = process.cwd();

  const logArg = argv.indexOf("--log");
  const logPath =
    logArg !== -1 && argv[logArg + 1]
      ? path.resolve(argv[logArg + 1]!)
      : path.join(cwd, ".ada", "session-log.jsonl");

  const pollArg = argv.indexOf("--poll");
  const pollMs =
    pollArg !== -1 && argv[pollArg + 1]
      ? parseInt(argv[pollArg + 1]!, 10)
      : 5_000;

  const batchArg = argv.indexOf("--batch");
  const batchSize =
    batchArg !== -1 && argv[batchArg + 1]
      ? parseInt(argv[batchArg + 1]!, 10)
      : 8;

  const statePath = path.join(cwd, ".ada", "state.json");
  if (!fs.existsSync(statePath)) {
    process.stderr.write(
      "ada govern: no compiled blueprint found — run 'ada compile <intent>' first.\n",
    );
    process.exit(1);
  }

  let blueprint: ReturnType<typeof loadBlueprintState>["blueprint"];
  try {
    ({ blueprint } = loadBlueprintState(statePath));
  } catch (err) {
    process.stderr.write(
      `ada govern: failed to load blueprint — ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  }

  const driftAlertsPath = path.join(cwd, ".ada", "drift-alerts.jsonl");

  const ac = new AbortController();
  process.on("SIGINT", () => ac.abort());
  process.on("SIGTERM", () => ac.abort());

  process.stderr.write(
    `  ◈ ada governor watching ${logPath}\n` +
      `  · poll: ${pollMs}ms  batch: ${batchSize} entries\n` +
      `  · blueprint: ${blueprint.summary.slice(0, 80)}...\n\n`,
  );

  let driftCount = 0;

  for await (const signal of watchSessionLog(logPath, blueprint, {
    batchSize,
    pollMs,
    signal: ac.signal,
  })) {
    const ts = new Date().toISOString().slice(11, 19);

    switch (signal.type) {
      case "DRIFT": {
        driftCount++;
        const icon =
          signal.severity === "critical"
            ? "✗"
            : signal.severity === "major"
              ? "!"
              : "~";
        process.stderr.write(
          `  [${ts}] ${icon} drift [${signal.severity}] ${signal.location}\n` +
            `           ${signal.detail}\n`,
        );
        // Persist to drift-alerts.jsonl
        appendJsonl(driftAlertsPath, {
          ts: Date.now(),
          type: "DRIFT",
          severity: signal.severity,
          location: signal.location,
          detail: signal.detail,
        });
        // Machine-readable signal to stdout
        process.stdout.write(
          JSON.stringify({ ...signal, ts: Date.now() }) + "\n",
        );
        break;
      }

      case "LOW_CONFIDENCE":
        process.stderr.write(
          `  [${ts}] ⚠ confidence ${Math.round(signal.confidence * 100)}% — ${signal.reason}\n`,
        );
        // Persist to drift-alerts.jsonl
        appendJsonl(driftAlertsPath, {
          ts: Date.now(),
          type: "LOW_CONFIDENCE",
          confidence: signal.confidence,
          reason: signal.reason,
        });
        process.stdout.write(
          JSON.stringify({ ...signal, ts: Date.now() }) + "\n",
        );
        break;

      case "CONFIDENCE":
        // Quiet — only emit when notably low
        if (signal.value < 0.8) {
          process.stderr.write(
            `  [${ts}] · confidence ${Math.round(signal.value * 100)}%\n`,
          );
        }
        break;

      case "CHECKPOINT":
      case "POSTCONDITION_FAIL":
      case "CAPABILITY_GAP":
      case "SESSION_COMPLETE":
        process.stdout.write(
          JSON.stringify({ ...signal, ts: Date.now() }) + "\n",
        );
        break;
    }
  }

  process.stderr.write(
    `\n  ◈ governor stopped — ${driftCount} drift signal${driftCount === 1 ? "" : "s"} total\n`,
  );
}
