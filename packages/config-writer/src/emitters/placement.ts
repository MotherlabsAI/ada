import type { Blueprint } from "@ada/compiler";

export interface PlacementEntry {
  readonly path: string; // relative path e.g. "src/domain/user.ts"
  readonly purpose: string; // one-line description
  readonly componentName: string; // which blueprint component owns this
  readonly boundedContext: string;
  readonly type: "source" | "test" | "config" | "doc";
}

export interface PlacementMap {
  readonly generatedAt: number;
  readonly projectName: string;
  readonly entries: readonly PlacementEntry[];
}

// Derive a safe directory segment from a string (lowercase, hyphens).
function toPathSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function emitPlacementMap(blueprint: Blueprint): PlacementMap {
  const entries: PlacementEntry[] = [];

  // ── Root config files ──────────────────────────────────────────────────────
  const rootConfigs: Array<{
    path: string;
    purpose: string;
    type: PlacementEntry["type"];
  }> = [
    {
      path: "package.json",
      purpose: "Package manifest — name, version, scripts, dependencies",
      type: "config",
    },
    {
      path: "tsconfig.json",
      purpose: "TypeScript compiler configuration",
      type: "config",
    },
    {
      path: "README.md",
      purpose: "Project overview and getting-started instructions",
      type: "doc",
    },
  ];

  for (const cfg of rootConfigs) {
    entries.push({
      path: cfg.path,
      purpose: cfg.purpose,
      componentName: "root",
      boundedContext: "root",
      type: cfg.type,
    });
  }

  // ── Derive from build.fileTree if present ──────────────────────────────────
  if (blueprint.build && blueprint.build.fileTree.length > 0) {
    for (const node of blueprint.build.fileTree) {
      if (node.type !== "file") continue;

      // Classify entry type from path extension and naming conventions.
      let entryType: PlacementEntry["type"] = "source";
      const p = node.path.toLowerCase();
      if (
        p.endsWith(".test.ts") ||
        p.endsWith(".spec.ts") ||
        p.endsWith(".test.js") ||
        p.endsWith(".spec.js")
      ) {
        entryType = "test";
      } else if (
        p.endsWith(".json") ||
        p.endsWith(".yaml") ||
        p.endsWith(".yml") ||
        p.endsWith(".env") ||
        p.endsWith(".toml")
      ) {
        entryType = "config";
      } else if (p.endsWith(".md") || p.endsWith(".txt")) {
        entryType = "doc";
      }

      entries.push({
        path: node.path,
        purpose: node.purpose,
        componentName: node.componentName ?? "unknown",
        boundedContext: node.boundedContext ?? "unknown",
        type: entryType,
      });
    }
  } else {
    // ── Fallback: derive from blueprint components ────────────────────────────
    for (const comp of blueprint.architecture.components) {
      const ctxDir = toPathSegment(comp.boundedContext);
      const compFile = toPathSegment(comp.name);

      // Source file
      entries.push({
        path: `src/${ctxDir}/${compFile}.ts`,
        purpose: comp.responsibility,
        componentName: comp.name,
        boundedContext: comp.boundedContext,
        type: "source",
      });

      // Test file
      entries.push({
        path: `src/${ctxDir}/${compFile}.test.ts`,
        purpose: `Unit tests for ${comp.name}`,
        componentName: comp.name,
        boundedContext: comp.boundedContext,
        type: "test",
      });
    }
  }

  const projectName =
    blueprint.summary.split(".")[0]?.trim() ?? "compiled-project";

  return {
    generatedAt: Date.now(),
    projectName,
    entries,
  };
}
