import * as fs from "fs";
import * as path from "path";
import { spawn as cpSpawn } from "child_process";
import { spawn } from "@ada/orchestrator";
import { watch } from "@ada/governor";
import { loadBlueprintState, type Blueprint } from "@ada/compiler";
import { glyphs, formatElapsed, sparkline } from "../ui/design-system.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SESSIONS = 5;
const DEFAULT_SESSION_TIMEOUT_MS = 3_600_000; // 1hr per session
const DEFAULT_TOTAL_TIMEOUT_MS = 28_800_000; // 8hr total
const DEFAULT_CONFIDENCE_TARGET = 0.85;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvergeOptions {
  readonly projectRoot: string;
  readonly maxSessions: number;
  readonly sessionTimeoutMs: number;
  readonly totalTimeoutMs: number;
  readonly confidenceTarget: number;
  readonly verbose: boolean;
  readonly dryRun: boolean;
}

interface DriftSignal {
  readonly severity: "critical" | "major" | "minor";
  readonly location: string;
  readonly detail: string;
}

interface SessionResult {
  readonly sessionN: number;
  readonly decision: "ACCEPT" | "DRIFT" | "HALT" | "TIMEOUT" | "ERROR";
  readonly finalConfidence: number;
  readonly drifts: readonly DriftSignal[];
  readonly durationMs: number;
  readonly timedOut: boolean;
  readonly error: string | null;
}

interface ConvergeLogEntry {
  readonly ts: number;
  readonly loopId: string;
  readonly sessionN: number;
  readonly decision: string;
  readonly finalConfidence: number;
  readonly driftCount: number;
  readonly criticalDriftCount: number;
  readonly durationMs: number;
  readonly timedOut: boolean;
  readonly convergenceStatus:
    | "running"
    | "converged"
    | "max_sessions"
    | "total_timeout"
    | "halt";
}

interface ConvergenceCheck {
  readonly converged: boolean;
  readonly shouldStop: boolean;
  readonly reason: string;
  readonly status: ConvergeLogEntry["convergenceStatus"];
}

