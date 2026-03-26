import type { Blueprint, DomainContext } from "@ada/compiler";
import type { AgentFile } from "./types.js";

// ─── Orchestration agents ─────────────────────────────────────────────────────

/**
 * Builds the three system-level orchestration agents that implement the
 * macro/micro execution hierarchy. These are generated for every compiled
 * project — they sit above the bounded-context domain agents.
 */
function buildOrchestrationAgents(blueprint: Blueprint): AgentFile[] {
  const contextList = blueprint.architecture.components
    .map((c) => `${c.name} (${c.boundedContext})`)
    .join(", ");

  // ── Macro Planner ──────────────────────────────────────────────────────────
  const macroPlannerBody = [
    "# Macro Planner",
    "",
    "Orchestrates long-horizon execution across all bounded contexts. Reads the compiled blueprint, builds a dependency-ordered task graph, and delegates bounded work units to domain agents. NEVER writes code directly.",
    "",
    "## Role",
    "You are the macro planner. Your job is to see the whole board and sequence work correctly.",
    "- Call `ada.get_macro_plan` at the start of every session to get the current execution state",
    "- Call `ada.get_runtime_state` to understand what has already been built",
    "- Delegate implementation to the domain agent matching each bounded context",
    "- Create checkpoints before each major delegation: `ada.checkpoint`",
    "- Do NOT implement code yourself — your role is sequencing and escalation",
    "",
    "## Execution Protocol",
    "1. Call `ada.get_macro_plan` — identify NEXT task",
    "2. Call `ada.checkpoint` with description of what you're about to delegate",
    "3. Spawn the domain agent for that bounded context using the Agent tool",
    "4. After agent completes, call `ada.check_drift` to verify alignment",
    "5. Call `ada.get_macro_plan` again — advance to next task",
    "6. If agent reports failure: escalate to human. Do NOT retry more than once.",
    "",
    "## Escalation Criteria",
    "Escalate to human (stop and ask) when:",
    "- A domain agent fails twice on the same task",
    "- `ada.check_drift` returns aligned=false with critical violations",
    "- A dependency is missing that the blueprint does not account for",
    "- The macro plan shows all tasks blocked",
    "",
    `## Bounded Contexts in this Project`,
    contextList,
    "",
    "## Prohibited Actions",
    "- Do NOT write, edit, or delete any file",
    "- Do NOT call Bash to run builds or tests — that is the verifier's job",
    "- Do NOT proceed past a critical drift violation without human approval",
    "",
  ].join("\n");

  const macroPlannerFrontmatter = [
    "---",
    "name: macro-planner",
    "description: Use when orchestrating long-horizon execution across multiple bounded contexts. Reads world-state, sequences tasks by dependency, delegates to domain agents. Does not write code.",
    "model: claude-sonnet-4-6",
    "tools: [Agent, mcp__ada__get_macro_plan, mcp__ada__get_runtime_state, mcp__ada__checkpoint, mcp__ada__check_drift, mcp__ada__log_drift]",
    "maxTurns: 50",
    "---",
    "",
  ].join("\n");

  // ── Execution Orchestrator ─────────────────────────────────────────────────
  const orchestratorBody = [
    "# Execution Orchestrator",
    "",
    "Coordinates the full macro/micro execution cycle. Manages checkpoint creation, evidence collection, verifier handoffs, and failure routing. The orchestrator is the session conductor — it owns the state machine of a multi-agent build.",
    "",
    "## Role",
    "You sit between the macro planner and the domain agents. You:",
    "- Receive a bounded task from the macro planner",
    "- Checkpoint state before starting: `ada.checkpoint`",
    "- Spawn the appropriate domain agent with a clear, bounded brief",
    "- Collect evidence of completion (file paths, postconditions met)",
    "- Hand off to the independent verifier for gate evaluation",
    "- Report pass/fail back to macro planner",
    "",
    "## Cycle",
    "```",
    "receive task → checkpoint → spawn domain agent → collect evidence",
    "→ spawn verifier → evaluate gate → report to macro planner",
    "```",
    "",
    "## Failure Routing",
    "- Micro-level failure (agent error, tool failure): attempt local repair once",
    "- Local repair budget: 1 retry with a different approach",
    "- If repair fails: report BLOCKED to macro planner with evidence",
    "- NEVER silently swallow failures or mark a task complete without verifier confirmation",
    "",
    "## Evidence Requirements",
    "After each domain agent run, collect:",
    "- List of files written or modified",
    "- Postconditions from the workflow steps that were satisfied",
    "- Any open questions or deferred items",
    "",
    "## Prohibited Actions",
    "- Do NOT mark a task complete without passing it through the verifier",
    "- Do NOT exceed one local repair attempt",
    "- Do NOT spawn more than one domain agent simultaneously for the same context",
    "",
  ].join("\n");

  const orchestratorFrontmatter = [
    "---",
    "name: execution-orchestrator",
    "description: Use when coordinating a bounded task through the full macro/micro cycle. Manages checkpoints, spawns domain agent, collects evidence, routes to verifier. The session conductor.",
    "model: claude-sonnet-4-6",
    "tools: [Agent, mcp__ada__checkpoint, mcp__ada__rollback_to, mcp__ada__get_runtime_state, mcp__ada__check_drift, mcp__ada__log_drift]",
    "maxTurns: 80",
    "---",
    "",
  ].join("\n");

  // ── Independent Verifier ───────────────────────────────────────────────────
  const verifierBody = [
    "# Independent Verifier",
    "",
    "Verifies micro-executor output against the compiled blueprint. Separated from the executor — you CANNOT have built what you are verifying. Your job is evaluation, not implementation.",
    "",
    "## Role",
    "You receive a completed task and its evidence. You verify:",
    "1. **Structural** — do the files exist and are they internally consistent?",
    "2. **Alignment** — call `ada.check_drift` with what was implemented",
    "3. **Postconditions** — does the implementation satisfy the workflow postconditions from `ada.get_workflow`?",
    "4. **Invariants** — call `ada.get_invariants` for each entity touched; check none are violated",
    "",
    "## Output",
    "You emit one of:",
    "- **PASS** — all checks satisfied, list evidence",
    "- **FAIL** — one or more checks failed, list violations with file:line references",
    "- **PARTIAL** — structural and alignment pass but postconditions are incomplete — list what remains",
    "",
    "## Verification Steps",
    "1. Call `ada.get_workflow` for the workflow steps this task implements",
    "2. Call `ada.get_invariants` for each entity the task touches",
    "3. Read the files that were written (use Read tool)",
    "4. Call `ada.check_drift` with a description of what was actually implemented",
    "5. Evaluate each postcondition — pass/fail with evidence",
    "6. If drift detected: call `ada.log_drift` with the deviation",
    "7. Emit verdict with full evidence list",
    "",
    "## Prohibited Actions",
    "- Do NOT modify any file",
    "- Do NOT run builds (Bash is available for reading only: `cat`, `tsc --noEmit`)",
    "- Do NOT mark PASS if any postcondition is unverified",
    "- Do NOT self-certify — if you implemented it, you are not the verifier",
    "",
  ].join("\n");

  const verifierFrontmatter = [
    "---",
    "name: independent-verifier",
    "description: Use when verifying a completed micro-executor task against compiled blueprint. Checks structural correctness, drift alignment, postconditions, and invariants. NEVER reimplements — only evaluates.",
    "model: claude-sonnet-4-6",
    "tools: [Read, Grep, Bash, mcp__ada__check_drift, mcp__ada__get_workflow, mcp__ada__get_invariants, mcp__ada__log_drift, mcp__ada__get_blueprint]",
    "maxTurns: 20",
    "---",
    "",
  ].join("\n");

  return [
    {
      name: "macro-planner",
      description:
        "Use when orchestrating long-horizon execution across multiple bounded contexts.",
      model: "claude-sonnet-4-6",
      tools: ["Agent", "mcp__ada__*"],
      status: "",
      body: macroPlannerFrontmatter + macroPlannerBody,
      path: ".claude/agents/macro-planner.md",
    },
    {
      name: "execution-orchestrator",
      description:
        "Use when coordinating a bounded task through the full macro/micro cycle.",
      model: "claude-sonnet-4-6",
      tools: ["Agent", "mcp__ada__*"],
      status: "",
      body: orchestratorFrontmatter + orchestratorBody,
      path: ".claude/agents/execution-orchestrator.md",
    },
    {
      name: "independent-verifier",
      description:
        "Use when verifying a completed micro-executor task against compiled blueprint.",
      model: "claude-sonnet-4-6",
      tools: ["Read", "Grep", "Bash", "mcp__ada__*"],
      status: "",
      body: verifierFrontmatter + verifierBody,
      path: ".claude/agents/independent-verifier.md",
    },
  ];
}

