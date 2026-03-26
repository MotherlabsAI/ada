#!/usr/bin/env node
/**
 * Headless Ada runner — bypasses Ink UI, calls compiler engine directly.
 * Usage: node run-headless.mjs "<intent>" [target-dir]
 */

import { MotherCompiler } from "./packages/compiler/dist/engine.js";
import { writeConfigGraph } from "./packages/config-writer/dist/index.js";
import * as fs from "fs";
import * as path from "path";

const intent = process.argv[2];
const targetDir = process.argv[3] || process.cwd();

if (!intent) {
  console.error("Usage: node run-headless.mjs \"<intent>\" [target-dir]");
  process.exit(1);
}

console.log(`\n  ◈ ada headless compiler`);
console.log(`  target: ${targetDir}`);
console.log(`  intent: ${intent.slice(0, 120)}...\n`);

const compiler = new MotherCompiler();
const runId = `ML-${Math.floor(Date.now() / 1000)}`;

const stages = ["CTX", "INT", "PER", "ENT", "PRO", "SYN", "VER", "GOV", "BLD"];

try {
  const result = await compiler.compile(intent, {
    runId,
    cwd: targetDir,
    onStageComplete: (event) => {
      const idx = stages.indexOf(event.stage);
      console.log(`  [${idx + 1}/9] ${event.stage} ✓  entropy: ${event.entropy?.toFixed(3) ?? "—"}`);
    },
  });

  console.log(`\n  ── Result ──`);
  console.log(`  Decision: ${result.governorDecision.decision}`);
  console.log(`  Confidence: ${(result.governorDecision.confidence * 100).toFixed(0)}%`);
  console.log(`  Components: ${result.blueprint.architecture.components.length}`);
  console.log(`  Pattern: ${result.blueprint.architecture.pattern}`);

  const entities = result.pipelineState.entity?.entities ?? [];
  const invariants = entities.reduce((s, e) => s + e.invariants.length, 0);
  console.log(`  Entities: ${entities.length}, Invariants: ${invariants}`);

  // Save full state first (before config write, in case it fails)
  const adaDir = path.join(targetDir, ".ada");
  fs.mkdirSync(adaDir, { recursive: true });
  fs.writeFileSync(
    path.join(adaDir, "state.json"),
    JSON.stringify({
      blueprint: result.blueprint,
      pipelineState: result.pipelineState,
      governorDecision: result.governorDecision,
      runId,
      compiledAt: new Date().toISOString(),
    }, null, 2),
  );

  // Write compiled config graph (CLAUDE.md, agents, hooks, skills)
  try {
    const configGraph = writeConfigGraph(
      result.blueprint,
      result.governorDecision,
      targetDir,
      { pipelineState: result.pipelineState },
    );
    console.log(`  ◈ Config graph written: ${configGraph.files?.length ?? "?"} files`);
  } catch (e) {
    console.log(`  ⚠ Config graph write failed: ${e.message}`);
    console.log(`  ◈ Full state is still saved — can extract manually`);
  }

  console.log(`\n  ◈ Compiled output written to ${targetDir}`);
  console.log(`  ◈ Full state saved to ${path.join(adaDir, "state.json")}\n`);

} catch (err) {
  console.error(`\n  ERROR: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
