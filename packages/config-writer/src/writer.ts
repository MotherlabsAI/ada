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
  // amend: when true, any file that already exists on disk is left untouched.
  // Only net-new files are written. Lets you re-run ada init against a repo
  // that already has a hand-tuned CLAUDE.md / agents / hooks without
  // clobbering that work.
  readonly amend?: boolean;
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

  const amend = options?.amend === true;
  const writeIfAbsentOrAlways = (
    p: string,
    content: string,
    mode?: number,
  ): boolean => {
    if (amend && fs.existsSync(p)) return false;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const writeOpts: fs.WriteFileOptions = { encoding: "utf8" };
    if (mode !== undefined) writeOpts.mode = mode;
    fs.writeFileSync(p, content, writeOpts);
    return true;
  };

  const writtenAgents: string[] = [];
  const writtenSkills: string[] = [];
  const writtenHooks: string[] = [];

  // 1. CLAUDE.md — preserved on amend if one already exists
  const claudeMdContent = blueprintToCLAUDEMD(blueprint, options?.warnings);
  const claudeMdPath = path.join(targetDir, "CLAUDE.md");
  writeIfAbsentOrAlways(claudeMdPath, claudeMdContent);

  // 2. Agent .md files — skip individual files that already exist on amend
  const agents = componentsToAgents(blueprint);
  for (const agent of agents) {
    const agentPath = path.join(targetDir, agent.path);
    if (writeIfAbsentOrAlways(agentPath, agent.body)) {
      writtenAgents.push(agentPath);
    }
  }

  // 3. Skill files — same amend policy
  const skills = workflowsToSkills(blueprint.processModel);
  for (const skill of skills) {
    const skillPath = path.join(targetDir, skill.path);
    if (writeIfAbsentOrAlways(skillPath, skill.body)) {
      writtenSkills.push(skillPath);
    }
  }

  // 4. Hook scripts — executable, same amend policy
  const hooks = invariantsToHooks(blueprint.dataModel);
  for (const hook of hooks) {
    const hookPath = path.join(targetDir, hook.path);
    if (writeIfAbsentOrAlways(hookPath, hook.script, 0o755)) {
      writtenHooks.push(hookPath);
    }
  }

  // 5. settings.json — preserved on amend so prior MCP/hook wiring survives
  const settings = buildSettings(hooks);
  const settingsPath = path.join(targetDir, ".claude", "settings.json");
  writeIfAbsentOrAlways(settingsPath, JSON.stringify(settings, null, 2));

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
