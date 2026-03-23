import type { CodebaseContext } from "./types.js";
import type { CompilerStageCode } from "../types.js";

export function decorateWithContext(
  prompt: string,
  ctx: CodebaseContext,
  stage: CompilerStageCode,
): string {
  switch (stage) {
    case "INT":
      return prompt + formatVocabulary(ctx);
    case "ENT":
      return prompt + formatTypeRegistry(ctx);
    case "SYN":
      return prompt + formatPackageBoundaries(ctx);
    default:
      return prompt;
  }
}

function formatVocabulary(ctx: CodebaseContext): string {
  if (ctx.vocabulary.length === 0) return "";
  const names = ctx.vocabulary.join(", ");
  const consts = ctx.constants.map((c) => `${c.name} = ${c.value}`).join(", ");

  let section =
    "\n\n--- CODEBASE VOCABULARY (these names already exist in the codebase — use them, do not invent new names) ---\n";
  section += `Types: ${names}\n`;
  if (consts) section += `Constants: ${consts}\n`;
  section += "--- END CODEBASE VOCABULARY ---";
  return section;
}

function formatTypeRegistry(ctx: CodebaseContext): string {
  if (ctx.typeRegistry.length === 0) return "";

  let section =
    "\n\n--- CODEBASE TYPE REGISTRY (these types exist with these fields — reference them, do not reinvent) ---\n";
  for (const entry of ctx.typeRegistry) {
    if (entry.kind === "interface" && entry.fields.length > 0) {
      const fields = entry.fields
        .map((f) => `  ${f.name}: ${f.type}`)
        .join("\n");
      section += `${entry.name} (${entry.sourcePackage}):\n${fields}\n\n`;
    } else {
      section += `${entry.name} (${entry.kind}, ${entry.sourcePackage})\n`;
    }
  }
  section += "--- END CODEBASE TYPE REGISTRY ---";
  return section;
}

function formatPackageBoundaries(ctx: CodebaseContext): string {
  if (ctx.packageBoundaries.length === 0) return "";

  let section =
    "\n\n--- PACKAGE BOUNDARIES (these packages exist with these exports and dependencies) ---\n";
  for (const pkg of ctx.packageBoundaries) {
    const types =
      pkg.types.length > 0 ? pkg.types.join(", ") : "(no exported types)";
    const deps =
      pkg.dependencies.length > 0
        ? ` → depends on: ${pkg.dependencies.join(", ")}`
        : "";
    section += `${pkg.name}: ${types}${deps}\n`;
  }
  section += "--- END PACKAGE BOUNDARIES ---";
  return section;
}
