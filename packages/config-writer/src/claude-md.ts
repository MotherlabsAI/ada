import type { Blueprint, DomainContext } from "@ada/compiler";

export function blueprintToCLAUDEMD(
  blueprint: Blueprint,
  warnings?: string[],
  domainContext?: DomainContext,
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

  // 1. Title
  lines.push(`# ${blueprint.summary.split(".")[0]}`);
  lines.push("");

  // 2. What this project is (concise)
  lines.push("## Summary");
  lines.push(blueprint.summary);
  lines.push("");

  // 3. Out of scope — what Ada explicitly ruled out. Claude Code must not build these.
  // Prefer blueprint.scope.outOfScope (from SYN); fall back to domainContext.excludedConcerns (from PER).
  const outOfScope = blueprint.scope?.outOfScope?.length
    ? blueprint.scope.outOfScope
    : (domainContext?.excludedConcerns ?? []);
  if (outOfScope.length > 0) {
    lines.push("## Out of Scope");
    lines.push(
      "Ada explicitly excluded these during compilation. Do not build them:",
    );
    for (const exc of outOfScope) {
      lines.push(`- ${exc}`);
    }
    lines.push("");
  }

  // 4. Working Principles
  lines.push("## Working Principles");
  lines.push(
    "- Read this file and all `.claude/agents/` files before doing anything",
  );
  lines.push(
    "- Delegate to specialist agents by bounded context, in build order",
  );
  lines.push(
    "- Do NOT circumvent hook enforcement — hooks enforce entity invariants",
  );
  lines.push("- Verify postconditions after each step before proceeding");
  lines.push("");

  // 4. Architecture
  lines.push("## Architecture");
  lines.push(`**Pattern:** ${blueprint.architecture.pattern}`);
  lines.push(`**Rationale:** ${blueprint.architecture.rationale}`);
  lines.push("");

  // 5. Components — one line each, topologically ordered (= build order).
  // Invariants, workflow steps, state machines → agent files.
  const components = blueprint.architecture.components;
  if (components.length > 0) {
    lines.push("## Components");
    lines.push("_Build in order shown. Each line is one bounded context._");
    lines.push("");
    const ordered = topologicalSort(components);
    for (let i = 0; i < ordered.length; i++) {
      const c = ordered[i]!;
      const deps =
        c.dependencies.length > 0 ? ` ← ${c.dependencies.join(", ")}` : "";
      lines.push(
        `${i + 1}. **${c.name}** \`${c.boundedContext}\` — ${c.responsibility}${deps}`,
      );
    }
    lines.push("");
    lines.push(
      "> Invariants, workflows, state machines → `.claude/agents/` | Query: `ada.query_constraints(scope)`",
    );
    lines.push("");
  }

  // 10. Open questions — unresolved at compile time, Claude Code must handle uncertainty
  if (blueprint.openQuestions.length > 0) {
    lines.push("## Open Questions");
    lines.push(
      "These were not resolved during compilation. Address them before or during implementation:",
    );
    for (const q of blueprint.openQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  // 11. Done criteria — nonFunctional requirements only
  // Workflow postconditions live in .ada/artifacts/ — query via ada.query_constraints
  lines.push("## Done");
  for (const nf of blueprint.nonFunctional) {
    if (typeof nf === "string") {
      lines.push(`- [ ] ${nf}`);
    } else {
      const label = nf.predicate
        ? `${nf.requirement} (\`${nf.predicate}\`)`
        : nf.requirement;
      const scope = nf.scope !== "global" ? ` [${nf.scope}]` : "";
      lines.push(`- [ ] ${label}${scope}`);
    }
  }
  lines.push("");

  // 11b. Compilation audit — health snapshot from VER + GOV stages
  if (blueprint.audit) {
    const a = blueprint.audit;
    const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
    lines.push("## Compilation Health");
    lines.push(
      `**Decision:** ${a.governorDecision}  **Confidence:** ${pct(a.confidence)}  **Gates:** ${pct(a.gatePassRate)}`,
    );
    lines.push(
      `**Coverage:** ${pct(a.coverageScore)}  **Coherence:** ${pct(a.coherenceScore)}  **Drifts:** ${a.driftCount}  **Gaps:** ${a.gapCount}`,
    );
    if (a.violationCount > 0) {
      lines.push(
        `> ${a.violationCount} policy violation(s) noted — query \`ada.get_world_model("GOV")\` for details`,
      );
    }
    lines.push("");
  }

  // 11. Ada MCP — world model query interface
  lines.push("## Ada MCP");
  lines.push(
    "Ada world model is queryable via MCP. Before modifying any entity or workflow:",
  );
  lines.push(
    "- `ada.query_constraints(scope)` — get invariants for any domain scope",
  );
  lines.push(
    "- `ada.check_drift(description)` — verify a planned action against original intent",
  );
  lines.push(
    "- `ada.get_world_model(stage?)` — read any compiled stage artifact",
  );
  lines.push("");

  // 12. Semantic drift
  lines.push("## Semantic Drift");
  lines.push(
    "Ada verifies codebase alignment after each push. Before starting work:",
  );
  lines.push(
    "- If `.ada/drift.md` exists: read it — Ada has flagged semantic violations",
  );
  lines.push("- Run `ada verify` at any time to check current alignment");
  lines.push(
    "- Run `ada hook install` once to automate this check on every push",
  );
  lines.push("");

  // 13. Session start protocol
  lines.push("## This Session");
  lines.push(
    "You are the lead agent. Read this file and all `.claude/agents/` files. Delegate by bounded context in build order. Verify postconditions before each next step.",
  );
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
