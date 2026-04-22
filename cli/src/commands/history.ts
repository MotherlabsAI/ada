import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { AdaStorage, type RunRecord } from "@ada/storage";
import { glyphs } from "../ui/design-system.js";

function parseFlags(argv: string[]): { json: boolean; limit: number } {
  let json = false;
  let limit = 20;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === "--json") {
      json = true;
    } else if (arg === "--limit") {
      const next = argv[i + 1];
      const parsed = next !== undefined ? Number.parseInt(next, 10) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      i++;
    } else if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
    }
  }
  return { json, limit };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function formatRelative(nowMs: number, thenMs: number): string {
  const deltaMs = Math.max(0, nowMs - thenMs);
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function formatAbsolute(thenMs: number): string {
  const d = new Date(thenMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
}

export async function historyCommand(argv: string[]): Promise<void> {
  const { json, limit } = parseFlags(argv);
  const dbPath = path.join(os.homedir(), ".ada", "storage.db");

  if (!fs.existsSync(dbPath)) {
    if (json) {
      console.log("[]");
    } else {
      console.log("no compile history yet");
    }
    return;
  }

  let storage: AdaStorage;
  try {
    storage = new AdaStorage();
  } catch (err) {
    console.error(
      `Error: failed to open storage — ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }

  const projects = storage.listProjects();
  const allRuns: RunRecord[] = [];
  for (const project of projects) {
    const runs = storage.getRunHistory(project.projectPath, limit);
    allRuns.push(...runs);
  }

  allRuns.sort((a, b) => b.compiledAt - a.compiledAt);
  const rows = allRuns.slice(0, limit);

  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log("no compile history yet");
    return;
  }

  const now = Date.now();
  console.log("");
  for (const run of rows) {
    const when = `${formatRelative(now, run.compiledAt)} (${formatAbsolute(run.compiledAt)})`;
    const intent = truncate(run.intent ?? "", 60);
    const duration = formatDuration(run.durationMs);
    console.log(`  ${glyphs.chevron} ${when}`);
    console.log(`      project: ${run.projectPath}`);
    console.log(`      decision: ${run.decision}  duration: ${duration}`);
    console.log(`      intent: ${intent}`);
    console.log("");
  }
}
