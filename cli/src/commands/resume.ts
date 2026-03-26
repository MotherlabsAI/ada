import * as fs from "fs";
import * as path from "path";
import { spawn } from "@ada/orchestrator";
import { watch } from "@ada/governor";
import { loadBlueprintState } from "@ada/compiler";
import { glyphs } from "../ui/design-system.js";

export async function resumeCommand(sessionId: string): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  let blueprint: Parameters<typeof watch>[0] | undefined;

  if (fs.existsSync(statePath)) {
    try {
      const { blueprint: bp } = loadBlueprintState(statePath);
      blueprint = bp;
    } catch {
      // Corrupt state — run ungoverned
    }
  }

  console.log(
    `  ${glyphs.identity.core} resuming session ${sessionId}${blueprint ? " with governor" : ""}...`,
  );

  const events = spawn({
    workingDir: cwd,
    sessionId,
    outputFormat: "stream-json",
  });

  if (!blueprint) {
    for await (const event of events) {
      if (event.event.type === "content_block_start") {
        process.stdout.write(".");
      }
    }
    console.log("\n  session complete.\n");
    return;
  }

  let driftCount = 0;

  for await (const signal of watch(blueprint, events)) {
    switch (signal.type) {
      case "DRIFT":
        driftCount++;
        if (signal.severity === "critical") {
          console.error(
            `\n  ${glyphs.status.fail} drift [${signal.severity}] ${signal.location}: ${signal.detail}`,
          );
        }
        break;

      case "LOW_CONFIDENCE":
        console.error(
          `\n  ${glyphs.status.alert} confidence low (${Math.round(signal.confidence * 100)}%) — ${signal.reason}`,
        );
        break;

      case "CHECKPOINT":
        process.stdout.write(`\n  ${glyphs.status.pass} checkpoint written\n`);
        break;

      case "CONFIDENCE":
        break;

      case "SESSION_COMPLETE": {
        const pct = Math.round(signal.finalConfidence * 100);
        const icon =
          signal.decision === "ACCEPT"
            ? glyphs.status.pass
            : signal.decision === "DRIFT"
              ? glyphs.status.alert
              : glyphs.status.fail;

        console.log(`\n  ${icon} session complete — confidence ${pct}%`);
        if (driftCount > 0) {
          console.log(
            `  ${driftCount} drift signal${driftCount === 1 ? "" : "s"} detected`,
          );
        }
        if (signal.decision === "HALT") {
          process.exit(1);
        }
        break;
      }
    }
  }

  console.log();
}
