import { spawn } from "@ada/orchestrator";

export async function resumeCommand(sessionId: string): Promise<void> {
  console.log(`  Resuming session ${sessionId}...`);

  const events = spawn({
    workingDir: process.cwd(),
    sessionId,
    outputFormat: "stream-json",
  });

  for await (const event of events) {
    if (event.event.type === "content_block_start") {
      process.stdout.write(".");
    }
  }

  console.log("\n  Session complete.");
}
