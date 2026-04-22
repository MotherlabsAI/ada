import type { Blueprint, DomainContext } from "@ada/compiler";
import { renderFrontmatter } from "./types.js";

export function blueprintToCLAUDEMD(
  blueprint: Blueprint,
  warnings?: string[],
  domainContext?: DomainContext,
): string {
  const components = blueprint.architecture.components;
  const ordered = topologicalSort(components);

  const frontmatter = renderFrontmatter({
    postcode: blueprint.postcode.raw,
    type: "blueprint",
    name: blueprint.summary.split(".")[0]?.slice(0, 60) ?? "blueprint",
    edges: {
      implements: ordered.map((c) => c.name),
    },
    compiledAt: Date.now(),
  });

  const lines: string[] = [];

  // Warning banner (fallback/partial compilation)
  if (warnings && warnings.length > 0) {
    lines.push(
      "> **WARNING: Partial compilation** — this blueprint was produced by fallback.",
    );
    for (const w of warnings) {
      lines.push(`> - ${w}`);
    }
    lines.push("");
  }

  // Title + one-sentence summary
  const title = blueprint.summary.split(".")[0] ?? "Compiled project";
  lines.push(`# ${title} — compiled by Ada`);
  lines.push("");
  lines.push(`> ${blueprint.summary}`);
  lines.push("");

  // Compilation metadata
  lines.push("## Compilation");
  const auditDecision = blueprint.audit?.governorDecision ?? "ACCEPT";
  const auditConf = blueprint.audit
    ? `${(blueprint.audit.confidence * 100).toFixed(0)}%`
    : "—";
  const compiledAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  lines.push(
    `- Decision: ${auditDecision}  Confidence: ${auditConf}  Compiled: ${compiledAt}`,
  );
  lines.push(
    "- Blueprint: `.ada/state.json`  World model: `.ada/manifest.json`",
  );
  lines.push("");

  // Bounded contexts — unique set from components
  const contexts = [
    ...new Set(ordered.map((c) => c.boundedContext).filter(Boolean)),
  ];
  if (contexts.length > 0) {
    lines.push("## Bounded Contexts");
    for (const ctx of contexts) {
      const rootComp = ordered.find((c) => c.boundedContext === ctx);
      lines.push(`- ${ctx}${rootComp ? ` — root: ${rootComp.name}` : ""}`);
    }
    lines.push("");
  }

  // Agents — component names by bounded context (orientation only)
  if (ordered.length > 0) {
    lines.push("## Agents");
    for (const c of ordered) {
      lines.push(`- ${c.name} \`${c.boundedContext}\``);
    }
    lines.push("");
  }

  // Out of scope — safety fence, kept short
  const outOfScope = blueprint.scope?.outOfScope?.length
    ? blueprint.scope.outOfScope
    : (domainContext?.excludedConcerns ?? []);
  if (outOfScope.length > 0) {
    lines.push("## Out of Scope");
    lines.push("Ada explicitly excluded these. Do not build them:");
    for (const exc of outOfScope) {
      lines.push(`- ${exc}`);
    }
    lines.push("");
  }

  // Constraints — hook reference + critical invariants only (HALT conditions)
  lines.push("## Constraints");
  lines.push(
    "Ada's PreToolUse hook is active — loads `.ada/state.json` and gates every tool call.",
  );
  lines.push("See `hooks/pre-tool/ada-gate.sh` for enforcement logic.");
  lines.push("");
  // Emit up to 5 NFRs that have a formal predicate (these are the HALT triggers)
  const hardNFRs = (blueprint.nonFunctional ?? [])
    .filter((n) => n.predicate)
    .slice(0, 5);
  if (hardNFRs.length > 0) {
    lines.push("Critical constraints (violation = HALT):");
    for (const nfr of hardNFRs) {
      lines.push(`- \`${nfr.predicate}\`: ${nfr.requirement}`);
    }
    lines.push("");
  }

  // Open questions — blocking unknowns only
  if (blueprint.openQuestions && blueprint.openQuestions.length > 0) {
    lines.push("## Open Questions");
    for (const q of blueprint.openQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  // Orchestration map — present only when subGoals exist
  if (blueprint.subGoals && blueprint.subGoals.length > 0) {
    lines.push("## Orchestration Map");
    lines.push(
      "Ada builds this project by bounded context. Each context is one Claude Code session:",
    );
    lines.push("");
    for (const sg of blueprint.subGoals) {
      const deps =
        sg.dependsOn && sg.dependsOn.length > 0
          ? ` <- after: ${sg.dependsOn.join(", ")}`
          : "";
      lines.push(`**${sg.name}**${deps}`);
      lines.push(sg.derivedIntent);
      lines.push("");
    }
    lines.push("## Orchestration Protocol");
    lines.push(
      "When ADA_SUBGOAL env is set, you are in an orchestrated session:",
    );
    lines.push(
      '1. Call `ada.advance_execution("<sessionId>")` to get your component-level task brief',
    );
    lines.push("2. Implement all components in your bounded context");
    lines.push(
      '3. Call `ada.set_task_status("<component>", "complete", [<evidence>])` per component',
    );
    lines.push(
      '4. Call `ada.complete_subgoal("<subGoalName>", [<evidence>])` when ALL components are done',
    );
    lines.push("5. Exit — the Ada orchestrator will spawn the next session");
    lines.push("");
  }

  // Ada MCP — always present, condensed
  lines.push("## Ada MCP");
  lines.push(
    "The MCP server is the spec authority. Pull context on demand — never assume from memory.",
  );
  lines.push("");
  lines.push(
    "**Start of every task:** call `ada.advance_execution(agentId)` to get your task brief.",
  );
  lines.push(
    "**Before modifying any entity:** call `ada.query_constraints(entityName)`.",
  );
  lines.push(
    "**Before significant changes:** call `ada.check_drift(description)`.",
  );
  lines.push("");

  // This session — minimal call to action
  lines.push("## This Session");
  lines.push(
    "You are the lead agent. Call `ada.advance_execution(agentId)` to get your first task. Follow the execution brief. Verify postconditions before marking complete.",
  );
  lines.push("");

  return frontmatter + lines.join("\n");
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
