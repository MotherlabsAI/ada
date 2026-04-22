import * as fs from "fs";
import * as path from "path";
import type { TsConfig, ProjectReference } from "./types.js";

interface RawTsConfig {
  compilerOptions?: {
    composite?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    incremental?: boolean;
    outDir?: string;
    rootDir?: string;
  };
  references?: Array<{ path: string }>;
}

export function deriveBuildContract(tsConfigPath: string): TsConfig {
  if (!fs.existsSync(tsConfigPath)) {
    throw new Error(`tsconfig.json not found at ${tsConfigPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(tsConfigPath, "utf-8")) as RawTsConfig;
  const opts = raw.compilerOptions ?? {};
  const dir = path.dirname(tsConfigPath);

  const projectReferences: ProjectReference[] = (raw.references ?? []).map(
    (ref) => ({
      referencingTsConfig: tsConfigPath,
      referencedTsConfigPath: path.resolve(dir, ref.path),
    }),
  );

  return {
    filePath: tsConfigPath,
    composite: opts.composite === true,
    declaration: opts.declaration !== false,
    declarationMap: opts.declarationMap !== false,
    incremental: opts.incremental !== false,
    outDir: opts.outDir
      ? path.resolve(dir, opts.outDir)
      : path.join(dir, "dist"),
    rootDir: opts.rootDir
      ? path.resolve(dir, opts.rootDir)
      : path.join(dir, "src"),
    projectReferences,
  };
}

export interface ContractViolation {
  tsConfigPath: string;
  field: string;
  expected: string;
  actual: string;
}

export function validateBuildContracts(
  tsConfigPaths: string[],
): ContractViolation[] {
  const violations: ContractViolation[] = [];
  const allTsConfigs = tsConfigPaths.filter((p) => fs.existsSync(p));
  const allPaths = new Set(allTsConfigs.map((p) => path.resolve(p)));

  for (const tsConfigPath of allTsConfigs) {
    const contract = deriveBuildContract(tsConfigPath);

    if (!contract.composite) {
      violations.push({
        tsConfigPath,
        field: "composite",
        expected: "true",
        actual: "false",
      });
    }

    for (const ref of contract.projectReferences) {
      const resolvedRef = ref.referencedTsConfigPath.endsWith(".json")
        ? ref.referencedTsConfigPath
        : path.join(ref.referencedTsConfigPath, "tsconfig.json");

      if (!allPaths.has(path.resolve(resolvedRef))) {
        violations.push({
          tsConfigPath,
          field: "references",
          expected: `${resolvedRef} exists in workspace`,
          actual: "dangling reference",
        });
      }
    }
  }

  return violations;
}
