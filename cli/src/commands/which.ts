import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { glyphs } from "../ui/design-system.js";

// ada which — report where ada would read/write things from the current
// invocation context. Pure informational; always exits 0.
export async function whichCommand(): Promise<void> {
  const cwd = process.cwd();
  const home = homedir();

  const projectAdaDir = join(cwd, ".ada");
  const stateFile = join(projectAdaDir, "state.json");
  const refFile = join(projectAdaDir, "ref");
  const manifestFile = join(projectAdaDir, "manifest.json");

  const globalStorage = join(home, ".ada", "storage.db");
  const globalConfig = join(home, ".ada", "config.json");
  const claudeConfig = join(home, ".claude", "settings.json");

  const gitRoot = findGitRoot(cwd);
  const binary = resolveBinary(process.argv[1]);

  const lines: Array<[label: string, path: string, checkExists: boolean]> = [
    ["cwd", cwd, true],
    [".ada/state.json", stateFile, true],
    [".ada/ref", refFile, true],
    [".ada/manifest.json", manifestFile, true],
    ["global storage", globalStorage, true],
    ["global config", globalConfig, true],
    ["claude config", claudeConfig, true],
    ["git repo", gitRoot ?? "(none)", gitRoot !== null],
    ["binary", binary, true],
  ];

  const chev = glyphs.chevron;
  for (const [label, path, checkExists] of lines) {
    if (checkExists) {
      const status = safeExists(path) ? "exists" : "missing";
      process.stdout.write(`${chev} ${label}: ${path} (${status})\n`);
    } else {
      process.stdout.write(`${chev} ${label}: ${path}\n`);
    }
  }
}

function safeExists(p: string): boolean {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

function findGitRoot(start: string): string | null {
  try {
    let dir = resolve(start);
    // Walk up until we hit a .git entry or reach the filesystem root.
    while (true) {
      const candidate = join(dir, ".git");
      if (safeExists(candidate)) {
        return dir;
      }
      const parent = dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  } catch {
    return null;
  }
}

function resolveBinary(argv1: string | undefined): string {
  if (!argv1) return "(unknown)";
  try {
    const abs = resolve(argv1);
    // If it's a symlink, statSync follows it; we just return the absolute path
    // the OS actually invoked, which is what `argv[1]` resolves to on disk.
    try {
      statSync(abs);
    } catch {
      // path may not exist (e.g. bundled runtime); still report resolved form.
    }
    return abs;
  } catch {
    return argv1;
  }
}
