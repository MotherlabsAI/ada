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

export function analyzeCodebase(projectRoot: string): CodebaseContext {
  const packagesDir = path.join(projectRoot, "packages");
  if (!fs.existsSync(packagesDir)) {
    const postcode = generatePostcode("CTX", "empty");
    return {
      typeRegistry: [],
      vocabulary: [],
      constants: [],
      packageBoundaries: [],
      postcode,
    };
  }

  const allTypes: TypeRegistryEntry[] = [];
  const allConstants: ConstantEntry[] = [];
  const boundaries: PackageBoundary[] = [];

  const packageDirs = fs.readdirSync(packagesDir).filter((d) => {
    const pkgJson = path.join(packagesDir, d, "package.json");
    return fs.existsSync(pkgJson);
  });

  for (const pkgDir of packageDirs) {
    const pkgJsonPath = path.join(packagesDir, pkgDir, "package.json");
    let pkgName = `@ada/${pkgDir}`;
    let deps: string[] = [];

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      if (typeof pkg["name"] === "string") pkgName = pkg["name"];
      const rawDeps = pkg["dependencies"] as Record<string, string> | undefined;
      if (rawDeps) {
        deps = Object.keys(rawDeps).filter((d) => d.startsWith("@ada/"));
      }
    } catch {
      /* skip malformed */
    }

    const srcDir = path.join(packagesDir, pkgDir, "src");
    const tsFiles = walkTs(srcDir);
    const pkgTypes: string[] = [];

    for (const filePath of tsFiles) {
      const source = fs.readFileSync(filePath, "utf8");
      const relPath = path.relative(projectRoot, filePath);

      const types = extractTypes(source, relPath, pkgName);
      allTypes.push(...types);
      pkgTypes.push(...types.map((t) => t.name));

      const constants = extractConstants(source, relPath, pkgName);
      allConstants.push(...constants);
    }

    boundaries.push({ name: pkgName, types: pkgTypes, dependencies: deps });
  }

  // Vocabulary: unique type names, sorted
  const vocabulary = [...new Set(allTypes.map((t) => t.name))].sort();

  // Generate postcode from content hash
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
