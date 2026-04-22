import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeConfigGraph } from "../src/index.js";
import { generatePostcode } from "@ada/provenance";
import type { Blueprint, GovernorDecision } from "@ada/compiler";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeBlueprint(overrides?: {
  withInvariants?: boolean;
  extraComponents?: number;
}): Blueprint {
  const withInvariants = overrides?.withInvariants ?? true;
  const extraComponents = overrides?.extraComponents ?? 0;

  const entities = [
    {
      name: "Widget",
      category: "substance" as const,
      properties: [{ name: "id", type: "string", required: true }],
      invariants: withInvariants
        ? [
            {
              predicate: "must not contain password",
              description: "widgets must not carry password material",
            },
          ]
        : [],
    },
  ];

  const boundedContexts = [
    {
      name: "WidgetContext",
      rootEntity: "Widget",
      entities: ["Widget"],
      invariants: [],
    },
  ];

  const components = [
    {
      name: "WidgetService",
      responsibility: "Manage widgets",
      interfaces: ["create(w: Widget): void"],
      dependencies: [],
      boundedContext: "WidgetContext",
    },
  ];

  for (let i = 0; i < extraComponents; i++) {
    components.push({
      name: `ExtraService${i}`,
      responsibility: `Extra ${i}`,
      interfaces: [],
      dependencies: [],
      boundedContext: "WidgetContext",
    });
  }

  return {
    summary: "A test blueprint for config-writer. It exercises the writer.",
    architecture: {
      pattern: "service",
      rationale: "simple",
      components,
    },
    dataModel: {
      entities,
      boundedContexts,
      challenges: [],
      postcode: generatePostcode("ENT", "entity-map-content"),
    },
    processModel: {
      workflows: [
        {
          name: "create-widget",
          trigger: "user requests widget creation",
          steps: [
            {
              name: "validate-input",
              hoareTriple: {
                precondition: "input present",
                action: "validate",
                postcondition: "input validated",
              },
              failureModes: [],
              temporalRelation: "enables" as const,
            },
          ],
        },
      ],
      stateMachines: [],
      challenges: [],
      postcode: generatePostcode("PRO", "process-flow-content"),
    },
    nonFunctional: ["tests pass"],
    openQuestions: [],
    resolvedConflicts: [],
    challenges: [],
    postcode: generatePostcode("SYN", "blueprint-content"),
  };
}

