import * as fs from "fs";
import * as path from "path";
import { MotherCompiler } from "@ada/compiler";
import { writeConfigGraph } from "@ada/config-writer";
import { writeWorldModel } from "../world-model.js";

// ─── Headless compile command ─────────────────────────────────────────────────
// Programmatic entry point for non-interactive compilation.
// Progress → stderr. Final JSON result → stdout.
// Intended for use by agents, scripts, and CI pipelines.
//
// Usage: ada compile-headless "<intent>" [target-dir]

export async function headlessCommand(args: string[]): Promise<void> {
  const intent = args[0];
  const targetDir = path.resolve(args[1] ?? process.cwd());

  if (!intent) {
    process.stderr.write(
      'Usage: ada compile-headless "<intent>" [target-dir]\n',
    );
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    process.stderr.write(`Error: target directory not found: ${targetDir}\n`);
    process.exit(1);
  }

  // Change to target directory so all relative path resolution is correct
  process.chdir(targetDir);

  const runId = `ML-${Math.floor(Date.now() / 1000)}`;
  const compiler = new MotherCompiler();

  const stageOrder = [
    "CTX",
    "INT",
    "PER",
    "ENT",
    "PRO",
    "SYN",
    "VER",
    "GOV",
  ] as const;
  const total = stageOrder.length;
  let currentStageIdx = 0;

  process.stderr.write(`[ada] headless compile  runId=${runId}\n`);
  process.stderr.write(`[ada] intent: ${intent.slice(0, 120)}\n`);
  process.stderr.write(`[ada] target: ${targetDir}\n\n`);

  let result: Awaited<ReturnType<MotherCompiler["compile"]>>;

  try {
    result = await compiler.compile(intent, {
      onStageStart(stage) {
        currentStageIdx++;
        process.stderr.write(`[${currentStageIdx}/${total}] ${stage} ...\n`);
      },
      onStageToken(_event) {
        // suppress token stream in headless mode
      },
      onStageComplete(event) {
        const n = (stageOrder as readonly string[]).indexOf(event.stage) + 1;
        process.stderr.write(`[${n}/${total}] ${event.stage} ✓\n`);
      },
    });
  } catch (err) {
    process.stderr.write(
      `\n[ada] compilation failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  }

  const { blueprint, governorDecision, pipelineState, compilationRun } = result;

  process.stderr.write(
    `\n[ada] GOV: ${governorDecision.decision}  confidence: ${(governorDecision.confidence * 100).toFixed(0)}%\n`,
  );

  // Write config files regardless of decision — always partial-safe so ITERATE
  // doesn't crash before state.json and stdout JSON are written
  const configOptions = {
    partial: true,
    ...(pipelineState.persona ? { domainContext: pipelineState.persona } : {}),
  };
  const configGraph = writeConfigGraph(
    blueprint,
    governorDecision,
    targetDir,
    configOptions,
  );

  writeWorldModel(result, runId, targetDir);

  // Persist state checkpoint
  const stateDir = path.join(targetDir, ".ada");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "state.json"),
    JSON.stringify(
      {
        blueprint,
        governorDecision,
        pipelineState,
        compilationRun,
        runId,
        timestamp: Date.now(),
      },
      null,
      2,
    ),
    "utf8",
  );

  process.stderr.write(`[ada] artifacts written to ${targetDir}\n`);

  // ── JSON result to stdout ────────────────────────────────────────────────
  const output = {
    runId,
    decision: governorDecision.decision,
    confidence: governorDecision.confidence,
    summary: blueprint.summary,
    architecture: {
      pattern: blueprint.architecture.pattern,
      components: blueprint.architecture.components.map((c) => ({
        name: c.name,
        responsibility: c.responsibility,
        boundedContext: c.boundedContext,
      })),
    },
    artifacts: {
      claudeMd: true,
      agents: configGraph.agents.length,
      hooks: configGraph.hooks.length,
      skills: configGraph.skills.length,
    },
    violations: (governorDecision.violations ?? []).map((v) => ({
      severity: v.severity,
      ruleViolated: v.ruleViolated,
      description: v.description,
    })),
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");

  if (governorDecision.decision !== "ACCEPT") {
    process.exit(1);
  }
}
