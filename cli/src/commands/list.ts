import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { AdaStorage } from "@ada/storage";
import { glyphs } from "../ui/design-system.js";

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

export async function listCommand(
  flags: Set<string> = new Set(),
): Promise<void> {
  const json = flags.has("--json");
  const dbPath = path.join(os.homedir(), ".ada", "storage.db");

  const emptyMessage =
    'no projects compiled yet — run `ada init "<intent>"`';

  if (!fs.existsSync(dbPath)) {
    if (json) {
      console.log("[]");
    } else {
      console.log(emptyMessage);
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

  const projects = storage
    .listProjects()
    .slice()
    .sort((a, b) => b.lastCompiledAt - a.lastCompiledAt);

  if (projects.length === 0) {
    if (json) {
      console.log("[]");
    } else {
      console.log(emptyMessage);
    }
    return;
  }

  if (json) {
    const payload = projects.map((p) => ({
      projectPath: p.projectPath,
      runCount: p.runCount,
      lastDecision: p.lastDecision,
      lastCompiledAt: p.lastCompiledAt,
    }));
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const now = Date.now();
  console.log("");
  for (const project of projects) {
    const when = formatRelative(now, project.lastCompiledAt);
    console.log(`  ${glyphs.chevron} ${project.projectPath}`);
    console.log(
      `      runs: ${project.runCount}  decision: ${project.lastDecision}  last: ${when}`,
    );
    console.log("");
  }
}
