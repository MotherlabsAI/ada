import * as fs from "fs";
import * as path from "path";
import { consolidateSessions } from "@ada/governor";
import { glyphs } from "../ui/design-system.js";

export interface ConsolidateOptions {
  readonly pruneOlderThanDays?: number;
  readonly verbose?: boolean;
}

export async function consolidateCommand(
  options: ConsolidateOptions = {},
): Promise<void> {
  const cwd = process.cwd();
  const adaDir = path.join(cwd, ".ada");

  if (!fs.existsSync(adaDir)) {
    console.error(
      `  ${glyphs.status.fail}  no .ada/ directory — run ada compile first`,
    );
    process.exit(1);
  }

  const indexPath = path.join(adaDir, "world-model-index.md");
  if (!fs.existsSync(indexPath)) {
    console.error(
      `  ${glyphs.status.fail}  no world-model-index.md — run ada compile first`,
    );
    process.exit(1);
  }

  console.log(`  ${glyphs.identity.core}  consolidating world model...`);

  const result = consolidateSessions(adaDir, {
    ...(options.pruneOlderThanDays !== undefined
      ? { pruneOlderThanDays: options.pruneOlderThanDays }
      : {}),
    ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
  });

  const sep = glyphs.pipeline.separator;
  const confPct = Math.round(result.avgConfidence * 100);

  console.log(
    `\n  ${glyphs.status.pass}  consolidated ${result.sessionsPruned > 0 ? `${result.sessionsProcessed} sessions (${result.sessionsPruned} pruned)` : `${result.sessionsProcessed} sessions`}`,
  );
  console.log(
    `     avg confidence ${confPct}%  ${sep}  ${result.totalToolEvents} tool events`,
  );

  if (result.topTools.length > 0) {
    const toolStr = result.topTools
      .slice(0, 5)
      .map((t) => `${t.tool} (${t.count})`)
      .join("  ·  ");
    console.log(`     tools  ${toolStr}`);
  }

  if (result.topDriftLocations.length > 0) {
    const driftStr = result.topDriftLocations
      .slice(0, 3)
      .map((d) => `${d.location} ×${d.count}`)
      .join("  ·  ");
    console.log(`     drift  ${driftStr}`);
  }

  console.log(`\n     world-model-index.md updated\n`);
}
