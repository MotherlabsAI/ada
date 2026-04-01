---
name: ada-runtime-governance
description: "Use when user executes 'ada run' or Claude Code session starts with MCP server configured pattern detected."
---

# ada-runtime-governance

Trigger: user executes 'ada run' or Claude Code session starts with MCP server configured

## Steps
1. **world-state-initialization**
   - Pre: `a COMPLETED CompilationRun exists with all 9 stage postcodes intact AND DelegationContract is verifiable as immutable AND MCP server process is not already running for this projectDir`
   - Action: `load DelegationContract and GovernorDecision from provenance.db; initialize WorldState machine in INITIALIZING state; register all 22 MCP tool handlers; load macro agent orchestration plan from BuildContract; mount hook scripts (pre-tool-call, post-tool-call) into Claude Code session configuration; verify .mcp.json manifest matches BuildContract.dependencies; transition WorldState to ACTIVE; open new Session record with startedAt=now`
   - Post: `WorldState is in ACTIVE state; all 22 MCP tools are registered and responding to health check; hook scripts are mounted; Session record is OPEN; DelegationContract hash matches stored immutable value (tamper detection passed)`

2. **tool-call-governance-intercept**
   - Pre: `WorldState is ACTIVE AND Session is OPEN AND incoming tool call is received by MCP pre-tool-call hook`
   - Action: `intercept tool call before execution; look up tool name against DelegationContract.allowedTools and delegation policy; check current WorldState transition: does this tool call represent a legal transition given current state and MacroPlan step?; verify tool call arguments do not reference prohibited paths or operations (e.g., modifying governance core files); if all checks pass, emit ALLOW decision and record EnvironmentFact; if any check fails, emit BLOCK decision with violation description and log DriftEvent`
   - Post: `tool call has a disposition of ALLOW or BLOCK; ALLOW calls proceed to execution; BLOCK calls are returned to Claude Code as a governance refusal with explanation; EnvironmentFact or DriftEvent recorded in WorldState; WorldState.lastToolCall updated`

3. **runtime-checkpoint-and-drift-recovery**
   - Pre: `WorldState is DRIFT_DETECTED AND at least one DriftEvent exists since last RuntimeCheckpoint AND Session is OPEN`
   - Action: `create RuntimeCheckpoint capturing current WorldState snapshot, MacroPlan progress, and all DriftEvents since last checkpoint; analyze drift pattern: is this recoverable (agent deviated from plan but can return) or terminal (agent violated delegation boundary)?; for recoverable drift: emit corrective instruction to Claude Code via MCP tool response, transition WorldState to RECOVERING; for terminal drift: transition WorldState to GOVERNANCE_VIOLATED, terminate Session, surface violation report to human`
   - Post: `RuntimeCheckpoint recorded in provenance.db; WorldState is either RECOVERING (recoverable drift) or GOVERNANCE_VIOLATED (terminal); if RECOVERING: corrective instruction was delivered; if GOVERNANCE_VIOLATED: Session.status=GOVERNANCE_VIOLATED and human alert was emitted`
