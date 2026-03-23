import type { Blueprint } from "@ada/compiler";

export function blueprintToCLAUDEMD(
  blueprint: Blueprint,
  warnings?: string[],
): string {
  const lines: string[] = [];

  // 0. Warning banner (fallback/partial compilation)
  if (warnings && warnings.length > 0) {
    lines.push(
      "> **WARNING: Partial compilation** — this blueprint was produced by fallback.",
    );
    for (const w of warnings) {
      lines.push(`> - ${w}`);
    }
    lines.push("");
  }

  // 1. Title + status
  lines.push(`# ${blueprint.summary.split(".")[0]}`);
  lines.push(`## Status: GHOST — new project`);
  lines.push("");

  // 2. What this project is
  lines.push("## Summary");
  lines.push(blueprint.summary);
  lines.push("");

  // 3. Working Principles
  lines.push("## Working Principles");
  lines.push("- Read this file fully before doing anything");
  lines.push(
    "- Read all agent files in `.claude/agents/` to understand bounded contexts",
  );
  lines.push("- Delegate work to specialist agents by bounded context");
  lines.push(
    "- Follow the build order below — each step depends on the previous",
  );
  lines.push(
    "- Do NOT circumvent hook enforcement — hooks enforce entity invariants",
  );
  lines.push("- Verify postconditions after each step before proceeding");
  lines.push("- When uncertain, investigate first rather than asking");
  lines.push("");

  // 4. Architecture
  lines.push("## Architecture");
  lines.push(`**Pattern:** ${blueprint.architecture.pattern}`);
  lines.push(`**Rationale:** ${blueprint.architecture.rationale}`);
  lines.push("");

  // 5. Components
  lines.push("## Components");
  for (const comp of blueprint.architecture.components) {
    lines.push(`### ${comp.name}`);
    lines.push(`**Responsibility:** ${comp.responsibility}`);
    lines.push(`**Bounded Context:** ${comp.boundedContext}`);
    if (comp.interfaces.length > 0) {
      lines.push(`**Interfaces:** ${comp.interfaces.join(", ")}`);
    }
    if (comp.dependencies.length > 0) {
      lines.push(`**Dependencies:** ${comp.dependencies.join(", ")}`);
    }
    lines.push("");
  }

  // 6. Entity invariants as predicates
  lines.push("## Invariants");
  lines.push("Hooks enforce these at tool boundaries. Do not violate them.");
  lines.push("");
  for (const entity of blueprint.dataModel.entities) {
    if (entity.invariants.length > 0) {
      lines.push(`### ${entity.name}`);
      for (const inv of entity.invariants) {
        lines.push(`- \`${inv.predicate}\` — ${inv.description}`);
      }
      lines.push("");
    }
  }

  // 7. Workflows with steps and pre/postconditions
  if (blueprint.processModel.workflows.length > 0) {
    lines.push("## Workflows");
    for (const wf of blueprint.processModel.workflows) {
      lines.push(`### ${wf.name}`);
      lines.push(`**Trigger:** ${wf.trigger}`);
      lines.push("");
      for (const step of wf.steps) {
        lines.push(`**${step.name}** (${step.temporalRelation})`);
        lines.push(`- Pre: ${step.hoareTriple.precondition}`);
        lines.push(`- Action: ${step.hoareTriple.action}`);
        lines.push(`- Post: ${step.hoareTriple.postcondition}`);
        if (step.failureModes.length > 0) {
          for (const fm of step.failureModes) {
            lines.push(
              `- Failure (${fm.class}): ${fm.description} → ${fm.handler}`,
            );
          }
        }
        lines.push("");
      }
    }
  }

  // 8. State machines
  if (blueprint.processModel.stateMachines.length > 0) {
    lines.push("## State Machines");
    for (const sm of blueprint.processModel.stateMachines) {
      lines.push(`### ${sm.entity}`);
      lines.push(`**States:** ${sm.states.join(" → ")}`);
      for (const t of sm.transitions) {
        lines.push(
          `- ${t.from} → ${t.to} (trigger: ${t.trigger}, guard: ${t.guard})`,
        );
      }
      lines.push("");
    }
  }

  // 9. Build order
  const components = blueprint.architecture.components;
  if (components.length > 0) {
    lines.push("## Build Order");
    const ordered = topologicalSort(components);
    for (let i = 0; i < ordered.length; i++) {
      lines.push(
        `${i + 1}. ${ordered[i]!.name} (${ordered[i]!.boundedContext})`,
      );
    }
    lines.push("");
  }

  // 10. Done criteria
  lines.push("## Done");
  for (const nf of blueprint.nonFunctional) {
    lines.push(`- [ ] ${nf}`);
  }
  for (const wf of blueprint.processModel.workflows) {
    for (const step of wf.steps) {
      lines.push(`- [ ] ${step.hoareTriple.postcondition}`);
    }
  }
  lines.push("");

  // 11. Session start protocol
  lines.push("## This Session");
  lines.push("You are the lead agent. Follow this protocol:");
  lines.push("1. Read this file fully");
  lines.push("2. Read all agent files in `.claude/agents/`");
  lines.push(
    "3. Delegate to specialist agents by bounded context, in build order",
  );
  lines.push("4. After each agent completes, verify its postconditions");
  lines.push("5. Do not proceed to the next step until postconditions are met");
  lines.push("");

  return lines.join("\n");
}

function topologicalSort(
  components: readonly import("@ada/compiler").BlueprintComponent[],
): import("@ada/compiler").BlueprintComponent[] {
  const byName = new Map(components.map((c) => [c.name, c]));
  const visited = new Set<string>();
  const result: import("@ada/compiler").BlueprintComponent[] = [];

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);
    const comp = byName.get(name);
    if (!comp) return;
    for (const dep of comp.dependencies) {
      visit(dep);
    }
    result.push(comp);
  }

  for (const comp of components) {
    visit(comp.name);
  }

  return result;
}
