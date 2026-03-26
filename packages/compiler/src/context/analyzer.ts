import * as fs from "fs";
import * as path from "path";
import { generatePostcode } from "@ada/provenance";
import type {
  CodebaseContext,
  TypeRegistryEntry,
  TypeField,
  ConstantEntry,
  PackageBoundary,
} from "./types.js";

function walkTs(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTs(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      results.push(full);
    }
  }
  return results;
}

function extractTypes(
  source: string,
  sourcePath: string,
  sourcePackage: string,
): TypeRegistryEntry[] {
  const entries: TypeRegistryEntry[] = [];

  // Match exported interfaces with their field blocks
  const interfaceRe =
    /export\s+interface\s+(\w+)(?:\s+extends\s+\w+(?:\s*,\s*\w+)*)?\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = interfaceRe.exec(source)) !== null) {
    const name = match[1]!;
    const body = match[2]!;
    const fields = extractFields(body);
    entries.push({
      name,
      kind: "interface",
      fields,
      sourcePackage,
      sourcePath,
    });
  }

  // Match exported type aliases (no field extraction for aliases)
  const typeRe = /export\s+type\s+(\w+)\s*=/g;
  while ((match = typeRe.exec(source)) !== null) {
    const name = match[1]!;
    entries.push({ name, kind: "type", fields: [], sourcePackage, sourcePath });
  }

  return entries;
}

function extractFields(body: string): TypeField[] {
  const fields: TypeField[] = [];
  const fieldRe = /readonly\s+(\w+)\s*[?]?\s*:\s*([^;]+)/g;
  let match: RegExpExecArray | null;
  while ((match = fieldRe.exec(body)) !== null) {
    fields.push({ name: match[1]!, type: match[2]!.trim() });
  }
  return fields;
}

function extractConstants(
  source: string,
  sourcePath: string,
  sourcePackage: string,
): ConstantEntry[] {
  const entries: ConstantEntry[] = [];
  const constRe = /export\s+const\s+(\w+)\s*=\s*([^;]+)/g;
  let match: RegExpExecArray | null;
  while ((match = constRe.exec(source)) !== null) {
    const name = match[1]!;
    const value = match[2]!.trim();
    // Skip function declarations and class-like expressions
    if (
      value.startsWith("(") ||
      value.startsWith("new ") ||
      value.startsWith("function")
    )
      continue;
    entries.push({ name, value, sourcePackage, sourcePath });
  }
  return entries;
}

function scanPackage(
  pkgRoot: string,
  pkgName: string,
  projectRoot: string,
): { types: TypeRegistryEntry[]; constants: ConstantEntry[]; deps: string[] } {
  // Try src/ first, then the package root itself
  const srcDir = path.join(pkgRoot, "src");
  const tsFiles = fs.existsSync(srcDir) ? walkTs(srcDir) : walkTs(pkgRoot);

  const types: TypeRegistryEntry[] = [];
  const constants: ConstantEntry[] = [];
  let deps: string[] = [];

  // Read deps from package.json if present
  const pkgJsonPath = path.join(pkgRoot, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      const rawDeps = pkg["dependencies"] as Record<string, string> | undefined;
      const rawDev = pkg["devDependencies"] as
        | Record<string, string>
        | undefined;
      const all = { ...rawDeps, ...rawDev };
      deps = Object.keys(all).filter(
        (d) => !d.startsWith("@types/") && !d.startsWith("typescript"),
      );
    } catch {
      /* skip malformed */
    }
  }

  for (const filePath of tsFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(projectRoot, filePath);
    types.push(...extractTypes(source, relPath, pkgName));
    constants.push(...extractConstants(source, relPath, pkgName));
  }

  return { types, constants, deps };
}

function resolveProjectName(projectRoot: string): string {
  const pkgJsonPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      if (typeof pkg["name"] === "string" && pkg["name"]) return pkg["name"];
    } catch {
      /* skip */
    }
  }
  return path.basename(projectRoot);
}

