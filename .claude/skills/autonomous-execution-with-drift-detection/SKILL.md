---
name: autonomous-execution-with-drift-detection
description: "Use when CompilationRun.decision=ACCEPTED and user initiates execution session pattern detected."
---

# autonomous-execution-with-drift-detection

Trigger: CompilationRun.decision=ACCEPTED and user initiates execution session

## Steps
1. **open-execution-session**
   - Pre: `blueprintPostcode valid AND .ada/state.json present AND WorldState.version > 0 AND no active Session with same runId exists AND execution-orchestrator agent file loaded`
   - Action: `create Session(sessionId=uuid(), startedAt=now(), toolCallCount=0, driftEvents=[]); load WorldState from .ada/state.json; verify WorldState.runId matches current CompilationRun.runId; instantiate MacroPlan from blueprint process model; write Session record to storage; register PostToolUse hook`
   - Post: `Session.status=OPEN; MacroPlan.tasks populated and ordered; WorldState loaded and version matches expected; PostToolUse hook active and writing to .ada/session-log.jsonl; delegationDepth=0`

2. **delegate-task-to-bounded-context-agent**
   - Pre: `Session.status=ACTIVE AND MacroPlan.nextTask is defined AND DelegationContract for target bounded context is valid AND WorldState.delegationDepth < maxRecursionDepth AND target agent file exists at .claude/agents/{context}.md`
   - Action: `construct DelegationContract(context=nextTask.boundedContext, scope=nextTask.scope, stopConditions=blueprint.stopConditions, requiredEvidence=nextTask.acceptanceCriteria, compiledAt=now(), blueprintPostcode=current); increment WorldState.delegationDepth; invoke bounded-context agent with contract and current WorldState snapshot; log delegation in WorldState.activeDelegations`
   - Post: `DelegationContract.status=ACTIVE; WorldState.activeDelegations contains new contract; target agent is executing within declared scope; WorldState.delegationDepth incremented by 1; DelegationContract written to .ada/state.json`

3. **continuous-drift-detection**
   - Pre: `Session.status=ACTIVE AND WorldState loaded AND blueprint process model available for comparison AND PostToolUse hook is firing`
   - Action: `on each PostToolUse event: capture actual tool output; compare against blueprint's expected WorldState at this execution point; compute drift score = semantic_distance(actual, expected); if drift_score > threshold emit DriftEvent(severity=computed, location=current_task, original=expected, actual=actual, detectedAt=now()); write DriftEvent to Session.driftEvents; update .ada/session-log.jsonl`
   - Post: `all tool calls have corresponding PostToolUse log entries in .ada/session-log.jsonl; DriftEvents with severity >= MEDIUM are persisted to Session.driftEvents; WorldState.uncertaintyScore updated based on drift accumulation; no DriftEvent is silently dropped`

4. **close-execution-session**
   - Pre: `Session.status=ACTIVE AND (MacroPlan.completedTasks = MacroPlan.totalTasks OR stop condition triggered OR user requests close) AND session-log.jsonl flushed`
   - Action: `fire SessionEnd hook; set Session.endedAt=now(); compute Session.finalConfidence from DriftEvent history and task completion rate; set Session.decision=COMPLETED|PARTIAL|ABORTED; persist final Session record to storage; release all active DelegationContracts; decrement WorldState.delegationDepth to 0; persist final WorldState to .ada/state.json; write .ada/sessions/{sessionId}.json; trigger self-improvement workflow`
   - Post: `Session.status=CLOSED; .ada/sessions/{sessionId}.json exists with complete session data; WorldState.delegationDepth=0; all DelegationContracts released; self-improvement workflow has been signalled with sessionId; sessionCount incremented in WorldState`
