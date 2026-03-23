import { spawn as cpSpawn } from "child_process";
import type { SpawnConfig, ClaudeEvent } from "./types.js";
import { parseStreamJsonLine } from "./events.js";

export async function* spawn(config: SpawnConfig): AsyncGenerator<ClaudeEvent> {
  const args = ["--permission-mode", "auto", "--output-format", "stream-json"];

  if (config.blueprintSummary) {
    args.push("--append-system-prompt", config.blueprintSummary);
  }

  if (config.sessionId) {
    args.push("--resume", config.sessionId);
  }

  const proc = cpSpawn("claude", args, {
    cwd: config.workingDir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let buffer = "";

  const stdout = proc.stdout;
  if (!stdout) return;

  for await (const chunk of stdout) {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseStreamJsonLine(line);
      if (event) yield event;
    }
  }

  if (buffer.trim()) {
    const event = parseStreamJsonLine(buffer);
    if (event) yield event;
  }
}

export function injectCorrection(
  proc: ReturnType<typeof cpSpawn>,
  correction: string,
): void {
  if (proc.stdin) {
    proc.stdin.write(correction + "\n");
  }
}
