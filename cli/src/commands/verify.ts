import * as fs from "fs";
import * as path from "path";
import { verify, formatTerminal, formatMarkdown } from "@ada/compiler";

export async function verifyCommand(
  flags: Set<string> = new Set(),
): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(
      "Error: no .ada/state.json found — run 'ada init' first to compile a blueprint",
    );
    process.exit(1);
  }

  const comment = flags.has("--comment");
  const json = flags.has("--json");

  if (!json) {
    console.error("\n  Verifying codebase against blueprint...\n");
  }

  const startTime = Date.now();

  let report;
  try {
    report = verify({ projectRoot: cwd, statePath });
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const elapsed = Date.now() - startTime;

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (comment) {
    // GitHub PR comment mode
    let repoUrl: string | undefined;
    let sha: string | undefined;

    try {
      const { execSync } = await import("child_process");
      const remote = execSync("git remote get-url origin", {
        encoding: "utf8",
      }).trim();
      repoUrl = remote
        .replace(/\.git$/, "")
        .replace(/^git@github\.com:/, "https://github.com/");
      sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch {
      // not a git repo or no remote
    }

    const md = formatMarkdown(report, repoUrl, sha);
    console.log(md);
  } else {
    // Terminal mode
    console.log(formatTerminal(report));
  }

  if (!json) {
    console.error(`  Completed in ${elapsed}ms\n`);
  }

  if (!report.passed) {
    process.exit(2);
  }
}
