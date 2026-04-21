import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { spawn as cpSpawn } from "child_process";
import { glyphs, formatElapsed, sparkline } from "../ui/design-system.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_SELF_INTENT =
  "Ada is a semantic compiler that translates natural language intent through " +
  "a 9-stage pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) into governed " +
  "Claude Code execution artifacts: CLAUDE.md, agent definitions, pre-tool hooks, " +
  "MCP server, and world model. Ada self-governs via a semantic gate that blocks " +
  "tool calls violating compiled invariants, a continuous governor watching for " +
  "semantic drift, and a projection engine regenerating governance artifacts. " +
  "The governance core is immutable; only workflows and skills are self-improvable.";

const DEFAULT_MAX_ITERATIONS = 10;
const DEFAULT_ITER_TIMEOUT_MS = 1_800_000; // 30 minutes (Opus needs it)
const DEFAULT_TOTAL_TIMEOUT_MS = 7_200_000; // 2 hours
const DEFAULT_CONFIDENCE_TARGET = 0.9;
const DEFAULT_STABLE_ITERS = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelfLoopOptions {
  readonly projectRoot: string;
  readonly maxIterations: number;
  readonly iterationTimeoutMs: number;
  readonly totalTimeoutMs: number;
  readonly confidenceTarget: number;
  readonly stableIterations: number;
  readonly verbose: boolean;
  readonly dryRun: boolean;
}

interface ViolationSummary {
  readonly severity: string;
  readonly ruleViolated: string;
  readonly description: string;
}

interface IterationResult {
  readonly iterN: number;
  readonly iterDir: string;
  readonly decision: "ACCEPT" | "REJECT" | "ITERATE" | "ERROR";
  readonly confidence: number;
  readonly openQuestions: readonly string[];
  readonly violations: readonly ViolationSummary[];
  readonly nextAction: string | null;
  readonly durationMs: number;
  readonly timedOut: boolean;
  readonly error: string | null;
}

interface IterationLogEntry {
  readonly ts: number;
  readonly loopId: string;
  readonly iterN: number;
  readonly iterDir: string;
  readonly decision: string;
  readonly confidence: number;
  readonly openQuestionCount: number;
  readonly violationCount: number;
  readonly openQuestionsFingerprint: string;
  readonly durationMs: number;
  readonly timedOut: boolean;
  readonly error: string | null;
  readonly convergenceStatus:
    | "running"
    | "converged"
    | "stable"
    | "max_iterations"
    | "total_timeout";
}

interface StateSnapshot {
  readonly openQuestions: readonly string[];
  readonly decision: string;
  readonly confidence: number;
  readonly violations: readonly ViolationSummary[];
  readonly nextAction: string | null;
}

interface HeadlessOutput {
  readonly runId: string;
  readonly decision: "ACCEPT" | "REJECT" | "ITERATE";
  readonly confidence: number;
  readonly summary: string;
  readonly violations: readonly ViolationSummary[];
}

interface ConvergenceResult {
  readonly converged: boolean;
  readonly shouldStop: boolean;
  readonly reason: string;
  readonly status: IterationLogEntry["convergenceStatus"];
}

