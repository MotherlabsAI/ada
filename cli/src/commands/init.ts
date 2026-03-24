import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import { spawn as cpSpawn } from "child_process";
import { MotherCompiler } from "@ada/compiler";
import type {
  CompilerStageCode,
  PipelineState,
  IterationRecord,
  ClarificationRequest,
  ClarificationAnswer,
} from "@ada/compiler";
import { writeConfigGraph } from "@ada/config-writer";
import { createCompileRenderer, STAGE_ORDER } from "../ui/terminal.js";
import type { ArtifactEntry } from "../ui/artifact-list.js";
import { glyphs } from "../ui/design-system.js";

export interface InitOptions {
  readonly noExecute?: boolean;
}

// ─── Stage summary derivation ─────────────────────────────────────────────────

function deriveSummary(stage: CompilerStageCode, ps: PipelineState): string {
  switch (stage) {
    case "CTX":
      return "codebase analyzed";
    case "INT": {
      const a = ps.intent;
      return a
        ? `${a.goals.length} goals, ${a.unknowns.length} unknowns`
        : "parsed";
    }
    case "PER": {
      const a = ps.persona;
      return a
        ? `domain: ${a.domain} / ${a.excludedConcerns.length} excl`
        : "profiled";
    }
    case "ENT": {
      const a = ps.entity;
      if (!a) return "extracted";
      const inv = a.entities.reduce((s, e) => s + e.invariants.length, 0);
      return `${a.entities.length} entities, ${inv} invariants`;
    }
    case "PRO": {
      const a = ps.process;
      if (!a) return "sequenced";
      const edge = a.workflows.reduce(
        (s, w) =>
          s + w.steps.reduce((ss, st) => ss + st.failureModes.length, 0),
        0,
      );
      return `${a.workflows.length} workflows, ${edge} edge cases`;
    }
    case "SYN": {
      const a = ps.synthesis;
      return a
        ? `${a.architecture.components.length} components, ${a.openQuestions.length} open`
        : "composed";
    }
    case "VER": {
      const a = ps.verify;
      return a
        ? `coverage:${a.coverageScore.toFixed(2)} coherence:${a.coherenceScore.toFixed(2)}`
        : "audited";
    }
    case "GOV": {
      const a = ps.governor;
      return a
        ? `${a.decision} confidence:${a.confidence.toFixed(2)}`
        : "decided";
    }
  }
}

