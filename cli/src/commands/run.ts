import * as fs from "fs";
import * as path from "path";
import { spawn } from "@ada/orchestrator";
import { watch } from "@ada/governor";
import { loadBlueprintState } from "@ada/compiler";
import { glyphs } from "../ui/design-system.js";

export async function runCommand(): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  // Load blueprint if one exists — governor watches against it
  let blueprint: Parameters<typeof watch>[0] | undefined;

  if (fs.existsSync(statePath)) {
    try {
      const { blueprint: bp } = loadBlueprintState(statePath);
      blueprint = bp;
    } catch {
      // Corrupt state — run ungoverned, no crash
    }
  }

  if (blueprint) {
    console.log(
      `  ${glyphs.identity.core} launching claude code with governor...`,
    );
  } else {
    console.log(
      `  ${glyphs.identity.core} launching claude code (no blueprint — run 'ada compile' first)...`,
    );
  }

  const events = spawn({
    workingDir: cwd,
    outputFormat: "stream-json",
  });

  if (!blueprint) {
    // No blueprint — passthrough mode, just stream events
    for await (const event of events) {
      if (event.event.type === "content_block_start") {
        process.stdout.write(".");
      }
    }
    console.log("\n  session complete.\n");
    return;
  }

  // Governed mode — pipe events through governor.watch()
  let driftCount = 0;
  let checkpointCount = 0;

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
        checkpointCount++;
        process.stdout.write(
          `\n  ${glyphs.status.pass} checkpoint ${checkpointCount} written\n`,
        );
        break;

      case "CONFIDENCE":
        // Intermediate confidence update — quiet
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
