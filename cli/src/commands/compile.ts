import * as fs from "fs";
import { MotherCompiler } from "@ada/compiler";
import type { StageCompleteEvent } from "@ada/compiler";
import { glyphs, formatElapsed } from "../ui/design-system.js";

export interface CompileOptions {
  readonly output?: string;
  readonly strict?: boolean;
}

export async function compileCommand(
  intent: string,
  options: CompileOptions = {},
): Promise<void> {
  const compiler = new MotherCompiler();
  const start = Date.now();

  const result = await compiler.compile(intent, {
    onStageComplete(event: StageCompleteEvent) {
      const elapsed = formatElapsed(Date.now() - start);
      process.stderr.write(
        `  ${glyphs.chevron} ${event.stage}  ${glyphs.status.pass}  entropy:${event.entropyEstimate.toFixed(3)}  ${elapsed}\n`,
      );
    },
  });

  const gov = result.governorDecision;
  if (options.strict && gov.decision !== "ACCEPT") {
    process.stderr.write(
      `\nGovernance VIOLATED: ${gov.rejectionReasons.join("; ")}\n`,
    );
    process.exit(3);
    return;
  }

  const serialized = JSON.stringify(result, null, 2);

  if (options.output) {
    try {
      fs.writeFileSync(options.output, serialized, "utf8");
      const written = fs.readFileSync(options.output, "utf8");
      if (written.length !== serialized.length) {
        process.stderr.write("Error: WRITE_INTEGRITY_FAILURE\n");
        fs.unlinkSync(options.output);
        process.exit(4);
        return;
      }
      process.stderr.write(
        `\n  ${glyphs.chevron} blueprint written to ${options.output}\n`,
      );
    } catch {
      process.stderr.write(
        `Error: OUTPUT_NOT_WRITABLE — falling back to stdout\n`,
      );
      process.stdout.write(serialized + "\n");
    }
  } else {
    process.stdout.write(serialized + "\n");
  }
}