// ─── Arg parser ───────────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]): SelfLoopOptions {
  let maxIterations = DEFAULT_MAX_ITERATIONS;
  let iterationTimeoutMs = DEFAULT_ITER_TIMEOUT_MS;
  let totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS;
  let confidenceTarget = DEFAULT_CONFIDENCE_TARGET;
  let stableIterations = DEFAULT_STABLE_ITERS;
  let verbose = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    switch (a) {
      case "--max-iter": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v > 0) {
          maxIterations = v;
          i++;
        }
        break;
      }
      case "--iter-timeout": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v > 0) {
          iterationTimeoutMs = v;
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
      case "--confidence-target": {
        const v = parseFloat(argv[i + 1] ?? "");
        if (!isNaN(v) && v > 0 && v <= 1) {
          confidenceTarget = v;
          i++;
        }
        break;
      }
      case "--stable-iters": {
        const v = parseInt(argv[i + 1] ?? "", 10);
        if (!isNaN(v) && v >= 1) {
          stableIterations = v;
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
    maxIterations,
    iterationTimeoutMs,
    totalTimeoutMs,
    confidenceTarget,
    stableIterations,
    verbose,
    dryRun,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openQuestionsFingerprint(qs: readonly string[]): string {
  return createHash("sha256")
    .update([...qs].sort().join("\n"))
    .digest("hex")
    .slice(0, 16);
}

function buildEnrichedIntent(
  openQuestions: readonly string[],
  violations: readonly ViolationSummary[],
  nextAction: string | null,
): string {
  const parts: string[] = [BASE_SELF_INTENT, ""];

  if (openQuestions.length > 0) {
    parts.push("Resolve these open questions:");
    openQuestions.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    parts.push("");
  }

  if (violations.length > 0) {
    parts.push("Address these policy violations:");
    violations.forEach((v) =>
      parts.push(`- [${v.severity}] ${v.ruleViolated}: ${v.description}`),
    );
    parts.push("");
  }

  if (nextAction) {
    parts.push(`Governor next action: ${nextAction.slice(0, 500)}`);
  }

  return parts.join("\n").trim();
}

function readStateJson(iterDir: string): StateSnapshot | null {
  const statePath = path.join(iterDir, ".ada", "state.json");
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf8")) as {
      blueprint?: { openQuestions?: string[] };
      governorDecision?: {
        decision?: string;
        confidence?: number;
        violations?: ViolationSummary[];
        nextAction?: string | null;
      };
    };
    return {
      openQuestions: raw.blueprint?.openQuestions ?? [],
      decision: raw.governorDecision?.decision ?? "ERROR",
      confidence: raw.governorDecision?.confidence ?? 0,
      violations: raw.governorDecision?.violations ?? [],
      nextAction: raw.governorDecision?.nextAction ?? null,
    };
  } catch {
    return null;
  }
}

function appendLogEntry(logPath: string, entry: IterationLogEntry): void {
  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
}

function checkConvergence(
  iterations: readonly IterationResult[],
  opts: SelfLoopOptions,
  elapsedMs: number,
): ConvergenceResult {
  if (elapsedMs >= opts.totalTimeoutMs) {
    return {
      converged: false,
      shouldStop: true,
      reason: "total timeout exceeded",
      status: "total_timeout",
    };
  }
  if (iterations.length >= opts.maxIterations) {
    return {
      converged: false,
      shouldStop: true,
      reason: `max iterations (${opts.maxIterations}) reached`,
      status: "max_iterations",
    };
  }

  const last = iterations[iterations.length - 1];
  if (!last)
    return {
      converged: false,
      shouldStop: false,
      reason: "no iterations yet",
      status: "running",
    };

  // Primary: ACCEPT at target confidence
  if (last.decision === "ACCEPT" && last.confidence >= opts.confidenceTarget) {
    return {
      converged: true,
      shouldStop: true,
      reason: `ACCEPT at ${(last.confidence * 100).toFixed(0)}% ≥ ${(opts.confidenceTarget * 100).toFixed(0)}% target`,
      status: "converged",
    };
  }

  // Secondary: open question stability
  if (iterations.length >= opts.stableIterations) {
    const tail = iterations.slice(-opts.stableIterations);
    const fingerprints = tail.map((it) =>
      openQuestionsFingerprint(it.openQuestions),
    );
    if (fingerprints.every((fp) => fp === fingerprints[0])) {
      return {
        converged: false,
        shouldStop: true,
        reason: `open questions unchanged for ${opts.stableIterations} consecutive iterations — local fixpoint`,
        status: "stable",
      };
    }
  }

  return {
    converged: false,
    shouldStop: false,
    reason: "continuing",
    status: "running",
  };
}

// ─── Subprocess runner ────────────────────────────────────────────────────────

async function runHeadlessIteration(
  intent: string,
  iterDir: string,
  opts: SelfLoopOptions,
  onStderr: (line: string) => void,
): Promise<Omit<IterationResult, "iterN">> {
  fs.mkdirSync(iterDir, { recursive: true });

  const iterStart = Date.now();
  const cliPath = process.argv[1] ?? "";
  const nodeBin = process.execPath;

  return new Promise((resolve) => {
    let stdoutBuf = "";
    let timedOut = false;

    const child = cpSpawn(
      nodeBin,
      [cliPath, "compile-headless", intent, iterDir],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      },
    );

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, opts.iterationTimeoutMs);

    child.stdout!.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
    });

    child.stderr!.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim()) onStderr(line);
      }
    });

    child.on("close", () => {
      clearTimeout(timer);
      const durationMs = Date.now() - iterStart;

      let parsed: HeadlessOutput | null = null;
      try {
        parsed = JSON.parse(stdoutBuf.trim()) as HeadlessOutput;
      } catch {
        // headless may have crashed before writing JSON
      }

      const snap = readStateJson(iterDir);

      const decision = (
        timedOut ? "ERROR" : (parsed?.decision ?? snap?.decision ?? "ERROR")
      ) as IterationResult["decision"];
      const confidence = parsed?.confidence ?? snap?.confidence ?? 0;
      const openQuestions: readonly string[] = snap?.openQuestions ?? [];
      const violations: readonly ViolationSummary[] =
        parsed?.violations ?? snap?.violations ?? [];
      const nextAction = snap?.nextAction ?? null;

      resolve({
        iterDir,
        decision,
        confidence,
        openQuestions,
        violations,
        nextAction,
        durationMs,
        timedOut,
        error: timedOut ? `timed out after ${opts.iterationTimeoutMs}ms` : null,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        iterDir,
        decision: "ERROR",
        confidence: 0,
        openQuestions: [],
        violations: [],
        nextAction: null,
        durationMs: Date.now() - iterStart,
        timedOut: false,
        error: err.message,
      });
    });
  });
}

