import { spawn } from "@ada/orchestrator";
import { glyphs } from "../ui/design-system.js";

export async function runCommand(): Promise<void> {
  console.log(`  ${glyphs.identity.core} launching claude code...`);

  const events = spawn({
    workingDir: process.cwd(),
    outputFormat: "stream-json",
  });

  for await (const event of events) {
    if (event.event.type === "content_block_start") {
      process.stdout.write(".");
    }
  }

  console.log("\n  session complete.\n");
}
