// ═══════════════════════════════════════════════════════════════════════════════
// ADA — clean command
// Removes ada-generated artifacts from the current directory.
// ═══════════════════════════════════════════════════════════════════════════════

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { glyphs } from "../ui/design-system.js";

type TargetKind = "dir" | "file";

interface Target {
  readonly path: string;
  readonly kind: TargetKind;
  readonly label: string;
}

const ADA_MARKERS_CLAUDE_MD = [
  "<!-- ada-generated -->",
  "## Status: GHOST",
];
const ADA_MARKER_POST_COMMIT = "# ada-verify";

function exists(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function fileContainsAny(p: string, markers: readonly string[]): boolean {
  try {
    const content = fs.readFileSync(p, "utf8");
    return markers.some((m) => content.includes(m));
  } catch {
    return false;
  }
}

function collectTargets(cwd: string): Target[] {
  const targets: Target[] = [];

  const adaDir = path.join(cwd, ".ada");
  const adaDirExists = exists(adaDir) && isDir(adaDir);

  // Always safe to remove when present
  if (adaDirExists) {
    targets.push({ path: adaDir, kind: "dir", label: ".ada/" });
  }

  const preToolDir = path.join(cwd, "hooks", "pre-tool");
  if (exists(preToolDir) && isDir(preToolDir)) {
    targets.push({ path: preToolDir, kind: "dir", label: "hooks/pre-tool/" });
  }

  const sessionStart = path.join(cwd, "hooks", "session-start.sh");
  if (exists(sessionStart) && !isDir(sessionStart)) {
    targets.push({
      path: sessionStart,
      kind: "file",
      label: "hooks/session-start.sh",
    });
  }

  // CLAUDE.md — only if it carries an ada marker
  const claudeMd = path.join(cwd, "CLAUDE.md");
  if (
    exists(claudeMd) &&
    !isDir(claudeMd) &&
    fileContainsAny(claudeMd, ADA_MARKERS_CLAUDE_MD)
  ) {
    targets.push({ path: claudeMd, kind: "file", label: "CLAUDE.md" });
  }

  // post-commit hook — only if it contains the ada-verify marker
  const postCommit = path.join(cwd, ".git", "hooks", "post-commit");
  if (
    exists(postCommit) &&
    !isDir(postCommit) &&
    fileContainsAny(postCommit, [ADA_MARKER_POST_COMMIT])
  ) {
    targets.push({
      path: postCommit,
      kind: "file",
      label: ".git/hooks/post-commit",
    });
  }

  // .claude/* — only if .ada/ exists (signals ada-compiled directory)
  if (adaDirExists) {
    const agentsDir = path.join(cwd, ".claude", "agents");
    if (exists(agentsDir) && isDir(agentsDir)) {
      targets.push({
        path: agentsDir,
        kind: "dir",
        label: ".claude/agents/",
      });
    }

    const skillsDir = path.join(cwd, ".claude", "skills");
    if (exists(skillsDir) && isDir(skillsDir)) {
      targets.push({
        path: skillsDir,
        kind: "dir",
        label: ".claude/skills/",
      });
    }

    const settings = path.join(cwd, ".claude", "settings.json");
    if (exists(settings) && !isDir(settings)) {
      targets.push({
        path: settings,
        kind: "file",
        label: ".claude/settings.json",
      });
    }
  }

  return targets;
}

function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

function removeTarget(target: Target): void {
  fs.rmSync(target.path, { recursive: true, force: true });
  process.stdout.write(`${glyphs.chevron} removed ${target.label}\n`);
}

export async function cleanCommand(flags: Set<string>): Promise<void> {
  const force = flags.has("--force") || flags.has("-y");
  const dryRun = flags.has("--dry-run");

  const cwd = process.cwd();
  const targets = collectTargets(cwd);

  if (targets.length === 0) {
    process.stdout.write(
      `${glyphs.chevron} nothing to clean — no ada artifacts found\n`,
    );
    return;
  }

  process.stdout.write(
    `${glyphs.chevron} ada artifacts in ${cwd}:\n`,
  );
  for (const t of targets) {
    process.stdout.write(`  ${glyphs.chevron} ${t.label}\n`);
  }

  if (dryRun) {
    process.stdout.write(
      `${glyphs.chevron} dry-run — no files removed\n`,
    );
    return;
  }

  if (!force) {
    const ok = await confirm("Remove these? (y/N) ");
    if (!ok) {
      process.stdout.write(`${glyphs.chevron} aborted\n`);
      return;
    }
  }

  for (const t of targets) {
    try {
      removeTarget(t);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `${glyphs.chevron} failed to remove ${t.label}: ${msg}\n`,
      );
    }
  }
}