// ─── Display ──────────────────────────────────────────────────────────────────

function printLoopHeader(
  opts: SelfLoopOptions,
  loopId: string,
  loopDir: string,
): void {
  process.stderr.write(
    `\n  ${glyphs.identity.core} ada self-loop  loopId=${loopId}\n`,
  );
  process.stderr.write(`  ${glyphs.pipeline.separator} output: ${loopDir}\n`);
  process.stderr.write(
    `  ${glyphs.pipeline.separator} max iterations: ${opts.maxIterations}  timeout/iter: ${opts.iterationTimeoutMs / 1000}s  total: ${opts.totalTimeoutMs / 1000}s\n`,
  );
  process.stderr.write(
    `  ${glyphs.pipeline.separator} confidence target: ${(opts.confidenceTarget * 100).toFixed(0)}%  stable-iters: ${opts.stableIterations}\n\n`,
  );
}

function printIterationHeader(n: number, max: number, elapsedMs: number): void {
  process.stderr.write(
    `  ${glyphs.pipeline.cycle} iter ${n}/${max}  elapsed: ${formatElapsed(elapsedMs)}\n`,
  );
}

function printIterationResult(
  result: IterationResult,
  allIterations: readonly IterationResult[],
): void {
  const icon =
    result.decision === "ACCEPT"
      ? glyphs.status.pass
      : result.decision === "ERROR"
        ? glyphs.status.fail
        : glyphs.pipeline.cycle;

  // Decision + metrics line
  const trend =
    allIterations.length > 1
      ? `  ${sparkline.render(allIterations.map((it) => it.confidence))}`
      : "";
  process.stderr.write(
    `  ${icon} ${result.decision}  confidence: ${(result.confidence * 100).toFixed(0)}%` +
      `  open-q: ${result.openQuestions.length}  violations: ${result.violations.length}` +
      `  ${formatElapsed(result.durationMs)}${trend}\n`,
  );

  if (result.error) {
    process.stderr.write(`  ${glyphs.status.fail} error: ${result.error}\n`);
  }

  // Glass-box: what Ada is uncertain about
  if (result.openQuestions.length > 0) {
    process.stderr.write(
      `\n  ${glyphs.identity.open} Ada is asking herself:\n`,
    );
    result.openQuestions.slice(0, 6).forEach((q, i) => {
      const short = q.length > 110 ? q.slice(0, 107) + "…" : q;
      process.stderr.write(`    ${i + 1}. ${short}\n`);
    });
    if (result.openQuestions.length > 6) {
      process.stderr.write(
        `    ${glyphs.pipeline.ellipsis} +${result.openQuestions.length - 6} more\n`,
      );
    }
  }

  // Glass-box: top violations blocking ACCEPT
  if (result.violations.length > 0 && result.decision !== "ACCEPT") {
    process.stderr.write(`\n  ${glyphs.status.alert} blocking violations:\n`);
    result.violations.slice(0, 3).forEach((v) => {
      const desc =
        v.description.length > 90
          ? v.description.slice(0, 87) + "…"
          : v.description;
      process.stderr.write(`    [${v.severity}] ${v.ruleViolated}: ${desc}\n`);
    });
    if (result.violations.length > 3) {
      process.stderr.write(
        `    ${glyphs.pipeline.ellipsis} +${result.violations.length - 3} more\n`,
      );
    }
  }
  process.stderr.write("\n");
}

