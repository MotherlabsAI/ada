import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { Blueprint, GovernorDecision } from "@ada/compiler";
import { writeConfigGraph } from "@ada/config-writer";

export interface ProjectArgs {
  readonly kind: string;
  readonly outDir?: string;
}

const SUPPORTED_KINDS = ["claude-code", "cursor", "mermaid", "docs"] as const;
type ProjectionKind = (typeof SUPPORTED_KINDS)[number];

interface StateFile {
  readonly blueprint?: Blueprint;
  readonly governorDecision?: GovernorDecision;
}

interface ProjectionResult {
  readonly kind: ProjectionKind;
  readonly projectDir: string;
  readonly emittedFiles: string[];
  readonly postcode: string;
}

function resolveProjectDir(): string {
  return (
    process.env["ADA_PROJECT_DIR"] ??
    (process.env["ADA_STATE_PATH"]
      ? path.dirname(process.env["ADA_STATE_PATH"])
      : undefined) ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd()
  );
}

function resolveStatePath(projectDir: string): string {
  return (
    process.env["ADA_STATE_PATH"] ?? path.join(projectDir, ".ada", "state.json")
  );
}

function shortHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

// ─── Claude Code projector ─────────────────────────────────────────────────────

function projectClaudeCode(
  blueprint: Blueprint,
  governorDecision: GovernorDecision,
  projectDir: string,
): ProjectionResult {
  const result = writeConfigGraph(blueprint, governorDecision, projectDir, {
    partial: governorDecision.decision !== "ACCEPT",
  });

  const emittedFiles = [
    result.claudeMd,
    ...(result.buildMd ? [result.buildMd] : []),
    ...result.agents,
    ...result.skills,
    ...result.hooks,
    ...result.contracts,
    result.worldModelJson,
    result.worldModelMd,
  ];

  return {
    kind: "claude-code",
    projectDir,
    emittedFiles,
    postcode: result.postcode.raw,
  };
}

// ─── Cursor projector ──────────────────────────────────────────────────────────