// ─── Arg parser ───────────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]): ConvergeOptions {
  let maxSessions = DEFAULT_MAX_SESSIONS;
  let sessionTimeoutMs = DEFAULT_SESSION_TIMEOUT_MS;
  let totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS;
  let confidenceTarget = DEFAULT_CONFIDENCE_TARGET;
  let verbose = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    switch (a) {
      case "--max-sessions": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v > 0) {
          maxSessions = v;
          i++;
        }
        break;
      }
      case "--session-timeout": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v > 0) {
          sessionTimeoutMs = v;
          i++;
        }
        break;
      }
      case "--total-timeout": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v > 0) {
          totalTimeoutMs = v;
          i++;
        }
        break;
      }
      case "--confidence": {
        const v = parseFloat(argv[i + 1] ?? "");
        if (!isNaN(v) && v > 0 && v <= 1) {
          confidenceTarget = v;
          i++;
        }
        break;
      }
      case "--verbose":
        verbose = true;
        break;
      case "--dry-run":
        dryRun = true;
        break;
    }
  }

  return {
    projectRoot: process.cwd(),
    maxSessions,
    sessionTimeoutMs,
    totalTimeoutMs,
    confidenceTarget,
    verbose,
    dryRun,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function appendLog(logPath: string, entry: ConvergeLogEntry): void {
  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
}

function buildEnrichedIntent(
  blueprint: Blueprint,
  drifts: readonly DriftSignal[],
): string {
  const parts: string[] = [blueprint.summary, ""];

  if (blueprint.openQuestions.length > 0) {
    parts.push("Unresolved design questions from the last compilation:");
    blueprint.openQuestions.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    parts.push("");
  }

  const critical = drifts.filter((d) => d.severity === "critical");
  const major = drifts.filter((d) => d.severity === "major");
  const notable = [...critical, ...major].slice(0, 8);

  if (notable.length > 0) {
    parts.push("Semantic drift detected in the last execution session:");
    notable.forEach((d) =>
      parts.push(`- [${d.severity}] ${d.location}: ${d.detail}`),
    );
    parts.push("");
  }

  return parts.join("\n").trim();
}

function loadBlueprint(statePath: string): Blueprint | null {
  try {
    const { blueprint } = loadBlueprintState(statePath);
    return blueprint;
  } catch {
    return null;
  }
}

function checkConvergence(
  sessions: readonly SessionResult[],
  opts: ConvergeOptions,
  elapsedMs: number,
): ConvergenceCheck {
  if (elapsedMs >= opts.totalTimeoutMs) {
    return {
      converged: false,
      shouldStop: true,
      reason: "total timeout exceeded",
      status: "total_timeout",
    };
  }
  if (sessions.length >= opts.maxSessions) {
    return {
      converged: false,
      shouldStop: true,
      reason: `max sessions (${opts.maxSessions}) reached`,
      status: "max_sessions",
    };
  }

  const last = sessions[sessions.length - 1];
  if (!last)
    return {
      converged: false,
      shouldStop: false,
      reason: "no sessions yet",
      status: "running",
    };

  if (last.decision === "HALT") {
    return {
      converged: false,
      shouldStop: true,
      reason: "governor issued HALT",
      status: "halt",
    };
  }

  const criticalDrifts = last.drifts.filter(
    (d) => d.severity === "critical",
  ).length;

  if (
    last.decision === "ACCEPT" &&
    last.finalConfidence >= opts.confidenceTarget &&
    criticalDrifts === 0
  ) {
    return {
      converged: true,
      shouldStop: true,
      reason: `converged — ACCEPT at ${(last.finalConfidence * 100).toFixed(0)}% confidence, zero critical drift`,
      status: "converged",
    };
  }

  return {
    converged: false,
    shouldStop: false,
    reason: "continuing",
    status: "running",
  };
}

// ─── Session runner ───────────────────────────────────────────────────────────

async function runSession(
  blueprint: Blueprint,
  sessionN: number,
  opts: ConvergeOptions,
): Promise<SessionResult> {
  const sessionStart = Date.now();
  let timedOut = false;
  let error: string | null = null;
  let finalConfidence = 0;
  let decision: SessionResult["decision"] = "ERROR";
  const drifts: DriftSignal[] = [];

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
  }, opts.sessionTimeoutMs);

  try {
    const events = spawn({
      workingDir: opts.projectRoot,
      blueprintSummary: blueprint.summary,
    });

    for await (const signal of watch(blueprint, events)) {
      if (timedOut) break;

      switch (signal.type) {
        case "DRIFT":
          drifts.push({
            severity: signal.severity,
            location: signal.location,
            detail: signal.detail,
          });
          if (opts.verbose || signal.severity === "critical") {
            const icon =
              signal.severity === "critical"
                ? glyphs.status.fail
                : signal.severity === "major"
                  ? glyphs.status.alert
                  : "~";
            process.stderr.write(
              `    ${icon} drift [${signal.severity}] ${signal.location}\n` +
                `       ${signal.detail}\n`,
            );
          }
          break;

        case "SESSION_COMPLETE":
          finalConfidence = signal.finalConfidence;
          decision = signal.decision;
          break;

        case "LOW_CONFIDENCE":
          process.stderr.write(
            `    ${glyphs.status.alert} confidence ${Math.round(signal.confidence * 100)}% — ${signal.reason}\n`,
          );
          break;

        case "CONFIDENCE":
          if (opts.verbose && signal.value < 0.7) {
            process.stderr.write(
              `    · confidence ${Math.round(signal.value * 100)}%\n`,
            );
          }
          break;

        case "CHECKPOINT":
          if (opts.verbose) {
            process.stderr.write(`    ${glyphs.status.pass} checkpoint\n`);
          }
          break;
      }
    }

    if (timedOut) decision = "TIMEOUT";
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    decision = "ERROR";
  }

  clearTimeout(timeoutHandle);
  void sessionN;

  return {
    sessionN,
    decision,
    finalConfidence,
    drifts,
    durationMs: Date.now() - sessionStart,
    timedOut,
    error,
  };
}

// ─── Recompile subprocess ─────────────────────────────────────────────────────

