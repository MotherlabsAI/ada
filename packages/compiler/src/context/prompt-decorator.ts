import type { CodebaseContext, PriorBlueprintContext } from "./types.js";
import type { CompilerStageCode } from "../types.js";

export function decorateWithContext(
  prompt: string,
  ctx: CodebaseContext,
  stage: CompilerStageCode,
  prior?: PriorBlueprintContext,
): string {
  let result = prompt;
  switch (stage) {
    case "INT":
      result += formatVocabulary(ctx);
      if (prior) result += formatPriorBlueprint(prior, "INT");
      break;
    case "ENT":
      result += formatTypeRegistry(ctx);
      break;
    case "SYN":
      result += formatPackageBoundaries(ctx);
      if (prior) result += formatPriorBlueprint(prior, "SYN");
      break;
    default:
      break;
  }
  return result;
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

function formatPriorBlueprint(
  prior: PriorBlueprintContext,
  stage: "INT" | "SYN",
): string {
  let section =
    "\n\n--- PRIOR BLUEPRINT (already compiled — your output must EXTEND this, not replace it) ---\n";
  section += `Existing summary: ${prior.summary}\n`;

  if (stage === "INT") {
    if (prior.goals.length > 0) {
      section += `Existing goals (preserve these, add new ones):\n`;
      for (const g of prior.goals) {
        section += `  - ${g.description}\n`;
      }
    }
    if (prior.constraints.length > 0) {
      section += `Existing constraints (preserve these):\n`;
      for (const c of prior.constraints) {
        section += `  - ${c.description}\n`;
      }
    }
    if (prior.excludedConcerns.length > 0) {
      section += `Already excluded (do not re-introduce): ${prior.excludedConcerns.join(", ")}\n`;
    }
    section +=
      "Instruction: extract goals from the NEW intent above. Include all existing goals plus any new ones the new intent adds. Do not drop existing goals.\n";
  }

  if (stage === "SYN") {
    section += `Existing architecture: ${prior.architecturePattern}\n`;
    if (prior.components.length > 0) {
      section += `Existing components (keep these, add new ones as needed):\n`;
      for (const c of prior.components) {
        section += `  - ${c.name} (${c.boundedContext}): ${c.responsibility}\n`;
      }
    }
    section +=
      "Instruction: produce an architecture that includes all existing components plus any new components required by the new intent. Do not remove existing components unless they directly conflict with the new intent.\n";
  }

  section += "--- END PRIOR BLUEPRINT ---";
  return section;
}
