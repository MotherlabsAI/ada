import type { ProcessFlow } from "@ada/compiler";
import type { SkillFile } from "./types.js";

export function workflowsToSkills(processFlow: ProcessFlow): SkillFile[] {
  const skills: SkillFile[] = [];

  for (const workflow of processFlow.workflows) {
    const name = workflow.name.toLowerCase().replace(/\s+/g, "-");
    const fileName = `${name}`;

    const steps = workflow.steps.map((step, i) => {
      return `${i + 1}. **${step.name}**
   - Pre: \`${step.hoareTriple.precondition}\`
   - Action: \`${step.hoareTriple.action}\`
   - Post: \`${step.hoareTriple.postcondition}\``;
    });

    const body = `---
name: ${name}
description: "Use when ${workflow.trigger} pattern detected."
---

# ${workflow.name}

Trigger: ${workflow.trigger}

## Steps
${steps.join("\n\n")}
`;

    skills.push({
      name,
      description: `Use when ${workflow.trigger} pattern detected.`,
      body,
      path: `.claude/skills/${fileName}/SKILL.md`,
    });
  }

  return skills;
}