function printConvergenceReport(
  iterations: readonly IterationResult[],
  loopId: string,
  logPath: string,
  startedAt: number,
  result: ConvergenceResult,
): void {
  const totalElapsed = Date.now() - startedAt;
  const last = iterations[iterations.length - 1];
  const bar = "─".repeat(58);

  process.stderr.write(`\n  ${bar}\n`);
  process.stderr.write(`  ${glyphs.identity.core} self-loop complete\n\n`);
  process.stderr.write(`  loopId:       ${loopId}\n`);
  process.stderr.write(`  iterations:   ${iterations.length}\n`);
  process.stderr.write(`  total time:   ${formatElapsed(totalElapsed)}\n`);
  process.stderr.write(`  log:          ${logPath}\n\n`);

  if (last) {
    process.stderr.write(`  final decision:    ${last.decision}\n`);
    process.stderr.write(
      `  final confidence:  ${(last.confidence * 100).toFixed(0)}%\n`,
    );
    process.stderr.write(`  open questions:    ${last.openQuestions.length}\n`);
    process.stderr.write(`  violations:        ${last.violations.length}\n\n`);
  }

  // Confidence sparkline
  if (iterations.length > 1) {
    const bars = sparkline.render(iterations.map((it) => it.confidence));
    process.stderr.write(`  confidence trend: ${bars}\n\n`);
  }

  const icon = result.converged ? glyphs.status.pass : glyphs.status.alert;
  process.stderr.write(`  ${icon} ${result.reason}\n`);

  if (last && last.openQuestions.length > 0) {
    process.stderr.write(
      `\n  ${glyphs.identity.open} unresolved open questions:\n`,
    );
    last.openQuestions.slice(0, 5).forEach((q, i) => {
      process.stderr.write(`    ${i + 1}. ${q.slice(0, 120)}\n`);
    });
    if (last.openQuestions.length > 5) {
      process.stderr.write(
        `    ${glyphs.pipeline.ellipsis} and ${last.openQuestions.length - 5} more (see loop.jsonl)\n`,
      );
    }
  }

  process.stderr.write(`\n`);
}

// ─── Main command ─────────────────────────────────────────────────────────────

