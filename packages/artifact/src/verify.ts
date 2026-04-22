import * as fs from "fs";
import * as path from "path";
import type {
  DistArtifact,
  Entrypoint,
  PackageVerification,
  EntrypointVerification,
  VerificationResult,
} from "./types.js";

interface PackageInput {
  name: string;
  distDir: string;
  packageJsonPath: string;
  isComposite?: boolean | undefined;
}

// ─── Artifact scanning ────────────────────────────────────────────────────────

function scanDistArtifact(pkg: PackageInput): DistArtifact {
  if (!fs.existsSync(pkg.distDir)) {
    return {
      owningPackage: pkg.name,
      distDir: pkg.distDir,
      jsFiles: [],
      declarationFiles: [],
      state: "absent",
    };
  }

  const jsFiles: string[] = [];
  const declarationFiles: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".d.ts")) {
        declarationFiles.push(full);
      } else if (entry.name.endsWith(".js")) {
        jsFiles.push(full);
      }
    }
  };
  walk(pkg.distDir);

  const state =
    jsFiles.length > 0 && declarationFiles.length > 0
      ? "complete"
      : jsFiles.length > 0 || declarationFiles.length > 0
        ? "partial"
        : "absent";

  return {
    owningPackage: pkg.name,
    distDir: pkg.distDir,
    jsFiles,
    declarationFiles,
    state,
  };
}

// ─── Package verification ─────────────────────────────────────────────────────

function verifyPackage(pkg: PackageInput): PackageVerification {
  const distArtifact = scanDistArtifact(pkg);
  const reasons: string[] = [];

  if (pkg.isComposite !== false) {
    if (distArtifact.jsFiles.length === 0) {
      reasons.push(`No .js files in ${pkg.distDir}`);
    }
    if (distArtifact.declarationFiles.length === 0) {
      reasons.push(`No .d.ts files in ${pkg.distDir}`);
    }
  }

  return {
    packageName: pkg.name,
    distArtifact,
    pass: reasons.length === 0,
    reasons,
  };
}

// ─── Entrypoint verification ──────────────────────────────────────────────────

export function verifyEntrypoint(
  entrypoint: Entrypoint,
): EntrypointVerification {
  const missing: string[] = [];

  if (!fs.existsSync(entrypoint.compiledJsPath)) {
    missing.push(`compiledJsPath does not exist: ${entrypoint.compiledJsPath}`);
  } else {
    const stat = fs.statSync(entrypoint.compiledJsPath);
    if (stat.size === 0) {
      missing.push(`compiledJsPath is empty: ${entrypoint.compiledJsPath}`);
    }
    if (entrypoint.kind === "cli" && !entrypoint.executableBit) {
      const mode = stat.mode;
      const isExecutable = (mode & 0o111) !== 0;
      if (!isExecutable) {
        missing.push(
          `CLI entrypoint missing executable bit: ${entrypoint.compiledJsPath}`,
        );
      }
    }
  }

  return {
    entrypoint: {
      ...entrypoint,
      state: missing.length === 0 ? "verified" : "missing",
    },
    valid: missing.length === 0,
    missing,
  };
}

// ─── Derive entrypoints from package.json ────────────────────────────────────

interface PackageJsonForEntrypoint {
  name?: string;
  main?: string;
  bin?: Record<string, string> | string;
}

function deriveEntrypoints(packages: PackageInput[]): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];

  for (const pkg of packages) {
    if (!fs.existsSync(pkg.packageJsonPath)) continue;
    const raw = JSON.parse(
      fs.readFileSync(pkg.packageJsonPath, "utf-8"),
    ) as PackageJsonForEntrypoint;

    const isMcpServer =
      raw.name === "@ada/mcp-server" || pkg.name === "@ada/mcp-server";
    const isCli =
      raw.name === "@motherlabs/ada" ||
      pkg.name === "@motherlabs/ada" ||
      typeof raw.bin === "object";

    if (isMcpServer && raw.main) {
      const compiledJsPath = path.resolve(
        path.dirname(pkg.packageJsonPath),
        raw.main,
      );
      entrypoints.push({
        kind: "mcp-server",
        owningPackage: pkg.name,
        compiledJsPath,
        mainFieldValue: raw.main,
        executableBit: false,
        state: "pending",
      });
    }

    if (isCli) {
      const binEntries =
        typeof raw.bin === "string"
          ? { ada: raw.bin }
          : typeof raw.bin === "object"
            ? raw.bin
            : {};
      for (const [, binPath] of Object.entries(binEntries)) {
        const compiledJsPath = path.resolve(
          path.dirname(pkg.packageJsonPath),
          binPath,
        );
        const stat = fs.existsSync(compiledJsPath)
          ? fs.statSync(compiledJsPath)
          : null;
        entrypoints.push({
          kind: "cli",
          owningPackage: pkg.name,
          compiledJsPath,
          mainFieldValue: binPath,
          executableBit: stat ? (stat.mode & 0o111) !== 0 : false,
          state: "pending",
        });
      }
    }
  }

  return entrypoints;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function verify(packages: PackageInput[]): VerificationResult {
  const packageResults = packages.map(verifyPackage);
  const entrypoints = deriveEntrypoints(packages);
  const entrypointResults = entrypoints.map(verifyEntrypoint);

  return {
    packages: packageResults,
    entrypoints: entrypointResults,
    allPass:
      packageResults.every((r) => r.pass) &&
      entrypointResults.every((r) => r.valid),
  };
}
