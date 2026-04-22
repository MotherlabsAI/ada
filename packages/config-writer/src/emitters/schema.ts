import type { EntityMap, Entity, BoundedContext } from "@ada/compiler";

export interface TypeScriptSchema {
  readonly entityName: string;
  readonly interfaceDeclaration: string; // full TS interface as string
  readonly zodSchema: string; // full Zod schema as string
}

// Map a raw type hint string to a TypeScript type string.
function mapToTSType(rawType: string): string {
  const t = rawType.toLowerCase().trim();
  if (t === "number" || t === "int" || t === "integer" || t === "float") {
    return "number";
  }
  if (t === "boolean" || t === "bool") {
    return "boolean";
  }
  if (t === "string" || t === "text" || t === "email" || t === "url") {
    return "string";
  }
  if (t === "date" || t === "datetime" || t === "timestamp") {
    return "Date";
  }
  // Unknown / object types — use string as a safe fallback in the interface.
  return "string";
}

// Map a raw type hint to a Zod primitive builder (without parentheses).
function mapToZodPrimitive(rawType: string): string {
  const t = rawType.toLowerCase().trim();
  if (t === "number" || t === "int" || t === "integer" || t === "float") {
    return "z.number()";
  }
  if (t === "boolean" || t === "bool") {
    return "z.boolean()";
  }
  if (t === "date" || t === "datetime" || t === "timestamp") {
    return "z.date()";
  }
  // Default: string
  return "z.string()";
}

// Convert an invariant description to a .refine() call if possible.
// Returns null when the invariant cannot be expressed as a refine.
function invariantToRefine(predicate: string): string | null {
  const p = predicate.toLowerCase();

  // "X must be non-empty" → check length > 0
  const nonEmptyMatch = /(\w+)\s+must\s+be\s+non-?empty/.exec(p);
  if (nonEmptyMatch) {
    const field = nonEmptyMatch[1] ?? "value";
    return `.refine(data => (data.${field}?.length ?? 0) > 0, { message: "${predicate}" })`;
  }

  // "X must be positive" → check > 0
  const positiveMatch = /(\w+)\s+must\s+be\s+positive/.exec(p);
  if (positiveMatch) {
    const field = positiveMatch[1] ?? "value";
    return `.refine(data => (data.${field} ?? 0) > 0, { message: "${predicate}" })`;
  }

  // "X must be greater than Y"
  const greaterMatch = /(\w+)\s+must\s+be\s+greater\s+than\s+(\d+)/.exec(p);
  if (greaterMatch) {
    const field = greaterMatch[1] ?? "value";
    const threshold = greaterMatch[2] ?? "0";
    return `.refine(data => (data.${field} ?? 0) > ${threshold}, { message: "${predicate}" })`;
  }

  // "X must be unique" — cannot verify at schema level without context
  // "X must not be null" → treated as required (handled by property.required)
  return null;
}

function emitEntity(entity: Entity): TypeScriptSchema {
  // ── TypeScript interface ────────────────────────────────────────────────────
  const propLines = entity.properties.map((p) => {
    const tsType = mapToTSType(p.type);
    const optMark = p.required ? "" : "?";
    return `  readonly ${p.name}${optMark}: ${tsType};`;
  });

  const interfaceDeclaration = [
    `export interface ${entity.name} {`,
    ...propLines,
    `}`,
  ].join("\n");

  // ── Zod schema ─────────────────────────────────────────────────────────────
  const zodFields = entity.properties.map((p) => {
    const base = mapToZodPrimitive(p.type);
    const optionalSuffix = p.required ? "" : ".optional()";
    return `  ${p.name}: ${base}${optionalSuffix},`;
  });

  const refines = entity.invariants
    .map((inv) => invariantToRefine(inv.predicate ?? inv.description))
    .filter((r): r is string => r !== null);

  const baseSchema = [
    `export const ${entity.name}Schema = z.object({`,
    ...zodFields,
    `})`,
  ].join("\n");

  const zodSchema =
    refines.length > 0
      ? baseSchema + "\n" + refines.join("\n") + ";"
      : baseSchema + ";";

  return {
    entityName: entity.name,
    interfaceDeclaration,
    zodSchema,
  };
}

function emitBoundedContextUnion(
  ctx: BoundedContext,
  allEntities: readonly Entity[],
): string {
  // Only include entities that belong to this context.
  const memberNames = ctx.entities.filter((name) =>
    allEntities.some((e) => e.name === name),
  );

  if (memberNames.length === 0) return "";

  const unionBody = memberNames.map((n) => `${n}Schema`).join(" | ");
  const safeCtxName = ctx.name.replace(/[^a-zA-Z0-9]/g, "_");
  return `export const ${safeCtxName}ContextSchema = z.union([${unionBody}] as const);`;
}

export function emitTypeScriptSchemas(
  entityMap: EntityMap,
): TypeScriptSchema[] {
  const results: TypeScriptSchema[] = [];

  for (const entity of entityMap.entities) {
    results.push(emitEntity(entity));
  }

  // Emit bounded-context union schemas as synthetic entries (appended to the
  // last entity's zodSchema section to avoid introducing a new return type).
  for (const ctx of entityMap.boundedContexts) {
    const union = emitBoundedContextUnion(ctx, entityMap.entities);
    if (!union) continue;

    const safeCtxName = ctx.name.replace(/[^a-zA-Z0-9]/g, "_");
    results.push({
      entityName: `${safeCtxName}Context`,
      interfaceDeclaration: `// Bounded context union: ${ctx.name}`,
      zodSchema: union,
    });
  }

  return results;
}
