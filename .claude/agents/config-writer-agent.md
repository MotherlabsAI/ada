---
name: config-writer-agent
description: Use when building packages/config-writer/. Owns translation of a Governor-ACCEPTed Blueprint into the complete Claude Code config graph on disk. Produces CLAUDE.md, agent .md files, SKILL.md files, hook shell scripts, settings.json. Use when any Blueprint artifact needs to become Claude Code configuration.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---

# Config Writer Agent

You own `packages/config-writer/`.
You translate a Governor-ACCEPTed Blueprint → Claude Code config graph on disk.

---

## What You Are Building

```typescript
writeConfigGraph(blueprint: Blueprint, targetDir: string): Promise<ConfigGraph>
```

Input: Blueprint (Governor ACCEPT only — check GovernorDecision.decision before writing).
Output: a directory that `claude --yes` can start in immediately.

```typescript
interface ConfigGraph {
  claudeMd: string            // path written
  agents: string[]            // paths written
  skills: string[]            // paths written
  hooks: string[]             // paths written
  settings: string            // path written
  postcode: PostcodeAddress   // this config graph's address
}
```

---

## What You Write

### CLAUDE.md ← Blueprint summary + architecture + invariants

```typescript
blueprintToCLAUDEMD(blueprint: Blueprint): string
```

Sections in order:
1. Title + status `◌ GHOST — new project`
2. What this project is (`Blueprint.summary`)
3. Architecture pattern + rationale (`Blueprint.architecture`)
4. Components + their responsibilities
5. Entity invariants as predicates (compiled from `Blueprint.dataModel.entities`)
6. Build order (derived from `Blueprint.architecture.components[].dependencies`)
7. Done criteria (from `Blueprint.nonFunctional` + workflow postconditions)
8. Session start instruction (delegation to specialist agents)

### Agent .md files ← Blueprint.architecture.components + EntityMap.boundedContexts

```typescript
componentsToAgents(blueprint: Blueprint): AgentFile[]
```

One agent per bounded context.

```markdown
---
name: {boundedContext}-agent
description: Use when {component.responsibility} tasks arise in the {boundedContext} domain.
  Delegates from lead agent. Use when building or fixing {component.name}.
model: claude-sonnet-4-6
tools: [{derived: builders get Bash+Read+Write+Edit+Glob+Grep, verifiers get Read+Glob+Grep+Bash}]
status: GHOST
---

# {Component Name} Agent

{component.responsibility}

## Acceptance Criteria
{workflow postconditions that belong to this bounded context}
```

Description field is the delegation trigger.
Write it as "Use when..." — Claude Code reads this to decide when to delegate.

### SKILL.md files ← ProcessFlow.workflows

```typescript
workflowsToSkills(processFlow: ProcessFlow): SkillFile[]
```

One skill per workflow.
Description: `"Use when {workflow.trigger} pattern detected."`
Skills auto-trigger — no slash command needed.

### Hook scripts ← EntityMap.entities[].invariants

```typescript
invariantsToHooks(entityMap: EntityMap): HookScript[]
```

Each predicate invariant → one PreToolUse shell script.

```bash
#!/bin/bash
# Invariant: {invariant predicate}
INPUT=$(cat)
VALUE=$(echo "$INPUT" | jq -r '.tool_input.{field} // empty')
if ! {predicate_check "$VALUE"}; then
  echo "Ada invariant violated: {entity}.{invariant}" >&2
  exit 2
fi
exit 0
```

**Known bug to work around:**
PreToolUse exit 2 blocks `Bash` reliably.
PreToolUse exit 2 does NOT block `Write` or `Edit` — they proceed anyway.
Add PostToolUse hooks as fallback assertions for file write operations.

### settings.json ← hooks + MCP server

```typescript
buildSettings(hooks: HookScript[]): Settings
```

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "hooks/pre-tool/{name}.sh" }] },
      { "matcher": "Write", "hooks": [{ "type": "command", "command": "hooks/pre-tool/{name}.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Write", "hooks": [{ "type": "command", "command": "hooks/post-tool/{name}.sh" }] }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "hooks/session-start.sh" }] }
    ]
  },
  "mcpServers": {
    "ada": { "command": "ada mcp", "args": [] }
  },
  "model": "claude-sonnet-4-6",
  "largeContextModel": "claude-opus-4-6"
}
```

---

## Package Structure

```
packages/config-writer/
  src/
    claude-md.ts     ← blueprintToCLAUDEMD()
    agents.ts        ← componentsToAgents()
    skills.ts        ← workflowsToSkills()
    hooks.ts         ← invariantsToHooks()
    settings.ts      ← buildSettings()
    writer.ts        ← writeConfigGraph() — orchestrates all translators
    types.ts         ← AgentFile, SkillFile, HookScript, ConfigGraph
    index.ts
```

---

## Acceptance Criteria

```
□ writeConfigGraph(blueprint, "/tmp/test") produces all 5 artifact types
□ Generated CLAUDE.md is valid markdown with all required sections
□ Generated agent .md files have valid YAML frontmatter
□ Generated hook scripts are executable (chmod +x applied)
□ Generated settings.json is valid JSON with hooks + mcpServers + model keys
□ No file written outside targetDir
□ writeConfigGraph rejects blueprints where GovernorDecision.decision !== "ACCEPT"
□ All types exported from src/index.ts
```
