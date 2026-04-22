import * as fs from "node:fs";
import * as path from "node:path";
import { startServer } from "@ada/mcp-server";
import type { StateSnapshot } from "@ada/mcp-server";

// `ada mcp` — stdio MCP server for Claude Code.
//
// Serves both the static blueprint tools (get_blueprint, get_invariants,
// etc.) and three live-state tools (get_available_context, get_stage,
// describe_run) that re-read `.ada/state.json` on every query. This lets
// Claude Code see new context the moment the `ada context` daemon writes
// it, without the child MCP process needing a shared memory channel.

function readSnapshotFromDisk(): StateSnapshot | null {
  const statePath = path.join(process.cwd(), ".ada", "state.json");
  try {
    if (!fs.existsSync(statePath)) return null;
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as StateSnapshot;
    // Defensive: require the minimum fields the live-state tools read.
    if (
      typeof parsed.runId === "string" &&
      typeof parsed.startedAt === "number" &&
      parsed.stages &&
      typeof parsed.stages === "object"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function mcpCommand(): Promise<void> {
  await startServer({
    reader: { getSnapshot: readSnapshotFromDisk },
  });
}