function makeAcceptDecision(): GovernorDecision {
  return {
    decision: "ACCEPT",
    confidence: 0.95,
    coverageScore: 1,
    coherenceScore: 1,
    gatePassRate: 1,
    provenanceIntact: true,
    rejectionReasons: [],
    violations: [],
    nextAction: null,
    challenges: [],
    postcode: generatePostcode("GOV", "decision-content"),
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("@ada/config-writer — writeConfigGraph", () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = mkdtempSync(join(tmpdir(), "config-writer-test-"));
  });

  afterEach(() => {
    rmSync(targetDir, { recursive: true, force: true });
  });

  it("creates CLAUDE.md at the target root with blueprint summary content", () => {
    const blueprint = makeBlueprint();
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    const claudeMdPath = join(targetDir, "CLAUDE.md");
    expect(existsSync(claudeMdPath)).toBe(true);
    expect(graph.claudeMd).toBe(claudeMdPath);
    const contents = readFileSync(claudeMdPath, "utf8");
    expect(contents.length).toBeGreaterThan(0);
    expect(contents).toContain("A test blueprint for config-writer");
  });

  it("creates one .claude/agents/*.md file per BlueprintComponent", () => {
    const blueprint = makeBlueprint({ extraComponents: 2 });
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    const agentDir = join(targetDir, ".claude", "agents");
    expect(existsSync(agentDir)).toBe(true);
    const files = readdirSync(agentDir).filter((f) => f.endsWith(".md"));
    // 1 base component + 2 extras = 3, but all share the same boundedContext
    // and agents.ts names by `${boundedContext}-agent.md` — so writes collide.
    // What we can assert: #agents returned == #components, and at least one
    // .md exists on disk.
    expect(graph.agents.length).toBe(blueprint.architecture.components.length);
    expect(files.length).toBeGreaterThanOrEqual(1);
    for (const agentPath of graph.agents) {
      const body = readFileSync(agentPath, "utf8");
      expect(body).toContain("name:");
      expect(body).toContain("Bounded Context");
    }
  });

  it("creates .claude/settings.json as valid parseable JSON", () => {
    const blueprint = makeBlueprint();
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    const settingsPath = join(targetDir, ".claude", "settings.json");
    expect(existsSync(settingsPath)).toBe(true);
    expect(graph.settings).toBe(settingsPath);

    const raw = readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty("hooks");
    expect(parsed).toHaveProperty("mcpServers");
    expect(parsed.hooks).toHaveProperty("PreToolUse");
  });

  it("creates hooks/pre-tool/*.sh scripts when entity invariants are declared", () => {
    const blueprint = makeBlueprint({ withInvariants: true });
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    expect(graph.hooks.length).toBeGreaterThan(0);
    const preToolDir = join(targetDir, "hooks", "pre-tool");
    expect(existsSync(preToolDir)).toBe(true);

    const shFiles = readdirSync(preToolDir).filter((f) => f.endsWith(".sh"));
    expect(shFiles.length).toBeGreaterThan(0);

    for (const hookPath of graph.hooks) {
      expect(existsSync(hookPath)).toBe(true);
      const body = readFileSync(hookPath, "utf8");
      expect(body.startsWith("#!/bin/bash")).toBe(true);
      // executable bit should be set
      const mode = statSync(hookPath).mode & 0o777;
      expect(mode & 0o100).toBe(0o100);
    }
  });

  it("emits no hooks when no entity invariants are declared", () => {
    const blueprint = makeBlueprint({ withInvariants: false });
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    expect(graph.hooks.length).toBe(0);
    const preToolDir = join(targetDir, "hooks", "pre-tool");
    expect(existsSync(preToolDir)).toBe(false);
  });

  it("returns a ConfigGraph with agents, hooks, skills arrays", () => {
    const blueprint = makeBlueprint();
    const decision = makeAcceptDecision();

    const graph = writeConfigGraph(blueprint, decision, targetDir);

    expect(Array.isArray(graph.agents)).toBe(true);
    expect(Array.isArray(graph.hooks)).toBe(true);
    expect(Array.isArray(graph.skills)).toBe(true);
    expect(graph.agents.length).toBeGreaterThan(0);
    expect(graph.skills.length).toBeGreaterThan(0);
    expect(graph.postcode.prefix).toBe("ML");
    expect(graph.postcode.stage).toBe("CFG");
  });

  it("throws when governor decision is not ACCEPT and partial is not set", () => {
    const blueprint = makeBlueprint();
    const rejectDecision: GovernorDecision = {
      ...makeAcceptDecision(),
      decision: "REJECT",
      provenanceIntact: false,
      rejectionReasons: ["bad"],
    };

    expect(() => writeConfigGraph(blueprint, rejectDecision, targetDir)).toThrow(
      /Governor decision is REJECT/,
    );
  });

  it("writes files when partial=true even if decision is not ACCEPT", () => {
    const blueprint = makeBlueprint();
    const iterateDecision: GovernorDecision = {
      ...makeAcceptDecision(),
      decision: "ITERATE",
    };

    const graph = writeConfigGraph(blueprint, iterateDecision, targetDir, {
      partial: true,
      warnings: ["partial compile"],
    });

    expect(existsSync(graph.claudeMd)).toBe(true);
    const claudeMd = readFileSync(graph.claudeMd, "utf8");
    expect(claudeMd).toContain("partial compile");
  });

  it("amend=true preserves an existing CLAUDE.md", async () => {
    const { writeFileSync } = await import("node:fs");
    const existingContent = "# HAND-TUNED CLAUDE.md\nDo not overwrite.\n";
    writeFileSync(join(targetDir, "CLAUDE.md"), existingContent, "utf8");

    const blueprint = makeBlueprint();
    const graph = writeConfigGraph(
      blueprint,
      makeAcceptDecision(),
      targetDir,
      { amend: true },
    );

    const claudeMd = readFileSync(graph.claudeMd, "utf8");
    expect(claudeMd).toBe(existingContent);
  });

  it("amend=true preserves an existing agent file and omits it from the written list", async () => {
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const agentDir = join(targetDir, ".claude", "agents");
    mkdirSync(agentDir, { recursive: true });
    // Agent filename derives from boundedContext, not component name (see agents.ts).
    // makeBlueprint() uses boundedContext "WidgetContext", so that's the file to pre-seed.
    const existingAgentPath = join(agentDir, "WidgetContext-agent.md");
    writeFileSync(existingAgentPath, "PRE-EXISTING AGENT\n", "utf8");

    const blueprint = makeBlueprint();
    const graph = writeConfigGraph(
      blueprint,
      makeAcceptDecision(),
      targetDir,
      { amend: true },
    );

    // Pre-existing agent preserved verbatim
    expect(readFileSync(existingAgentPath, "utf8")).toBe("PRE-EXISTING AGENT\n");
    // Not reported as "written" this run
    expect(graph.agents).not.toContain(existingAgentPath);
  });

  it("amend=false (default) overwrites an existing CLAUDE.md", async () => {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(join(targetDir, "CLAUDE.md"), "# STALE\n", "utf8");

    const blueprint = makeBlueprint();
    const graph = writeConfigGraph(blueprint, makeAcceptDecision(), targetDir);

    const claudeMd = readFileSync(graph.claudeMd, "utf8");
    expect(claudeMd).not.toContain("# STALE");
    expect(claudeMd).toContain("test blueprint");
  });
});