async function recompile(
  intent: string,
  iterDir: string,
  opts: ConvergeOptions,
  priorStatePath?: string,
): Promise<Blueprint | null> {
  fs.mkdirSync(iterDir, { recursive: true });

  const cliPath = process.argv[1] ?? "";
  const nodeBin = process.execPath;

  const spawnArgs = [cliPath, "compile-headless", intent, iterDir];
  if (priorStatePath && fs.existsSync(priorStatePath)) {
    spawnArgs.push("--prior-state", priorStatePath);
  }

  return new Promise((resolve) => {
    let stdoutBuf = "";
    const child = cpSpawn(nodeBin, spawnArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve(null);
    }, opts.sessionTimeoutMs);

    child.stdout!.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
    });

    child.stderr!.on("data", (chunk: Buffer) => {
      if (opts.verbose) {
        for (const line of chunk.toString().split("\n")) {
          if (line.trim()) process.stderr.write(`    ${line}\n`);
        }
      } else {
        for (const line of chunk.toString().split("\n")) {
          if (/ ✓ /.test(line) || /GOV:/.test(line) || /\[ada\]/.test(line)) {
            process.stderr.write(`    ${line}\n`);
          }
        }
      }
    });

    child.on("close", () => {
      clearTimeout(timer);
      void stdoutBuf;
      const newBlueprint = loadBlueprint(
        path.join(iterDir, ".ada", "state.json"),
      );
      resolve(newBlueprint);
    });

    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

// ─── Display ──────────────────────────────────────────────────────────────────

function printHeader(
  opts: ConvergeOptions,
  loopId: string,
  blueprint: Blueprint,
): void {
  process.stderr.write(
    `\n  ${glyphs.identity.core} ada converge  loopId=${loopId}\n`,
  );
  process.stderr.write(
    `  ${glyphs.pipeline.separator} project: ${opts.projectRoot}\n`,
  );
  process.stderr.write(
    `  ${glyphs.pipeline.separator} max sessions: ${opts.maxSessions}  ` +
      `session timeout: ${opts.sessionTimeoutMs / 1000}s  ` +
      `total: ${opts.totalTimeoutMs / 3_600_000}hr\n`,
  );
  process.stderr.write(
    `  ${glyphs.pipeline.separator} target: ${(opts.confidenceTarget * 100).toFixed(0)}% confidence + zero critical drift\n`,
  );
  process.stderr.write(
    `  ${glyphs.pipeline.separator} blueprint: ${blueprint.summary.slice(0, 80)}…\n\n`,
  );
}

function printSessionHeader(n: number, max: number, elapsedMs: number): void {
  process.stderr.write(
    `  ${glyphs.pipeline.cycle} session ${n}/${max}  elapsed: ${formatElapsed(elapsedMs)}\n`,
  );
}

function printSessionResult(
  result: SessionResult,
  all: readonly SessionResult[],
): void {
  const icon =
    result.decision === "ACCEPT"
      ? glyphs.status.pass
      : result.decision === "ERROR" || result.decision === "HALT"
        ? glyphs.status.fail
        : glyphs.pipeline.cycle;

  const trend =
    all.length > 1
      ? `  ${sparkline.render(all.map((s) => s.finalConfidence))}`
      : "";

  process.stderr.write(
    `  ${icon} ${result.decision}  ` +
      `confidence: ${(result.finalConfidence * 100).toFixed(0)}%  ` +
      `drift: ${result.drifts.length} (${result.drifts.filter((d) => d.severity === "critical").length} critical)  ` +
      `${formatElapsed(result.durationMs)}${trend}\n`,
  );

  if (result.error) {
    process.stderr.write(`  ${glyphs.status.fail} error: ${result.error}\n`);
  }
  process.stderr.write("\n");
}

function printConvergenceReport(
  sessions: readonly SessionResult[],
  loopId: string,
  logPath: string,
  startedAt: number,
  result: ConvergenceCheck,
): void {
  const totalElapsed = Date.now() - startedAt;
  const last = sessions[sessions.length - 1];
  const bar = "─".repeat(58);

  process.stderr.write(`\n  ${bar}\n`);
  process.stderr.write(`  ${glyphs.identity.core} converge complete\n\n`);
  process.stderr.write(`  loopId:          ${loopId}\n`);
  process.stderr.write(`  sessions:        ${sessions.length}\n`);
  process.stderr.write(`  total time:      ${formatElapsed(totalElapsed)}\n`);
  process.stderr.write(`  log:             ${logPath}\n\n`);

  if (last) {
    process.stderr.write(`  final decision:  ${last.decision}\n`);
    process.stderr.write(
      `  confidence:      ${(last.finalConfidence * 100).toFixed(0)}%\n`,
    );
    process.stderr.write(`  drift signals:   ${last.drifts.length}\n\n`);
  }

  if (sessions.length > 1) {
    const bars = sparkline.render(sessions.map((s) => s.finalConfidence));
    process.stderr.write(`  confidence arc: ${bars}\n\n`);
  }

  const icon = result.converged ? glyphs.status.pass : glyphs.status.alert;
  process.stderr.write(`  ${icon} ${result.reason}\n\n`);
}

