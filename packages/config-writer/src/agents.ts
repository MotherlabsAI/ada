import type { Blueprint } from "@ada/compiler";
import type { AgentFile } from "./types.js";

export function componentsToAgents(blueprint: Blueprint): AgentFile[] {
  const agents: AgentFile[] = [];

  // Build a lookup: boundedContext → entities
  const contextEntities = new Map<
    string,
    (typeof blueprint.dataModel.boundedContexts)[number]
  >();
  for (const bc of blueprint.dataModel.boundedContexts) {
    contextEntities.set(bc.name, bc);
  }

  for (const comp of blueprint.architecture.components) {
    const name = `${comp.boundedContext}-agent`;
    const fileName = `${name}.md`;

    // ── Bounded context boundary ──────────────────────────────────────────────
    const bc = contextEntities.get(comp.boundedContext);
    const entityNames = bc ? bc.entities : [];

    // ── Invariants for this context ───────────────────────────────────────────
    const contextInvariants = bc?.invariants ?? [];
    const entityInvariants = blueprint.dataModel.entities
      .filter((e) => entityNames.includes(e.name))
      .flatMap((e) => e.invariants.map((inv) => ({ entity: e.name, ...inv })));

    // ── Workflow steps assigned to this context ───────────────────────────────
    const assignedSteps = blueprint.processModel.workflows.flatMap((wf) =>
      wf.steps
        .filter(() =>
          blueprint.architecture.components.some(
            (c) =>
              c.boundedContext === comp.boundedContext && c.name === comp.name,
          ),
        )
        .map((step) => ({ workflow: wf.name, ...step })),
    );

    // ── Build body ────────────────────────────────────────────────────────────
    const bodyLines: string[] = [];

    bodyLines.push(`# ${comp.name} Agent`);
    bodyLines.push("");
    bodyLines.push(`${comp.responsibility}`);
    bodyLines.push("");

    // Bounded context boundary
    bodyLines.push("## Bounded Context");
    bodyLines.push(`**Context:** ${comp.boundedContext}`);
    if (entityNames.length > 0) {
      bodyLines.push(`**Entities:** ${entityNames.join(", ")}`);
    }
    if (comp.interfaces.length > 0) {
      bodyLines.push(`**Interfaces:** ${comp.interfaces.join(", ")}`);
    }
    if (comp.dependencies.length > 0) {
      bodyLines.push(`**Dependencies:** ${comp.dependencies.join(", ")}`);
    }
    bodyLines.push("");

    // Invariants
    if (contextInvariants.length > 0 || entityInvariants.length > 0) {
      bodyLines.push("## Invariants");
      bodyLines.push(
        "These MUST hold at all times. Hooks enforce them at tool boundaries.",
      );
      bodyLines.push("");
      for (const inv of contextInvariants) {
        bodyLines.push(`- \`${inv.predicate}\` — ${inv.description}`);
      }
      for (const inv of entityInvariants) {
        bodyLines.push(
          `- \`${inv.predicate}\` (${inv.entity}) — ${inv.description}`,
        );
      }
      bodyLines.push("");
    }

    // Workflow steps with Hoare triples
    if (assignedSteps.length > 0) {
      bodyLines.push("## Workflow Steps");
      for (const step of assignedSteps) {
        bodyLines.push(`### ${step.name} (${step.workflow})`);
        bodyLines.push(`- **Pre:** ${step.hoareTriple.precondition}`);
        bodyLines.push(`- **Action:** ${step.hoareTriple.action}`);
        bodyLines.push(`- **Post:** ${step.hoareTriple.postcondition}`);
        if (step.failureModes.length > 0) {
          bodyLines.push("- **Failure modes:**");
          for (const fm of step.failureModes) {
            bodyLines.push(
              `  - ${fm.class}: ${fm.description} → ${fm.handler}`,
            );
          }
        }
        bodyLines.push("");
      }
    }

    // Acceptance criteria
    const postconditions = assignedSteps.map(
      (step) => `- [ ] ${step.hoareTriple.postcondition}`,
    );
    bodyLines.push("## Acceptance Criteria");
    bodyLines.push(
      postconditions.length > 0
        ? postconditions.join("\n")
        : "- [ ] Component builds without errors",
    );
    bodyLines.push("");

    // Prohibited actions
    bodyLines.push("## Prohibited Actions");
    bodyLines.push("- Do NOT modify files outside this bounded context");
    bodyLines.push("- Do NOT circumvent hook enforcement");
    bodyLines.push("- Do NOT violate invariants listed above");
    bodyLines.push("");

    const frontmatter = [
      "---",
      `name: ${name}`,
      `description: Use when ${comp.responsibility.toLowerCase()} tasks arise in the ${comp.boundedContext} domain.`,
      `model: claude-sonnet-4-6`,
      `tools: [Bash, Read, Write, Edit, Glob, Grep]`,
      `status: GHOST`,
      "---",
      "",
    ].join("\n");

    agents.push({
      name,
      description: `Use when ${comp.responsibility.toLowerCase()} tasks arise in the ${comp.boundedContext} domain.`,
      model: "claude-sonnet-4-6",
      tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
      status: "GHOST",
      body: frontmatter + bodyLines.join("\n"),
      path: `.claude/agents/${fileName}`,
    });
  }

  return agents;
}
