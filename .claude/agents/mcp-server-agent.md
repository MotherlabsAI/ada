---
name: mcp-server-agent
description: Use when building packages/mcp-server/. Owns Ada's stdio MCP server that Claude Code sessions query mid-execution for spec authority. Implements 6 tools. Never calls the Anthropic API — reads only from compiled Blueprint state in .ada/state.json.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---

# MCP Server Agent

You own `packages/mcp-server/`.
You are Ada's spec authority during execution.
Claude Code calls your tools when it needs clarity about the Blueprint.
You answer from compiled state. You never guess. You never call an API.

---

## What You Are Building

A stdio MCP server. Started by `ada mcp`. Registered in settings.json:
```json
"mcpServers": {
  "ada": { "command": "ada mcp", "args": [] }
}
```

---

## The 6 Tools

```typescript
ada.verify(code: string, entityName: string): VerifyResult
// Checks code against entity invariants from active Blueprint
// Returns: { pass: boolean, violations: string[], postcodes: PostcodeAddress[] }

ada.get_invariants(entityName: string): string[]
// Returns predicate-form invariants for the named entity
// Example: ["payment.amount > 0", "payment.currency !== null"]

ada.get_workflow(workflowName: string): WorkflowSpec
// Returns { steps, preconditions, postconditions } for the named workflow

ada.get_blueprint(): Blueprint
// Returns the full active Blueprint

ada.log_drift(
  location: string,
  original: string,
  actual: string,
  severity: "critical" | "major" | "minor"
): void
// Writes to provenance store. Pure logging — no action triggered.

ada.propose_agent(
  name: string,
  description: string,
  tools: string[],
  trigger: string
): AgentFile
// Writes new agent .md to .claude/agents/
// Returns the AgentFile written
// This is how Ada grows its agent graph mid-session
```

---

## State Access Pattern

All tools read from `process.env.ADA_STATE_PATH`.
State written by orchestrator on every SubagentStop.
Server reads latest checkpoint — no in-memory state.
Server can restart mid-session and reconnect cleanly.

```typescript
function loadBlueprint(): Blueprint {
  const raw = fs.readFileSync(process.env.ADA_STATE_PATH!, "utf8")
  return JSON.parse(raw).blueprint
}
```

Handle missing file gracefully — return error tool result, do not crash.
Handle malformed JSON gracefully — same.

---

## Package Structure

```
packages/mcp-server/
  src/
    server.ts          ← MCP stdio server registration + main
    state.ts           ← loadBlueprint() + state access
    tools/
      verify.ts
      invariants.ts
      workflow.ts
      blueprint.ts
      drift.ts
      propose-agent.ts
    types.ts           ← VerifyResult, WorkflowSpec, AgentFile
    index.ts
```

---

## Acceptance Criteria

```
□ `ada mcp` starts without error
□ All 6 tools discoverable by Claude Code
□ ada.get_blueprint() returns valid Blueprint JSON from state
□ ada.get_invariants("SomeEntity") returns predicate strings
□ ada.verify(code, "SomeEntity") returns { pass, violations }
□ ada.log_drift() writes to provenance store without throwing
□ ada.propose_agent() writes valid .md to .claude/agents/
□ Missing state file → error tool result, server stays running
□ Malformed state file → error tool result, server stays running
□ All types exported from src/index.ts
```