// ─── Main command ─────────────────────────────────────────────────────────────

export async function convergeCommand(argv: readonly string[]): Promise<void> {
  const opts = parseArgs(argv);
  const statePath = path.join(opts.projectRoot, ".ada", "state.json");

  const initialBlueprint = loadBlueprint(statePath);
  if (!initialBlueprint) {
    process.stderr.write(
      `  ${glyphs.status.fail} ada converge: no compiled blueprint found.\n` +
        `  Run 'ada compile "<intent>"' first.\n`,
    );
    process.exit(1);
  }

  const loopId = `loop-${Date.now()}`;
  const loopDir = path.join(opts.projectRoot, ".ada", "converge", loopId);
  const logPath = path.join(loopDir, "converge.jsonl");

  if (opts.dryRun) {
    process.stderr.write(
      `  ${glyphs.identity.core} dry-run — blueprint loaded:\n\n`,
    );
    process.stderr.write(`  ${initialBlueprint.summary.slice(0, 120)}\n\n`);
    process.stderr.write(
      `  ${initialBlueprint.openQuestions.length} open questions\n`,
    );
    process.stderr.write(`  loopDir would be: ${loopDir}\n\n`);
    return;
  }

  fs.mkdirSync(loopDir, { recursive: true });
  printHeader(opts, loopId, initialBlueprint);

  const sessions: SessionResult[] = [];
  const startedAt = Date.now();
  let blueprint = initialBlueprint;
  // Track rolling prior state path — each recompile carries forward the last blueprint
  let currentStatePath = statePath;

  const ac = new AbortController();
  process.on("SIGINT", () => {
    ac.abort();
  });
  process.on("SIGTERM", () => {
    ac.abort();
  });

  while (!ac.signal.aborted) {
    const n = sessions.length + 1;
    const elapsedMs = Date.now() - startedAt;

    const preCheck = checkConvergence(sessions, opts, elapsedMs);
    if (preCheck.shouldStop) {
      printConvergenceReport(sessions, loopId, logPath, startedAt, preCheck);
      process.exit(preCheck.converged ? 0 : 1);
      return;
    }

    printSessionHeader(n, opts.maxSessions, elapsedMs);

    const result = await runSession(blueprint, n, opts);
    sessions.push(result);
    printSessionResult(result, sessions);

    const check = checkConvergence(sessions, opts, Date.now() - startedAt);

    appendLog(logPath, {
      ts: Date.now(),
      loopId,
      sessionN: n,
      decision: result.decision,
      finalConfidence: result.finalConfidence,
      driftCount: result.drifts.length,
      criticalDriftCount: result.drifts.filter((d) => d.severity === "critical")
        .length,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      convergenceStatus: check.status,
    });

    if (check.shouldStop) {
      printConvergenceReport(sessions, loopId, logPath, startedAt, check);
      process.exit(check.converged ? 0 : 1);
      return;
    }

    // Recompile with enriched intent — open questions + drift signals
    const enrichedIntent = buildEnrichedIntent(blueprint, result.drifts);
    const iterDir = path.join(loopDir, `session-${n + 1}`);

    process.stderr.write(
      `  ${glyphs.pipeline.therefore} recompiling — ` +
        `${blueprint.openQuestions.length} open questions + ` +
        `${result.drifts.length} drift signals\n\n`,
    );

    const newBlueprint = await recompile(
      enrichedIntent,
      iterDir,
      opts,
      currentStatePath,
    );
    if (newBlueprint) {
      blueprint = newBlueprint;
      currentStatePath = path.join(iterDir, ".ada", "state.json");
    } else {
      process.stderr.write(
        `  ${glyphs.status.alert} recompile failed — continuing with prior blueprint\n\n`,
      );
    }
  }

  // Aborted via signal
  process.stderr.write(
    `\n  ${glyphs.pipeline.separator} converge interrupted\n`,
  );
  process.exit(1);
}
