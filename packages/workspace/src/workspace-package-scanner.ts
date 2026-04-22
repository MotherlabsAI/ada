import * as fs from "fs";
import * as path from "path";
import type {
  WorkspaceRoot,
  WorkspacePackage,
  PackageDependencyEdge,
} from "./types.js";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface TsConfigJson {
  compilerOptions?: {
    composite?: boolean;
    outDir?: string;
    rootDir?: string;
  };
}

function parsePnpmWorkspaceYaml(content: string): string[] {
  const patterns: string[] = [];
  let inPackages = false;
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "packages:") {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (trimmed.startsWith("- ")) {
        const raw = trimmed.slice(2).replace(/^["']|["']$/g, "");
        patterns.push(raw);
      } else if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        break;
      }
    }
  }
  return patterns;
}

function expandGlob(rootPath: string, pattern: string): string[] {
  if (pattern.endsWith("/*")) {
    const dir = path.join(rootPath, pattern.slice(0, -2));
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(dir, d.name));
  }
  if (pattern.endsWith("/**")) {
    const base = path.join(rootPath, pattern.slice(0, -3));
    if (!fs.existsSync(base)) return [];
    const results: string[] = [];
    const walk = (dir: string) => {
      results.push(dir);
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(dir, entry.name));
      }
    };
    walk(base);
    return results;
  }
  const resolved = path.join(rootPath, pattern);
  return fs.existsSync(resolved) ? [resolved] : [];
}

export function scanWorkspacePackages(rootPath: string): {
  root: WorkspaceRoot;
  packages: WorkspacePackage[];
  edges: PackageDependencyEdge[];
} {
  const workspaceFile = path.join(rootPath, "pnpm-workspace.yaml");
  if (!fs.existsSync(workspaceFile)) {
    throw new Error(`pnpm-workspace.yaml not found at ${workspaceFile}`);
  }

  const content = fs.readFileSync(workspaceFile, "utf-8");
  const patterns = parsePnpmWorkspaceYaml(content);

  const packageDirs = patterns.flatMap((p) => expandGlob(rootPath, p));

  const packages: WorkspacePackage[] = [];
  for (const dir of packageDirs) {
    const pkgJsonPath = path.join(dir, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;

    const pkgJson = JSON.parse(
      fs.readFileSync(pkgJsonPath, "utf-8"),
    ) as PackageJson;
    if (!pkgJson.name) continue;

    const tsConfigPath = path.join(dir, "tsconfig.json");
    let isComposite = false;
    if (fs.existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(
        fs.readFileSync(tsConfigPath, "utf-8"),
      ) as TsConfigJson;
      isComposite = tsConfig.compilerOptions?.composite === true;
    }

    packages.push({
      name: pkgJson.name,
      packageJsonPath: pkgJsonPath,
      tsConfigPath,
      srcDir: path.join(dir, "src"),
      distDir: path.join(dir, "dist"),
      internalDependencies: [],
      isComposite,
    });
  }

  const packageNames = new Set(packages.map((p) => p.name));
  const edges: PackageDependencyEdge[] = [];

  for (const pkg of packages) {
    const pkgJson = JSON.parse(
      fs.readFileSync(pkg.packageJsonPath, "utf-8"),
    ) as PackageJson;
    const allDeps = {
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
    };

    const internalDeps: string[] = [];
    for (const [depName, versionSpec] of Object.entries(allDeps)) {
      if (packageNames.has(depName) && versionSpec.startsWith("workspace:")) {
        internalDeps.push(depName);
        edges.push({
          fromPackage: pkg.name,
          toPackage: depName,
          protocol: "workspace:",
          versionSpec,
        });
      }
    }
    pkg.internalDependencies = internalDeps;
  }

  const root: WorkspaceRoot = {
    rootPath,
    pnpmWorkspaceFile: workspaceFile,
    packageNames: packages.map((p) => p.name),
  };

  return { root, packages, edges };
}
