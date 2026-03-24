import * as fs from "fs";
import { MotherCompiler } from "@ada/compiler";
import type { StageCompleteEvent, AccumulationContext } from "@ada/compiler";
import { AdaStorage } from "@ada/storage";
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
  const runId = `ML-${Math.floor(start / 1000)}`;
  const projectPath = process.cwd();

  // ─── Intent Read Hook: load accumulation context from prior compiles ─────
  let accumulationContext: AccumulationContext | undefined;
  try {
    const storage = new AdaStorage();
    const recentRecords = storage.getRecentCompileRecords(projectPath, 5);
    accumulationContext =
      MotherCompiler.buildAccumulationContext(recentRecords);
  } catch {
    /* ledger read is non-fatal */
  }

  const result = await compiler.compile(intent, {
    accumulationContext,
    onStageComplete(event: StageCompleteEvent) {
      const elapsed = formatElapsed(Date.now() - start);
      process.stderr.write(
        `  ${glyphs.chevron} ${event.stage}  ${glyphs.status.pass}  entropy:${event.entropyEstimate.toFixed(3)}  ${elapsed}\n`,
      );
    },
  });

  // ─── Governor Write Hook: write CompileRecord to accumulation ledger ─────
  try {
    const storage = new AdaStorage();
    const compileRecord = MotherCompiler.buildCompileRecord(result, runId);
    storage.recordCompile({
      runId: compileRecord.runId,
      projectPath,
      intentHash: compileRecord.intentHash,
      blueprintPostcode: compileRecord.blueprintPostcode,
      gateDeltas: JSON.stringify(compileRecord.gateDeltas),
      entropyReadings: JSON.stringify(compileRecord.entropyReadings),
      timestamp: compileRecord.timestamp,
      decision: compileRecord.decision,
      postcodeRaw: compileRecord.postcode.raw,
    });
  } catch {
    /* never crash compile for storage errors */
  }

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
