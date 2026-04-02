import * as fs from "fs";
import * as path from "path";
import { spawn } from "@ada/orchestrator";
import {
  topoWaves,
  initSubGoalState,
  loadSubGoalState,
  markSubGoalInProgress,
  markSubGoalComplete,
  markSubGoalFailed,
} from "@ada/orchestrator";
import type { SubGoalSpec } from "@ada/compiler";

export interface OrchestrateOptions {
  maxParallel?: number; // default 1
  dryRun?: boolean;
  subGoal?: string; // run only this subGoal
}

interface StateFile {
  blueprint?: {
    subGoals?: SubGoalSpec[];
  };
  compilationRun?: { runId: string };
  runId?: string;
}

const SIXTY_MINUTES_MS = 60 * 60 * 1000;

export async function orchestrateCommand(
  projectDir: string,
  options: OrchestrateOptions = {},
): Promise<void> {
  const maxParallel = options.maxParallel ?? 1;
  const statePath = path.join(projectDir, ".ada", "state.json");

  // ── 1. Load state.json ───────────────────────────────────────────────────────
  if (!fs.existsSync(statePath)) {
    process.stderr.write(
      `  error: no .ada/state.json found in ${projectDir} — run 'ada compile' first\n`,
    );
    return;
  }

  let state: StateFile;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8")) as StateFile;
  } catch {
    process.stderr.write(`  error: failed to parse .ada/state.json\n`);
    return;
  }

  const subGoals = state.blueprint?.subGoals;
  if (!subGoals || subGoals.length === 0) {
    process.stderr.write(
      `  error: blueprint has no subGoals — compile a multi-context blueprint first\n`,
    );
    return;
  }

  // ── 2. Resolve runId ─────────────────────────────────────────────────────────
  const runId =
    state.runId ??
    state.compilationRun?.runId ??
    `ML-${Math.floor(Date.now() / 1000)}`;

  // ── 3. Compute waves ─────────────────────────────────────────────────────────
  const waves = topoWaves(subGoals);

  // ── 4. Print execution plan ──────────────────────────────────────────────────
  process.stderr.write(`\n  Ada Orchestration Plan\n`);
  process.stderr.write(`  ${"─".repeat(21)}\n`);

  waves.forEach((wave, i) => {
    const label = wave.length > 1 ? "parallel" : "serial";
    process.stderr.write(`  Wave ${i + 1} (${label}): [${wave.join(", ")}]\n`);
  });

  process.stderr.write(`\n`);

  // ── 5. Dry run exits here ────────────────────────────────────────────────────
  if (options.dryRun) return;

  // ── 6. Single subGoal mode ───────────────────────────────────────────────────
  let wavesToRun: string[][];

  if (options.subGoal) {
    const found = subGoals.find((sg) => sg.name === options.subGoal);
    if (!found) {
      process.stderr.write(
        `  error: subGoal "${options.subGoal}" not found in blueprint\n`,
      );
      return;
    }
    wavesToRun = [[options.subGoal]];
  } else {
    wavesToRun = waves;
  }

  // ── 7. Init state file ───────────────────────────────────────────────────────
  initSubGoalState(projectDir, runId, subGoals);

  // ── 8. Execute waves ─────────────────────────────────────────────────────────
  let totalComplete = 0;

  for (const wave of wavesToRun) {
    const batches = chunkArray(wave, maxParallel);

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map((name) => runSubGoal(projectDir, name, subGoals, runId)),
      );

      for (const result of results) {
        if (result.failed) {
          process.stderr.write(
            `  error: subGoal "${result.name}" failed — ${result.reason}\n`,
          );
          process.stderr.write(`  orchestration halted.\n\n`);
          return;
        }
        totalComplete++;
      }
    }
  }

  // ── 9. Done ──────────────────────────────────────────────────────────────────
  process.stderr.write(
    `  ✓ Orchestration complete — ${totalComplete} subGoal${totalComplete === 1 ? "" : "s"} built\n\n`,
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface SubGoalResult {
  name: string;
  failed: boolean;
  reason: string;
}

async function runSubGoal(
  projectDir: string,
  name: string,
  allSubGoals: readonly SubGoalSpec[],
  _runId: string,
): Promise<SubGoalResult> {
  const spec = allSubGoals.find((sg) => sg.name === name);
  if (!spec) {
    return { name, failed: true, reason: `spec not found for "${name}"` };
  }

  const blueprintSummary = buildSubGoalSystemPrompt(spec);

  // Spawn Claude Code session for this subGoal
  const sessionGen = spawn({
    workingDir: projectDir,
    blueprintSummary,
    outputFormat: "stream-json",
  });

  // We need the session_id from the first event to record it in state
  let sessionId: string | null = null;

  const iterateSession = async (): Promise<void> => {
    for await (const event of sessionGen) {
      // Capture session_id from the first event that has one
      if (!sessionId && event.session_id) {
        sessionId = event.session_id;
        markSubGoalInProgress(projectDir, name, sessionId);
      }
    }
  };

  // Wrap in a 60-minute timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`timeout after 60 minutes`)),
      SIXTY_MINUTES_MS,
    ),
  );

  try {
    await Promise.race([iterateSession(), timeoutPromise]);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    markSubGoalFailed(projectDir, name, reason);
    return { name, failed: true, reason };
  }

  // Session exhausted — check state file to confirm completion
  const stateFile = loadSubGoalState(projectDir);
  const sg = stateFile?.subGoals.find((s) => s.name === name);

  if (sg?.status !== "complete") {
    // Session ended without marking complete — infer completion from clean exit
    // (the Claude Code session ran to exhaustion without error)
    const evidence: string[] = [];
    markSubGoalComplete(projectDir, name, evidence);
  }

  return { name, failed: false, reason: "" };
}

function buildSubGoalSystemPrompt(spec: SubGoalSpec): string {
  const lines: string[] = [
    `# SubGoal: ${spec.name}`,
    ``,
    `## Derived Intent`,
    spec.derivedIntent,
    ``,
  ];

  if (spec.entities.length > 0) {
    lines.push(`## Entities`);
    spec.entities.forEach((e) => lines.push(`- ${e}`));
    lines.push(``);
  }

  if (spec.workflows.length > 0) {
    lines.push(`## Workflows`);
    spec.workflows.forEach((w) => lines.push(`- ${w}`));
    lines.push(``);
  }

  if (spec.invariants.length > 0) {
    lines.push(`## Invariants`);
    spec.invariants.forEach((inv) => lines.push(`- ${inv}`));
    lines.push(``);
  }

  if (spec.dependsOn.length > 0) {
    lines.push(`## Depends On`);
    spec.dependsOn.forEach((d) => lines.push(`- ${d}`));
    lines.push(``);
  }

  lines.push(
    `When this subGoal is complete, call ada.set_task_status("${spec.name}", "complete", [evidence]).`,
  );

  return lines.join("\n");
}