export async function selfLoopCommand(argv: readonly string[]): Promise<void> {
  const opts = parseArgs(argv);

  if (!process.env["ANTHROPIC_API_KEY"]) {
    process.stderr.write(`  ${glyphs.status.fail} ANTHROPIC_API_KEY not set\n`);
    process.exit(1);
  }

  const loopTimestamp = Date.now();
  const loopId = `loop-${loopTimestamp}`;
  const loopDir = path.join(opts.projectRoot, ".ada", "self", loopId);
  const logPath = path.join(loopDir, "loop.jsonl");

  if (opts.dryRun) {
    process.stderr.write(
      `  ${glyphs.identity.core} dry-run — base intent:\n\n`,
    );
    process.stderr.write(`${BASE_SELF_INTENT}\n\n`);
    process.stderr.write(`  loopDir would be: ${loopDir}\n\n`);
    return;
  }

  fs.mkdirSync(loopDir, { recursive: true });
  printLoopHeader(opts, loopId, loopDir);

  const iterations: IterationResult[] = [];
  const startedAt = loopTimestamp;
  let currentIntent = BASE_SELF_INTENT;

  while (true) {
    const n = iterations.length + 1;
    const iterDir = path.join(loopDir, `iter-${n}`);
    const loopElapsed = Date.now() - startedAt;

    // Pre-check caps
    const preCheck = checkConvergence(iterations, opts, loopElapsed);
    if (preCheck.shouldStop) {
      printConvergenceReport(iterations, loopId, logPath, startedAt, preCheck);
      process.exit(preCheck.converged ? 0 : 1);
      return;
    }

    printIterationHeader(n, opts.maxIterations, loopElapsed);

    const iterStart = Date.now();
    const heartbeat = setInterval(() => {
      process.stderr.write(
        `  ${glyphs.pipeline.ellipsis} still running  ${formatElapsed(Date.now() - iterStart)}\n`,
      );
    }, 60_000);

    const partial = await runHeadlessIteration(
      currentIntent,
      iterDir,
      opts,
      (line) => {
        if (opts.verbose) {
          process.stderr.write(`    ${line}\n`);
        } else if (
          / ✓ /.test(line) ||
          /GOV:/.test(line) ||
          /\[ada\]/.test(line)
        ) {
          process.stderr.write(`    ${line}\n`);
        }
      },
    );

    clearInterval(heartbeat);

    const result: IterationResult = { ...partial, iterN: n };
    iterations.push(result);
    printIterationResult(result, iterations);

    const convergence = checkConvergence(
      iterations,
      opts,
      Date.now() - startedAt,
    );

    appendLogEntry(logPath, {
      ts: Date.now(),
      loopId,
      iterN: n,
      iterDir,
      decision: result.decision,
      confidence: result.confidence,
      openQuestionCount: result.openQuestions.length,
      violationCount: result.violations.length,
      openQuestionsFingerprint: openQuestionsFingerprint(result.openQuestions),
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      error: result.error,
      convergenceStatus: convergence.status,
    });

    if (convergence.shouldStop) {
      printConvergenceReport(
        iterations,
        loopId,
        logPath,
        startedAt,
        convergence,
      );
      process.exit(convergence.converged ? 0 : 1);
      return;
    }

    // Enrich intent for next iteration
    currentIntent = buildEnrichedIntent(
      result.openQuestions,
      result.violations,
      result.nextAction,
    );

    process.stderr.write(
      `  ${glyphs.pipeline.therefore} feeding iter ${n + 1}:` +
        ` ${result.openQuestions.length} questions + ${result.violations.length} violations\n`,
    );
    if (result.nextAction) {
      const na =
        result.nextAction.length > 100
          ? result.nextAction.slice(0, 97) + "…"
          : result.nextAction;
      process.stderr.write(`    governor says: ${na}\n`);
    }
    process.stderr.write("\n");
  }
}