export function analyzeCodebase(projectRoot: string): CodebaseContext {
  const packagesDir = path.join(projectRoot, "packages");

  const monorepoPackages = fs.existsSync(packagesDir)
    ? fs.readdirSync(packagesDir).filter((d) => {
        const p = path.join(packagesDir, d, "package.json");
        return (
          fs.existsSync(p) &&
          fs.statSync(path.join(packagesDir, d)).isDirectory()
        );
      })
    : [];

  const allTypes: TypeRegistryEntry[] = [];
  const allConstants: ConstantEntry[] = [];
  const boundaries: PackageBoundary[] = [];

  if (monorepoPackages.length > 0) {
    // ── Monorepo path: scan each package under packages/ ──────────────────
    for (const pkgDir of monorepoPackages) {
      const pkgRoot = path.join(packagesDir, pkgDir);
      const pkgJsonPath = path.join(pkgRoot, "package.json");
      let pkgName = `${pkgDir}`;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as Record<
          string,
          unknown
        >;
        if (typeof pkg["name"] === "string") pkgName = pkg["name"];
      } catch {
        /* skip */
      }

      const { types, constants, deps } = scanPackage(
        pkgRoot,
        pkgName,
        projectRoot,
      );
      allTypes.push(...types);
      allConstants.push(...constants);
      boundaries.push({
        name: pkgName,
        types: types.map((t) => t.name),
        dependencies: deps.filter((d) =>
          monorepoPackages.some((p) => d.includes(p)),
        ),
      });
    }
  } else {
    // ── Standalone project: scan src/, app/, lib/, then root .ts files ────
    const projectName = resolveProjectName(projectRoot);
    const candidateDirs = ["src", "app", "lib", "pages", "components"].map(
      (d) => path.join(projectRoot, d),
    );

    const dirsToScan = candidateDirs.filter(
      (d) => fs.existsSync(d) && fs.statSync(d).isDirectory(),
    );

    // Fall back to root-level .ts files if no standard dirs found
    if (dirsToScan.length === 0) {
      const rootTs = fs
        .readdirSync(projectRoot)
        .filter(
          (f) =>
            f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "node_modules",
        )
        .map((f) => path.join(projectRoot, f));

      for (const filePath of rootTs) {
        const source = fs.readFileSync(filePath, "utf8");
        const relPath = path.relative(projectRoot, filePath);
        allTypes.push(...extractTypes(source, relPath, projectName));
        allConstants.push(...extractConstants(source, relPath, projectName));
      }
    } else {
      for (const dir of dirsToScan) {
        for (const filePath of walkTs(dir)) {
          const source = fs.readFileSync(filePath, "utf8");
          const relPath = path.relative(projectRoot, filePath);
          allTypes.push(...extractTypes(source, relPath, projectName));
          allConstants.push(...extractConstants(source, relPath, projectName));
        }
      }
    }

    if (allTypes.length > 0 || allConstants.length > 0) {
      const { deps } = scanPackage(projectRoot, projectName, projectRoot);
      boundaries.push({
        name: projectName,
        types: allTypes.map((t) => t.name),
        dependencies: deps,
      });
    }
  }

  if (allTypes.length === 0 && allConstants.length === 0) {
    const postcode = generatePostcode("CTX", "empty");
    return {
      typeRegistry: [],
      vocabulary: [],
      constants: [],
      packageBoundaries: [],
      postcode,
    };
  }

  // Vocabulary: unique type names, sorted
  const vocabulary = [...new Set(allTypes.map((t) => t.name))].sort();

  const contentForHash = JSON.stringify({
    vocabulary,
    constants: allConstants.map((c) => c.name),
  });
  const postcode = generatePostcode("CTX", contentForHash);

  return {
    typeRegistry: allTypes,
    vocabulary,
    constants: allConstants,
    packageBoundaries: boundaries,
    postcode,
  };
}
