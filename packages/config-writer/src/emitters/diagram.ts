import type { Blueprint, Entity } from "@ada/compiler";

export interface MermaidDiagram {
  readonly title: string;
  readonly type: "erDiagram" | "graph" | "sequenceDiagram";
  readonly content: string; // full Mermaid syntax
}

// Sanitize a name so it is safe to use as a Mermaid identifier.
function mermaidId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

// Infer a one-to-many relationship when an entity property's type matches
// another entity's name (case-insensitive).
function inferRelationships(
  entities: readonly Entity[],
): Array<{ from: string; to: string; label: string }> {
  const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));
  const rels: Array<{ from: string; to: string; label: string }> = [];

  for (const entity of entities) {
    for (const prop of entity.properties) {
      const typeKey = prop.type.toLowerCase().replace(/\[\]$/, "").trim();
      if (entityNames.has(typeKey) && typeKey !== entity.name.toLowerCase()) {
        // Find the canonical cased name.
        const target = entities.find((e) => e.name.toLowerCase() === typeKey);
        if (target) {
          rels.push({
            from: entity.name,
            to: target.name,
            label: prop.name,
          });
        }
      }
    }
  }

  return rels;
}

export function emitERDiagram(blueprint: Blueprint): MermaidDiagram {
  const entities = blueprint.dataModel.entities;
  const lines: string[] = ["erDiagram"];

  // Emit entity blocks.
  for (const entity of entities) {
    const id = mermaidId(entity.name);
    lines.push(`  ${id} {`);
    for (const prop of entity.properties) {
      // Mermaid ER type must be a single word — use the raw type, sanitized.
      const mType = prop.type.replace(/[^a-zA-Z0-9_[\]]/g, "_") || "string";
      const propId = mermaidId(prop.name);
      lines.push(`    ${mType} ${propId}`);
    }
    lines.push(`  }`);
  }

  // Emit relationships.
  const rels = inferRelationships(entities);
  for (const rel of rels) {
    const from = mermaidId(rel.from);
    const to = mermaidId(rel.to);
    const label = mermaidId(rel.label);
    // one-to-many: from has many to via the property
    lines.push(`  ${from} ||--o{ ${to} : "${label}"`);
  }

  // Also emit bounded-context root relationships if root entity differs from
  // member entities.
  for (const ctx of blueprint.dataModel.boundedContexts) {
    const root = mermaidId(ctx.rootEntity);
    for (const member of ctx.entities) {
      if (member !== ctx.rootEntity) {
        const memberId = mermaidId(member);
        // Guard: only emit if both exist in our entity list.
        const rootExists = entities.some((e) => e.name === ctx.rootEntity);
        const memberExists = entities.some((e) => e.name === member);
        if (rootExists && memberExists) {
          // Avoid duplicating rels already inferred above.
          const alreadyEmitted = rels.some(
            (r) => r.from === ctx.rootEntity && r.to === member,
          );
          if (!alreadyEmitted) {
            lines.push(`  ${root} ||--o{ ${memberId} : "contains"`);
          }
        }
      }
    }
  }

  return {
    title: `${blueprint.summary.split(".")[0] ?? "Project"} — Entity Relationship Diagram`,
    type: "erDiagram",
    content: lines.join("\n"),
  };
}

export function emitArchitectureDiagram(blueprint: Blueprint): MermaidDiagram {
  const components = blueprint.architecture.components;
  const lines: string[] = ["graph TD"];

  // Node declarations with labels.
  for (const comp of components) {
    const id = mermaidId(comp.name);
    // Escape double-quotes in responsibility text.
    const label = comp.responsibility.replace(/"/g, "'").slice(0, 60);
    lines.push(`  ${id}["${comp.name}\\n${label}"]`);
  }

  // Dependency edges.
  for (const comp of components) {
    const fromId = mermaidId(comp.name);
    for (const dep of comp.dependencies) {
      // dep may be a component name or a loose string — try to match.
      const target = components.find(
        (c) => c.name === dep || c.name.toLowerCase() === dep.toLowerCase(),
      );
      if (target) {
        const toId = mermaidId(target.name);
        lines.push(`  ${fromId} --> ${toId}`);
      }
    }
  }

  // Group by bounded context using subgraph blocks.
  const contextGroups = new Map<string, string[]>();
  for (const comp of components) {
    const ctx = comp.boundedContext || "Unassigned";
    const existing = contextGroups.get(ctx);
    if (existing) {
      existing.push(mermaidId(comp.name));
    } else {
      contextGroups.set(ctx, [mermaidId(comp.name)]);
    }
  }

  for (const [ctx, ids] of contextGroups) {
    const subId = mermaidId(ctx);
    lines.push(`  subgraph ${subId}["${ctx}"]`);
    for (const id of ids) {
      lines.push(`    ${id}`);
    }
    lines.push(`  end`);
  }

  return {
    title: `${blueprint.summary.split(".")[0] ?? "Project"} — Architecture Diagram`,
    type: "graph",
    content: lines.join("\n"),
  };
}
