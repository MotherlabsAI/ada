import * as fs from "fs";
import * as path from "path";
import { glyphs } from "../ui/design-system.js";

type StateSummary = {
  adaDir: string;
  statePath: string;
  runId: string;
  decision: string;
  timestamp: string;
  timestampMs: number;
};

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build"]);

function readState(statePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function extractSummary(
  adaDir: string,
  statePath: string,
  state: Record<string, unknown>,
): StateSummary {
  const runId = typeof state.runId === "string" ? state.runId : "(unknown)";
  const timestamp =
    typeof state.timestamp === "string" ? state.timestamp : "(unknown)";
  const timestampMs = Date.parse(timestamp);
  const gov = asObj(state.governorDecision);
  const decision =
    typeof gov.decision === "string" ? gov.decision : "(unknown)";
  return {
    adaDir,
    statePath,
    runId,
    decision,
    timestamp,
    timestampMs: Number.isFinite(timestampMs) ? timestampMs : 0,
  };
}

function findAdaDirs(root: string, maxDepth: number): string[] {
  const results: string[] = [];
  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === ".ada") {
        results.push(path.join(dir, ".ada"));
        continue;
      }
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  }
  walk(root, 0);
  return results;
}

function printHelp(): void {
  const c = glyphs.chevron;
  console.log("");
  console.log(`  ${c} usage: ada session <command>`);
  console.log(`  ${c} list              list all .ada sessions under cwd`);
  console.log(`  ${c} show              show session in ./.ada/state.json`);
  console.log(`  ${c} show <runId>      show session by run id`);
  console.log("");
}

function countArr(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function printSummary(s: StateSummary, state: Record<string, unknown>): void {
  const blueprint = asObj(state.blueprint);
  const summaryRaw =
    typeof blueprint.summary === "string" ? blueprint.summary : "";
  const firstLine = summaryRaw.split(/\r?\n/)[0]?.trim() || "(no summary)";
  const ps = asObj(state.pipelineState);
  const goals = countArr(asObj(ps.intent).goals);
  const entities = countArr(asObj(ps.entity).entities);
  const workflows = countArr(asObj(ps.process).workflows);
  const elapsedRaw = state.elapsedMs;
  const elapsed =
    typeof elapsedRaw === "number" ? `${(elapsedRaw / 1000).toFixed(1)}s` : "—";
  const c = glyphs.chevron;
  console.log("");
  console.log(`  ${c} run        ${s.runId}`);
  console.log(`  ${c} decision   ${s.decision}`);
  console.log(`  ${c} timestamp  ${s.timestamp}`);
  console.log(`  ${c} goals      ${goals}`);
  console.log(`  ${c} entities   ${entities}`);
  console.log(`  ${c} workflows  ${workflows}`);
  console.log(`  ${c} elapsed    ${elapsed}`);
  console.log(`  ${c} summary    ${firstLine}`);
  console.log(`  ${c} path       ${s.statePath}`);
  console.log("");
}

function collectSummaries(root: string): StateSummary[] {
  const summaries: StateSummary[] = [];
  for (const adaDir of findAdaDirs(root, 3)) {
    const statePath = path.join(adaDir, "state.json");
    if (!fs.existsSync(statePath)) continue;
    const state = readState(statePath);
    if (state === null) continue;
    summaries.push(extractSummary(adaDir, statePath, state));
  }
  return summaries;
}

async function listSessions(): Promise<void> {
  const summaries = collectSummaries(process.cwd());
  summaries.sort((a, b) => b.timestampMs - a.timestampMs);
  if (summaries.length === 0) {
    console.log("no .ada sessions found under cwd (max depth 3)");
    return;
  }
  const c = glyphs.chevron;
  console.log("");
  for (const s of summaries) {
    console.log(`  ${c} ${s.runId}`);
    console.log(`      decision:  ${s.decision}`);
    console.log(`      timestamp: ${s.timestamp}`);
    console.log(`      path:      ${s.adaDir}`);
    console.log("");
  }
}

async function showSession(runId: string | undefined): Promise<void> {
  if (runId === undefined) {
    const statePath = path.join(process.cwd(), ".ada", "state.json");
    if (!fs.existsSync(statePath)) {
      console.error(
        "no compiled blueprint in this directory — run `ada init \"<intent>\"` first",
      );
      process.exit(1);
      return;
    }
    const state = readState(statePath);
    if (state === null) {
      console.error("Error: .ada/state.json is missing or not valid JSON");
      process.exit(1);
      return;
    }
    printSummary(extractSummary(path.dirname(statePath), statePath, state), state);
    return;
  }
  for (const adaDir of findAdaDirs(process.cwd(), 3)) {
    const statePath = path.join(adaDir, "state.json");
    const state = fs.existsSync(statePath) ? readState(statePath) : null;
    if (state === null) continue;
    const summary = extractSummary(adaDir, statePath, state);
    if (summary.runId === runId) {
      printSummary(summary, state);
      return;
    }
  }
  console.error(`no session with runId '${runId}' found under cwd`);
  process.exit(1);
}

export async function sessionCommand(argv: string[]): Promise<void> {
  const [sub, ...rest] = argv;
  if (sub === undefined) {
    printHelp();
    return;
  }
  if (sub === "list") {
    await listSessions();
    return;
  }
  if (sub === "show") {
    await showSession(rest[0]);
    return;
  }
  console.error(`unknown session command: ${sub}`);
  printHelp();
  process.exit(1);
}