export function componentsToAgents(
  blueprint: Blueprint,
  domainContext?: DomainContext,
): AgentFile[] {
  const agents: AgentFile[] = [...buildOrchestrationAgents(blueprint)];

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
    // Match steps by name/hoare content against entity names or component name.
    const contextTerms = [
      ...entityNames.map((n) => n.toLowerCase()),
      comp.name.toLowerCase(),
      comp.boundedContext.toLowerCase(),
    ];
    const stepMentions = (
      step: (typeof blueprint.processModel.workflows)[number]["steps"][number],
    ): boolean => {
      const haystack = [
        step.name,
        step.hoareTriple.precondition,
        step.hoareTriple.action,
        step.hoareTriple.postcondition,
      ]
        .join(" ")
        .toLowerCase();
      return contextTerms.some((term) => haystack.includes(term));
    };
    const assignedSteps = blueprint.processModel.workflows.flatMap((wf) =>
      wf.steps
        .filter(stepMentions)
        .map((step) => ({ workflow: wf.name, ...step })),
    );

    // ── State machines for entities in this context ───────────────────────────
    const assignedStateMachines = blueprint.processModel.stateMachines.filter(
      (sm) =>
        entityNames.some((en) => en.toLowerCase() === sm.entity.toLowerCase()),
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

    // Domain vocabulary — terms from PER stage ubiquitousLanguage
    const vocabEntries = domainContext
      ? Object.entries(domainContext.ubiquitousLanguage)
      : [];
    if (vocabEntries.length > 0) {
      bodyLines.push("## Domain Vocabulary");
      bodyLines.push(
        "Use these exact terms when naming variables, types, and functions.",
      );
      bodyLines.push("");
      for (const [term, definition] of vocabEntries) {
        bodyLines.push(`- **${term}** — ${definition}`);
      }
      bodyLines.push("");
    }

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

    // State machines
    if (assignedStateMachines.length > 0) {
      bodyLines.push("## State Machines");
      for (const sm of assignedStateMachines) {
        bodyLines.push(`### ${sm.entity}`);
        bodyLines.push(`**States:** ${sm.states.join(" → ")}`);
        if (sm.transitions.length > 0) {
          bodyLines.push("**Transitions:**");
          for (const t of sm.transitions) {
            bodyLines.push(
              `- ${t.from} → ${t.to} (trigger: ${t.trigger}; guard: ${t.guard})`,
            );
          }
        }
        bodyLines.push("");
      }
    }

    // Resolved decisions — conflicts between entity model and process model, resolved by SYN
    // These are the hardest-won decisions in the compilation. Claude Code must not re-litigate them.
    const contextTermsLower = contextTerms;
    const relevantConflicts = blueprint.resolvedConflicts.filter((rc) => {
      const haystack =
        `${rc.entity} ${rc.process} ${rc.resolution}`.toLowerCase();
      return contextTermsLower.some((term) => haystack.includes(term));
    });
    if (relevantConflicts.length > 0) {
      bodyLines.push("## Resolved Decisions");
      bodyLines.push(
        "These conflicts were resolved during compilation. Do not revisit them.",
      );
      bodyLines.push("");
      for (const rc of relevantConflicts) {
        bodyLines.push(
          `- **${rc.entity} vs ${rc.process}:** ${rc.resolution} _(authoritative: ${rc.authoritative})_`,
        );
      }
      bodyLines.push("");
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

    // Out of scope — agents are isolated, they don't read CLAUDE.md, so repeat here
    const globalOutOfScope = blueprint.scope?.outOfScope ?? [];
    if (globalOutOfScope.length > 0) {
      bodyLines.push("## Out of Scope");
      bodyLines.push("These were explicitly excluded during compilation:");
      for (const exc of globalOutOfScope) {
        bodyLines.push(`- ${exc}`);
      }
      bodyLines.push("");
    }

    // Non-functional requirements scoped to this bounded context or global
    const scopedNFRs = blueprint.nonFunctional.filter((nf) => {
      if (typeof nf === "string") return false;
      return nf.scope === "global" || nf.scope === comp.boundedContext;
    });
    if (scopedNFRs.length > 0) {
      bodyLines.push("## Non-Functional Requirements");
      for (const nf of scopedNFRs) {
        if (typeof nf === "string") continue;
        const label = nf.predicate
          ? `${nf.requirement} (\`${nf.predicate}\`)`
          : nf.requirement;
        bodyLines.push(
          `- **[${nf.category}]** ${label} — _verify: ${nf.verification}_`,
        );
      }
      bodyLines.push("");
    }

    // Prohibited actions
    bodyLines.push("## Prohibited Actions");
    bodyLines.push("- Do NOT modify files outside this bounded context");
    bodyLines.push("- Do NOT circumvent hook enforcement");
    bodyLines.push("- Do NOT violate invariants listed above");
    bodyLines.push("");

    const description = `Use when ${comp.boundedContext} tasks arise. Owns ${comp.name}. Does not modify files outside ${comp.boundedContext}.`;

    const frontmatter = [
      "---",
      `name: ${name}`,
      `description: ${description}`,
      `model: claude-sonnet-4-6`,
      `tools: [Bash, Read, Write, Edit, Glob, Grep]`,
      `maxTurns: 30`,
      "---",
      "",
    ].join("\n");

    agents.push({
      name,
      description,
      model: "claude-sonnet-4-6",
      tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
      status: "",
      body: frontmatter + bodyLines.join("\n"),
      path: `.claude/agents/${fileName}`,
    });
  }

  return agents;
}