function buildCursorRules(blueprint: Blueprint): string {
  const lines: string[] = [];
  const projectName = blueprint.summary.split(".")[0]?.trim() ?? "Project";

  lines.push(`# ${projectName}`);
  lines.push("");
  lines.push("## Architecture");
  lines.push(blueprint.summary);
  lines.push("");

  // Scope
  if (blueprint.scope.inScope.length > 0) {
    lines.push("## In Scope");
    for (const item of blueprint.scope.inScope) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  // Entities and invariants
  if (blueprint.dataModel.entities.length > 0) {
    lines.push("## Key Entities");
    for (const entity of blueprint.dataModel.entities) {
      lines.push(`### ${entity.name} (${entity.category})`);
      if (entity.invariants.length > 0) {
        lines.push("Invariants — do not violate:");
        for (const inv of entity.invariants) {
          lines.push(`- ${inv.predicate}`);
        }
      }
      lines.push("");
    }
  }

  // Bounded contexts
  if (blueprint.dataModel.boundedContexts.length > 0) {
    lines.push("## Bounded Contexts");
    for (const ctx of blueprint.dataModel.boundedContexts) {
      lines.push(`### ${ctx.name}`);
      lines.push(`Root entity: ${ctx.rootEntity}`);
      if (ctx.entities.length > 0) {
        lines.push(`Owns: ${ctx.entities.join(", ")}`);
      }
      lines.push("");
    }
  }

  // Workflows
  const workflows = blueprint.processModel.workflows;
  if (workflows.length > 0) {
    lines.push("## Workflows");
    for (const wf of workflows) {
      lines.push(`### ${wf.name}`);
      lines.push(`Trigger: ${wf.trigger}`);
      if (wf.steps.length > 0) {
        for (const step of wf.steps) {
          lines.push(`- **${step.name}**: ${step.hoareTriple.action}`);
        }
      }
      lines.push("");
    }
  }

  // Open questions — give Cursor AI context on unresolved design decisions
  if (blueprint.openQuestions.length > 0) {
    lines.push("## Open Design Questions");
    for (const q of blueprint.openQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function projectCursor(
  blueprint: Blueprint,
  projectDir: string,
): ProjectionResult {
  const content = buildCursorRules(blueprint);
  const outPath = path.join(projectDir, ".cursorrules");
  fs.writeFileSync(outPath, content, "utf8");
  return {
    kind: "cursor",
    projectDir,
    emittedFiles: [outPath],
    postcode: `CUR.${shortHash(content)}`,
  };
}

// ─── Mermaid projector ─────────────────────────────────────────────────────────

function sanitizeMermaidId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function buildMermaidDiagram(blueprint: Blueprint): string {
  const lines: string[] = [];
  const title = blueprint.summary.split(".")[0]?.trim() ?? "Architecture";

  lines.push("---");
  lines.push(`title: ${title}`);
  lines.push("---");
  lines.push("erDiagram");

  // Emit entity definitions with invariant count as a field
  for (const entity of blueprint.dataModel.entities) {
    const id = sanitizeMermaidId(entity.name);
    lines.push(`  ${id} {`);
    lines.push(`    string category "${entity.category}"`);
    if (entity.invariants.length > 0) {
      lines.push(`    int invariantCount "${entity.invariants.length}"`);
    }
    lines.push("  }");
  }

  // Emit bounded context relationships — root to members
  for (const ctx of blueprint.dataModel.boundedContexts) {
    const rootId = sanitizeMermaidId(ctx.rootEntity);
    for (const member of ctx.entities) {
      if (member !== ctx.rootEntity) {
        const memberId = sanitizeMermaidId(member);
        lines.push(`  ${rootId} ||--o{ ${memberId} : "${ctx.name}"`);
      }
    }
  }

  return lines.join("\n");
}

function projectMermaid(
  blueprint: Blueprint,
  projectDir: string,
): ProjectionResult {
  const diagram = buildMermaidDiagram(blueprint);
  const adaDir = path.join(projectDir, ".ada");
  fs.mkdirSync(adaDir, { recursive: true });
  const outPath = path.join(adaDir, "architecture.mmd");
  fs.writeFileSync(outPath, diagram, "utf8");
  return {
    kind: "mermaid",
    projectDir,
    emittedFiles: [outPath],
    postcode: `MMD.${shortHash(diagram)}`,
  };
}

// ─── Docs projector ────────────────────────────────────────────────────────────

function buildArchitectureMd(blueprint: Blueprint): string {
  const lines: string[] = [];
  const title = blueprint.summary.split(".")[0]?.trim() ?? "Architecture";

  lines.push(`# ${title}`);
  lines.push("");
  lines.push("## Overview");
  lines.push(blueprint.summary);
  lines.push("");

  // Scope
  if (blueprint.scope.inScope.length > 0) {
    lines.push("## In Scope");
    for (const item of blueprint.scope.inScope) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  if (blueprint.scope.outOfScope.length > 0) {
    lines.push("## Out of Scope");
    for (const item of blueprint.scope.outOfScope) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  if (blueprint.scope.assumptions.length > 0) {
    lines.push("## Assumptions");
    for (const a of blueprint.scope.assumptions) {
      lines.push(`- ${a}`);
    }
    lines.push("");
  }

  // Bounded contexts
  const contexts = blueprint.dataModel.boundedContexts;
  if (contexts.length > 0) {
    lines.push("## Bounded Contexts");
    for (const ctx of contexts) {
      lines.push(`### ${ctx.name}`);
      lines.push(`**Root entity:** ${ctx.rootEntity}`);
      if (ctx.entities.length > 0) {
        lines.push(`**Entities:** ${ctx.entities.join(", ")}`);
      }
      if (ctx.invariants.length > 0) {
        lines.push("**Context invariants:**");
        for (const inv of ctx.invariants) {
          lines.push(`- \`${inv.predicate}\``);
        }
      }
      lines.push("");
    }
  }

  // Entity catalog
  const entities = blueprint.dataModel.entities;
  if (entities.length > 0) {
    lines.push("## Entity Catalog");
    for (const entity of entities) {
      lines.push(`### ${entity.name}`);
      lines.push(`*Category: ${entity.category}*`);
      if (entity.properties.length > 0) {
        lines.push("");
        lines.push("**Properties:**");
        for (const prop of entity.properties) {
          const req = prop.required ? " (required)" : "";
          lines.push(`- \`${prop.name}: ${prop.type}\`${req}`);
        }
      }
      if (entity.invariants.length > 0) {
        lines.push("");
        lines.push("**Invariants:**");
        for (const inv of entity.invariants) {
          lines.push(`- \`${inv.predicate}\``);
        }
      }
      lines.push("");
    }
  }

  // Process model — workflows
  const workflows = blueprint.processModel.workflows;
  if (workflows.length > 0) {
    lines.push("## Workflows");
    for (const wf of workflows) {
      lines.push(`### ${wf.name}`);
      lines.push(`**Trigger:** ${wf.trigger}`);
      if (wf.steps.length > 0) {
        lines.push("");
        lines.push("**Steps:**");
        for (let i = 0; i < wf.steps.length; i++) {
          const step = wf.steps[i]!;
          lines.push(`${i + 1}. **${step.name}** *(${step.temporalRelation})*`);
          lines.push(`   - Pre: \`${step.hoareTriple.precondition}\``);
          lines.push(`   - Action: ${step.hoareTriple.action}`);
          lines.push(`   - Post: \`${step.hoareTriple.postcondition}\``);
        }
      }
      lines.push("");
    }
  }

  // State machines
  const stateMachines = blueprint.processModel.stateMachines;
  if (stateMachines.length > 0) {
    lines.push("## State Machines");
    for (const sm of stateMachines) {
      lines.push(`### ${sm.entity}`);
      lines.push(`States: ${sm.states.join(" → ")}`);
      if (sm.transitions.length > 0) {
        lines.push("Transitions:");
        for (const t of sm.transitions) {
          lines.push(
            `- \`${t.from}\` → \`${t.to}\` on \`${t.trigger}\` [guard: ${t.guard}]`,
          );
        }
      }
      lines.push("");
    }
  }

  // Open questions
  if (blueprint.openQuestions.length > 0) {
    lines.push("## Open Questions");
    for (const q of blueprint.openQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Generated by Ada projection engine — do not edit manually.*`);
  lines.push(
    `*Source: .ada/state.json — re-emit with \`ada.project("docs")\`*`,
  );

  return lines.join("\n");
}

function projectDocs(
  blueprint: Blueprint,
  projectDir: string,
): ProjectionResult {
  const content = buildArchitectureMd(blueprint);
  const outPath = path.join(projectDir, "ARCHITECTURE.md");
  fs.writeFileSync(outPath, content, "utf8");
  return {
    kind: "docs",
    projectDir,
    emittedFiles: [outPath],
    postcode: `DOC.${shortHash(content)}`,
  };
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function projectBlueprint(args: ProjectArgs): {
  content: string;
  isError: boolean;
} {
  const kind = (args.kind ?? "").toLowerCase().trim() as ProjectionKind;
  if (!SUPPORTED_KINDS.includes(kind)) {
    return {
      content: `Unsupported projection kind: "${kind}". Supported: ${SUPPORTED_KINDS.join(", ")}.`,
      isError: true,
    };
  }

  const projectDir = args.outDir
    ? path.resolve(args.outDir)
    : resolveProjectDir();
  const statePath = resolveStatePath(projectDir);

  let state: StateFile;
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    state = JSON.parse(raw) as StateFile;
  } catch (err) {
    return {
      content: `Cannot read state file at ${statePath}: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }

  if (!state.blueprint) {
    return {
      content: `No blueprint in state file. Run 'ada compile <intent>' first.`,
      isError: true,
    };
  }

  try {
    let result: ProjectionResult;

    switch (kind) {
      case "claude-code": {
        if (!state.governorDecision) {
          return {
            content: `No governorDecision in state file. Blueprint exists but was not governor-evaluated.`,
            isError: true,
          };
        }
        result = projectClaudeCode(
          state.blueprint,
          state.governorDecision,
          projectDir,
        );
        break;
      }
      case "cursor":
        result = projectCursor(state.blueprint, projectDir);
        break;
      case "mermaid":
        result = projectMermaid(state.blueprint, projectDir);
        break;
      case "docs":
        result = projectDocs(state.blueprint, projectDir);
        break;
    }

    return {
      content: JSON.stringify(
        {
          kind: result.kind,
          projectDir: result.projectDir,
          postcode: result.postcode,
          emittedFileCount: result.emittedFiles.length,
          emittedFiles: result.emittedFiles,
        },
        null,
        2,
      ),
      isError: false,
    };
  } catch (err) {
    return {
      content: `Projection failed [${kind}]: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}