const STAGE_ARTIFACTS: Record<CompilerStageCode, keyof PipelineState> = {
  CTX: "gates",
  INT: "intent",
  PER: "persona",
  ENT: "entity",
  PRO: "process",
  SYN: "synthesis",
  VER: "verify",
  GOV: "governor",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Init command ─────────────────────────────────────────────────────────────

export async function initCommand(
  intent: string,
  options: InitOptions = {},
): Promise<void> {
  const runId = `ML-${Math.floor(Date.now() / 1000)}`;
  const compiler = new MotherCompiler();
  const renderer = createCompileRenderer(runId);
  const maxIterations = parseInt(process.env["ADA_MAX_ITERATIONS"] ?? "3", 10);

  let currentIntent = intent;
  let iterationCount = 0;
  let finalResult: import("@ada/compiler").CompileResult | null = null;
  const iterationHistory: IterationRecord[] = [];

  // ─── Clarification callback ───
  const handleClarification = async (
    requests: readonly ClarificationRequest[],
  ): Promise<readonly ClarificationAnswer[]> => {
    renderer.unmount();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answers: ClarificationAnswer[] = [];

    console.log(
      `\n  ${glyphs.chevron} ${requests.length} blocking unknown(s) need clarification:\n`,
    );
    for (const req of requests) {
      const answer = await new Promise<string>((resolve) => {
        rl.question(`  ${glyphs.identity.open} ${req.question}\n  > `, (ans) =>
          resolve(ans.trim()),
        );
      });
      if (answer) {
        answers.push({ unknownId: req.unknownId, answer });
      }
    }
    rl.close();
    console.log("");
    return answers;
  };

  while (iterationCount < maxIterations) {
    iterationCount++;
    if (iterationCount > 1) {
      renderer.onIteration(iterationCount);
    }

    // Track per-stage times and entropies during live streaming
    const stageTimes = new Map<CompilerStageCode, number>();
    const stageEntropies = new Map<CompilerStageCode, number>();
    let stageStart = Date.now();

    const result = await compiler.compile(currentIntent, {
      onClarificationNeeded:
        iterationCount === 1 ? handleClarification : undefined,
      onStageStart(stage) {
        stageStart = Date.now();
        renderer.onStageStart(stage);
      },
      onStageToken(event) {
        renderer.onStageToken(event.stage, event.token);
      },
      onStageComplete(event) {
        // Record time and entropy — don't call renderer yet
        // Crystallization + artifacts will play post-compile
        const elapsed = Date.now() - stageStart;
        stageTimes.set(event.stage, elapsed);
        stageEntropies.set(event.stage, event.entropyEstimate);
      },
    });

    // ── Post-compile: animated crystallize → artifact cascade ──────────────
    // Each stage crystallizes (350ms) then reveals its artifact (brief pause)
    const ps = result.pipelineState;

    for (const stage of STAGE_ORDER) {
      const entropy = stageEntropies.get(stage) ?? 0.5;
      const elapsed = stageTimes.get(stage) ?? 0;

      // Phase 2: crystallizing
      renderer.onStageCrystallize(stage, entropy, elapsed);
      await sleep(350);

      // Phase 3: artifact
      const summary = deriveSummary(stage, ps);
      const artifact = ps[STAGE_ARTIFACTS[stage]];
      renderer.onStageComplete(stage, summary, entropy, elapsed, artifact);
      await sleep(80);
    }

    // ── Governor decision ──────────────────────────────────────────────────
    const decision = result.governorDecision;
    const gateValues = Object.values(ps.gates);
    const passedCount = gateValues.filter((g) => g.passed).length;
    renderer.onGovernorDecision(decision, {
      passed: passedCount,
      total: gateValues.length,
    });

    // Track iteration for fallback
    iterationHistory.push({
      iterationNumber: iterationCount,
      governorDecision: decision,
      coverageScore: decision.coverageScore,
      coherenceScore: decision.coherenceScore,
      gatePassRate: decision.gatePassRate,
      blueprint: result.blueprint,
    });

    if (decision.decision === "ACCEPT") {
      finalResult = result;
      break;
    }
    if (decision.decision === "REJECT") {
      finalResult = result;
      break;
    }

    // ITERATE — augment intent with correction
    if (decision.nextAction) {
      const action =
        typeof decision.nextAction === "string"
          ? decision.nextAction.slice(0, 500)
          : JSON.stringify(decision.nextAction).slice(0, 500);
      currentIntent = `${intent}\n\nCORRECTION: ${action}`;
    }
    finalResult = result;
  }

  if (!finalResult) {
    renderer.unmount();
    console.error("  no result produced");
    process.exit(1);
    return;
  }

  const decision = finalResult.governorDecision;

  // ─── Fallback path: max iterations exceeded without ACCEPT ───
  if (decision.decision !== "ACCEPT" && iterationHistory.length > 0) {
    // Find best iteration by composite score
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < iterationHistory.length; i++) {
      const rec = iterationHistory[i]!;
      const score =
        (rec.coverageScore + rec.coherenceScore + rec.gatePassRate) / 3;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const bestIteration = iterationHistory[bestIdx]!;
    const uncertaintyMarkers = (
      bestIteration.governorDecision.violations ?? []
    ).map((v) => ({
      stageCode: v.stageCode,
      description: v.description,
      confidence: bestScore,
    }));

    // Add a general marker if no violations available
    if (uncertaintyMarkers.length === 0) {
      uncertaintyMarkers.push({
        stageCode: "GOV" as const,
        description: `Max iterations (${maxIterations}) exceeded. Best composite score: ${bestScore.toFixed(2)}`,
        confidence: bestScore,
      });
    }

    const fallback = {
      partialBlueprint: bestIteration.blueprint,
      uncertaintyMarkers,
      iterationHistory,
      bestIterationIndex: bestIdx,
    };

    const warnings = [
      `Compilation did not reach ACCEPT after ${iterationHistory.length} iteration(s).`,
      `Best iteration: #${bestIdx + 1} (score: ${bestScore.toFixed(2)})`,
      ...uncertaintyMarkers.map((m) => `[${m.stageCode}] ${m.description}`),
    ];

    const configGraph = writeConfigGraph(
      bestIteration.blueprint,
      bestIteration.governorDecision,
      process.cwd(),
      { partial: true, warnings },
    );

    const artifactEntries: ArtifactEntry[] = [
      { path: "CLAUDE.md", written: true, detail: "partial" },
      {
        path: ".claude/agents/",
        written: configGraph.agents.length > 0,
        detail: `${configGraph.agents.length} agents`,
      },
      {
        path: "hooks/pre-tool/",
        written: configGraph.hooks.length > 0,
        detail: `${configGraph.hooks.length} scripts`,
      },
      {
        path: ".claude/skills/",
        written: configGraph.skills.length > 0,
        detail:
          configGraph.skills.length > 0
            ? `${configGraph.skills.length} files`
            : undefined,
      },
      { path: ".claude/settings.json", written: true },
    ];
    renderer.onArtifactsWritten(artifactEntries);

    // Persist state with fallback
    const targetDir = process.cwd();
    const stateDir = path.join(targetDir, ".ada");
    fs.mkdirSync(stateDir, { recursive: true });
    const checkpoint = {
      blueprint: bestIteration.blueprint,
      governorDecision: bestIteration.governorDecision,
      pipelineState: finalResult.pipelineState,
      compilationRun: finalResult.compilationRun,
      fallback,
      runId,
      timestamp: Date.now(),
    };
    fs.writeFileSync(
      path.join(stateDir, "state.json"),
      JSON.stringify(checkpoint, null, 2),
      "utf8",
    );

    await sleep(2000);
    renderer.unmount();
    console.log(
      `\n  ${glyphs.chevron} partial blueprint written (fallback). Review CLAUDE.md warnings.\n`,
    );
    return;
  }

  if (decision.decision !== "ACCEPT") {
    await sleep(3000);
    renderer.unmount();
    process.exit(1);
    return;
  }

  const configGraph = writeConfigGraph(
    finalResult.blueprint,
    decision,
    process.cwd(),
  );

  const artifactEntries: ArtifactEntry[] = [
    { path: "CLAUDE.md", written: true },
    {
      path: ".claude/agents/",
      written: configGraph.agents.length > 0,
      detail: `${configGraph.agents.length} agents`,
    },
    {
      path: "hooks/pre-tool/",
      written: configGraph.hooks.length > 0,
      detail: `${configGraph.hooks.length} scripts`,
    },
    {
      path: ".claude/skills/",
      written: configGraph.skills.length > 0,
      detail:
        configGraph.skills.length > 0
          ? `${configGraph.skills.length} files`
          : undefined,
    },
    { path: ".claude/settings.json", written: true },
  ];
  renderer.onArtifactsWritten(artifactEntries);

  // ── Persist state checkpoint ────────────────────────────────────────────────
  const targetDir = process.cwd();
  const stateDir = path.join(targetDir, ".ada");
  fs.mkdirSync(stateDir, { recursive: true });
  const checkpoint = {
    blueprint: finalResult.blueprint,
    governorDecision: decision,
    pipelineState: finalResult.pipelineState,
    compilationRun: finalResult.compilationRun,
    runId,
    timestamp: Date.now(),
  };
  fs.writeFileSync(
    path.join(stateDir, "state.json"),
    JSON.stringify(checkpoint, null, 2),
    "utf8",
  );

  await sleep(2000);
  renderer.unmount();

  // ── Auto-spawn Claude Code ─────────────────────────────────────────────────
  if (options.noExecute) {
    console.log(
      `\n  ${glyphs.chevron} config written. --no-execute: skipping Claude spawn.\n`,
    );
    return;
  }

  console.log(`\n  ${glyphs.chevron} spawning claude in new terminal...\n`);

  const summaryLine = finalResult.blueprint.summary
    .slice(0, 1000)
    .replace(/'/g, "'\\''");
  const initialPrompt =
    "Read CLAUDE.md, then read all agent files in .claude/agents/. Follow the build order and session protocol. Begin building now.";

  // Write the command to a temp script so osascript do script doesn't need
  // to embed the full command string (avoids escaping corruption with long
  // blueprint summaries containing Unicode or special characters).
  const scriptContent = [
    "#!/bin/bash",
    `cd '${targetDir.replace(/'/g, "'\\''")}'`,
    `exec claude --permission-mode auto --append-system-prompt '${summaryLine}' '${initialPrompt}'`,
    "",
  ].join("\n");
  const scriptPath = path.join(os.tmpdir(), `ada-spawn-${Date.now()}.sh`);
  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  cpSpawn(
    "osascript",
    [
      "-e",
      `tell application "Terminal" to do script "bash '${scriptPath}'"`,
      "-e",
      `tell application "Terminal" to activate`,
    ],
    { detached: true, stdio: "ignore" },
  ).unref();
}
