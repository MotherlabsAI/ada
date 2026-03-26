import * as fs from "fs";
import * as path from "path";
import { verify, formatTerminal, formatMarkdown } from "@ada/compiler";
import type { VerificationReport } from "@ada/compiler";

// Writes .ada/drift.md when violations are found so the next Claude Code
// session starts with a clear picture of what drifted. Clears the file on
// a clean pass — Ada is the live authority, not a log.
function writeDriftFile(projectDir: string, report: VerificationReport): void {
  const adaDir = path.join(projectDir, ".ada");
  const driftPath = path.join(adaDir, "drift.md");

  if (report.passed || report.findings.length === 0) {
    if (fs.existsSync(driftPath)) fs.unlinkSync(driftPath);
    return;
  }

  if (!fs.existsSync(adaDir)) fs.mkdirSync(adaDir, { recursive: true });

  const critical = report.findings.filter((f) => f.severity === "critical");
  const major = report.findings.filter((f) => f.severity === "major");
  const date = new Date().toISOString().split("T")[0] ?? "";

  const lines: string[] = [
    `# Ada Semantic Drift`,
    `Generated: ${date} | Score: ${Math.round(report.overallScore * 100)}%`,
    ``,
    `**Status: VIOLATIONS FOUND** — resolve before the next session`,
    ``,
    `Entity coverage: ${Math.round(report.entityCoverage * 100)}%  ·  Invariant coverage: ${Math.round(report.invariantCoverage * 100)}%  ·  Component coverage: ${Math.round(report.componentCoverage * 100)}%`,
    ``,
  ];

  if (critical.length > 0) {
    lines.push(`## Critical (${critical.length})`);
    lines.push(``);
    for (const f of critical) {
      lines.push(`- **${f.title}** — ${f.description}`);
      if (f.filePath) lines.push(`  File: \`${f.filePath}\``);
    }
    lines.push(``);
  }

  if (major.length > 0) {
    lines.push(`## Major (${major.length})`);
    lines.push(``);
    for (const f of major) {
      lines.push(`- **${f.title}** — ${f.description}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(
    `Run \`ada verify\` for full output. This file is cleared automatically when the codebase passes.`,
  );

  fs.writeFileSync(driftPath, lines.join("\n"), "utf8");
}

export async function verifyCommand(
  flags: Set<string> = new Set(),
): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(
      "  ada verify  no blueprint compiled yet — run 'ada compile' first",
    );
    // Exit 0: no blueprint is not an error — it's an uncompiled project.
    // Exit 1 would cause post-commit hooks to surface noisy failures.
    process.exit(0);
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

  // Write or clear .ada/drift.md — the persistent signal for the next session
  writeDriftFile(cwd, report);

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
