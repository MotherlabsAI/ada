import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";
import type { BuildResult, BuildError, TsBuildInfo } from "./types.js";

// ─── Parse tsc error output ───────────────────────────────────────────────────

const TSC_ERROR_RE = /^(.+)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)$/;

function parseErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];
  for (const line of output.split("\n")) {
    const m = TSC_ERROR_RE.exec(line.trim());
    if (m) {
      errors.push({
        filePath: m[1] ?? null,
        line: m[2] ? parseInt(m[2], 10) : null,
        column: m[3] ? parseInt(m[3], 10) : null,
        message: m[4] ?? line,
      });
    }
  }
  return errors;
}

// ─── Clean stale artifacts ────────────────────────────────────────────────────

export function cleanStaleArtifacts(distDirs: string[]): void {
  for (const distDir of distDirs) {
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  }
}

// ─── Invoke composite build ───────────────────────────────────────────────────

export function invokeCompositeBuild(
  rootTsConfigPath: string,
  options: { clean: boolean; incremental: boolean },
): BuildResult {
  if (!fs.existsSync(rootTsConfigPath)) {
    return {
      exitCode: 1,
      errors: [
        {
          filePath: null,
          line: null,
          column: null,
          message: `Root tsconfig not found: ${rootTsConfigPath}`,
        },
      ],
      stdout: "",
      stderr: `Root tsconfig not found: ${rootTsConfigPath}`,
    };
  }

  const args = ["tsc", "-b", rootTsConfigPath];
  if (options.clean) args.push("--clean");
  if (!options.incremental) args.push("--force");

  const result = spawnSync("npx", args, {
    cwd: path.dirname(rootTsConfigPath),
    encoding: "utf-8",
    timeout: 120_000,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = stdout + stderr;
  const exitCode = result.status ?? 1;

  const errors = parseErrors(combined);

  return { exitCode, errors, stdout, stderr };
}

// ─── Get build status ─────────────────────────────────────────────────────────

export function getBuildStatus(
  packages: Array<{ name: string; distDir: string }>,
): TsBuildInfo[] {
  return packages.map((pkg) => {
    const tsBuildInfoPath = path.join(pkg.distDir, ".tsbuildinfo");
    const altPath =
      pkg.distDir.replace(/\/dist$/, "") + "/tsconfig.tsbuildinfo";

    const candidate = fs.existsSync(tsBuildInfoPath)
      ? tsBuildInfoPath
      : fs.existsSync(altPath)
        ? altPath
        : null;

    if (!candidate) {
      return {
        filePath: tsBuildInfoPath,
        packageName: pkg.name,
        state: "absent" as const,
        lastBuildTimestamp: 0,
      };
    }

    try {
      const stat = fs.statSync(candidate);
      return {
        filePath: candidate,
        packageName: pkg.name,
        state: "current" as const,
        lastBuildTimestamp: stat.mtimeMs,
      };
    } catch {
      return {
        filePath: candidate,
        packageName: pkg.name,
        state: "corrupt" as const,
        lastBuildTimestamp: 0,
      };
    }
  });
}

// ─── Resolve tsc binary ───────────────────────────────────────────────────────

export function resolveTsc(cwd: string): string {
  try {
    return execSync("which tsc", { cwd, encoding: "utf-8" }).trim();
  } catch {
    return "tsc";
  }
}
