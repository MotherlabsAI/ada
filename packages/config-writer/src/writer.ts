import * as fs from "fs";
import * as path from "path";
import type { Blueprint, GovernorDecision } from "@ada/compiler";
import { generatePostcode } from "@ada/provenance";
import { blueprintToCLAUDEMD } from "./claude-md.js";
import { componentsToAgents } from "./agents.js";
import { workflowsToSkills } from "./skills.js";
import { invariantsToHooks } from "./hooks.js";
import { buildSettings } from "./settings.js";
import type { ConfigGraph } from "./types.js";

export interface WriteConfigOptions {
  readonly partial?: boolean;
  readonly warnings?: string[];
}

export function writeConfigGraph(
  blueprint: Blueprint,
  governorDecision: GovernorDecision,
  targetDir: string,
  options?: WriteConfigOptions,
): ConfigGraph {
  if (governorDecision.decision !== "ACCEPT" && !options?.partial) {
    throw new Error(
      `Cannot write config graph: Governor decision is ${governorDecision.decision}, not ACCEPT`,
    );
  }

  const writtenAgents: string[] = [];
  const writtenSkills: string[] = [];
  const writtenHooks: string[] = [];

  // 1. CLAUDE.md
  const claudeMdContent = blueprintToCLAUDEMD(blueprint, options?.warnings);
  const claudeMdPath = path.join(targetDir, "CLAUDE.md");
  fs.writeFileSync(claudeMdPath, claudeMdContent, "utf8");

  // 2. Agent .md files
  const agents = componentsToAgents(blueprint);
  for (const agent of agents) {
    const agentPath = path.join(targetDir, agent.path);
    fs.mkdirSync(path.dirname(agentPath), { recursive: true });
    fs.writeFileSync(agentPath, agent.body, "utf8");
    writtenAgents.push(agentPath);
  }

  // 3. Skill files
  const skills = workflowsToSkills(blueprint.processModel);
  for (const skill of skills) {
    const skillPath = path.join(targetDir, skill.path);
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, skill.body, "utf8");
    writtenSkills.push(skillPath);
  }

  // 4. Hook scripts
  const hooks = invariantsToHooks(blueprint.dataModel);
  for (const hook of hooks) {
    const hookPath = path.join(targetDir, hook.path);
    fs.mkdirSync(path.dirname(hookPath), { recursive: true });
    fs.writeFileSync(hookPath, hook.script, { encoding: "utf8", mode: 0o755 });
    writtenHooks.push(hookPath);
  }

  // 5. settings.json
  const settings = buildSettings(hooks);
  const settingsPath = path.join(targetDir, ".claude", "settings.json");
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");

  const postcode = generatePostcode("CFG", JSON.stringify(blueprint.postcode));

  return {
    claudeMd: claudeMdPath,
    agents: writtenAgents,
    skills: writtenSkills,
    hooks: writtenHooks,
    settings: settingsPath,
    postcode,
  };
}
