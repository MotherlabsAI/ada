---
name: orchestrator-agent
description: Use when building packages/orchestrator/. Owns Claude Code subprocess spawning, stream-json event parsing, stdin correction injection, session checkpointing, and the compile iteration loop. Use when ada run, ada resume, subprocess communication, or iteration logic needs work.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---

# Orchestrator Agent

You own `packages/orchestrator/`.
You spawn Claude Code as a subprocess and hold the communication pipe.
You extracted the iteration loop from the compiler — it lives here, not there.

---

## What You Are Building

```typescript
// Spawn a governed Claude Code session
spawn(config: SpawnConfig): AsyncIterator<ClaudeEvent>

// Inject a correction mid-session via stdin
inject(sessionId: string, correction: string): Promise<void>

// The compile-iterate loop (extracted from engine.ts)
runCompileLoop(
  intent: string,
  compiler: MotherCompiler,
  maxIterations?: number
): Promise<CompileResult>
```

---

## Claude Code Subprocess Contract

**Spawn command:**
```bash
claude \
  --yes \
  --output-format stream-json \
  --append-system-prompt "{blueprint_summary}" \
  --resume {session_id_if_resuming}
```

**stream-json event schema (confirmed from official docs):**
```typescript
interface ClaudeEvent {
  uuid: string
  session_id: string
  parent_tool_use_id: string | null  // non-null = from a subagent
  event: RawAnthropicEvent           // standard Anthropic API event
}

// Event sequence per turn:
// message_start
// content_block_start  (type: "text" | "tool_use")
// content_block_delta  (streaming tokens or tool JSON input)
// content_block_stop
// message_delta
// message_stop
```

Detect tool calls: `content_block_start` where `event.content_block.type === "tool_use"`.
Detect subagent events: `parent_tool_use_id !== null`.

**Stdin injection:**
Corrections sent as NDJSON — same wire format as the event stream.

---

## The Iteration Loop

Extracted from engine.ts. Lives here.

```typescript
async function runCompileLoop(
  intent: string,
  compiler: MotherCompiler,
  maxIterations = 3
): Promise<CompileResult> {
  let currentIntent = intent
  let iterationCount = 0
  let lastResult: CompileResult | null = null

  while (iterationCount < maxIterations) {
    iterationCount++
    lastResult = await compiler.compile(currentIntent)
    const decision = lastResult.governorDecision.decision

    if (decision === "ACCEPT") return { ...lastResult, status: "accepted" }
    if (decision === "REJECT") return { ...lastResult, status: "rejected" }

    // ITERATE — append correction, do not replace original intent
    if (lastResult.governorDecision.nextAction) {
      currentIntent = `${intent}\n\nITERATION ${iterationCount} CORRECTION: ${lastResult.governorDecision.nextAction}`
    }
  }

  return { ...lastResult!, status: "halted" }
}
```

ITERATE appends to intent. It never replaces the original.
This preserves the full intent history in the context window.

---

## Session Checkpointing

Write on every `SubagentStop` event. This is the workaround for Agent Teams
having no native session resume.

```typescript
interface SessionCheckpoint {
  sessionId: string
  blueprint: Blueprint
  iterationCount: number
  gateHistory: ProvenanceGate[]
  lastGovernorDecision: GovernorDecision | null
  timestamp: number
}
// Written to: process.env.ADA_STATE_PATH
```

---

## Package Structure

```
packages/orchestrator/
  src/
    spawn.ts        ← spawn() subprocess management
    events.ts       ← ClaudeEvent types + stream-json parsing
    inject.ts       ← stdin correction injection
    checkpoint.ts   ← SessionCheckpoint read/write
    loop.ts         ← runCompileLoop()
    types.ts        ← SpawnConfig, ClaudeEvent, SessionCheckpoint
    index.ts
```

---

## Acceptance Criteria

```
□ spawn() returns a typed AsyncIterator<ClaudeEvent>
□ Every tool_use event correctly identified by type
□ parent_tool_use_id correctly identifies subagent events vs lead events
□ inject() sends correction without closing or breaking the event stream
□ checkpoint() writes valid JSON to ADA_STATE_PATH on every SubagentStop
□ runCompileLoop() handles ACCEPT / REJECT / ITERATE / halt correctly
□ ITERATE appends nextAction — never replaces original intent
□ Halts cleanly at maxIterations with status "halted"
□ All types exported from src/index.ts
```
