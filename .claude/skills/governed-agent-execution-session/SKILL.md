---
ada_postcode: "ML.SKL.governed-agent-execution-session/v1"
ada_type: skill
ada_name: governed-agent-execution-session
ada_compiled_at: 1776596371488
---
---
name: governed-agent-execution-session
description: "Use when WorldState is initialized, MacroPlan is active with pending tasks, and at least one DelegationContract is in COMPILED state pattern detected."
---

# governed-agent-execution-session

Trigger: WorldState is initialized, MacroPlan is active with pending tasks, and at least one DelegationContract is in COMPILED state

## Steps
1. **initialize-world-state-snapshot**
   - Pre: `blueprintPostcode is valid and resolvable AND .ada/state.json exists AND no active DelegationContracts from prior session are in VIOLATED state AND Session entity does not yet exist for this run`
   - Action: `agent reads .ada/state.json; constructs WorldState with current environmentFacts, components, sessionCount incremented, delegationDepth=0, activeDelegations=[]; creates Session entity with sessionId and startedAt; validates that governance core artifacts (CLAUDE.md, compiled intent, invariants) have not been mutated since blueprintPostcode was recorded`
   - Post: `WorldState.version is incremented; Session.status == INITIALIZING; governance core integrity confirmed (postcodes match); delegationDepth == 0; sessionCount reflects this session; CompilationRun referenced by WorldState.runId is COMPLETE`

2. **compile-and-validate-delegation-contract**
   - Pre: `Session.status == INITIALIZING AND MacroPlan.nextTask is defined AND WorldState.delegationDepth == 0 AND blueprintPostcode is recorded`
   - Action: `macro-planner compiles DelegationContract for the next task: sets context, componentName, scope (fileScope boundaries), stopConditions, requiredEvidence, reportingCadence, maxRecursionDepth; stamps compiledAt and blueprintPostcode; validates that scope does not include governance core files; assigns contract to target domain agent`
   - Post: `DelegationContract.status == COMPILED; DelegationContract.blueprintPostcode matches WorldState's blueprintPostcode; DelegationContract.scope excludes CLAUDE.md, compiled intent, invariant files; maxRecursionDepth is set and <= system maximum; DelegationContract recorded in WorldState.activeDelegations`

3. **execute-domain-agent-task**
   - Pre: `DelegationContract.status == COMPILED AND WorldState.delegationDepth < DelegationContract.maxRecursionDepth AND domain agent is identified and available AND Session.status == EXECUTING`
   - Action: `domain agent executes task within DelegationContract.scope boundaries; each tool call increments WorldState.totalToolCalls; if sub-delegation needed, domain agent issues child DelegationContract with delegationDepth+1; agent reports progress at reportingCadence intervals; stops on any stopCondition trigger; produces requiredEvidence on completion`
   - Post: `task output exists and is within fileScope; requiredEvidence is produced and addressable; WorldState.totalToolCalls reflects all tool calls made; DelegationContract.status == ACTIVE throughout; delegationDepth returns to pre-task level after completion; no governance core files were written`

4. **verify-task-output**
   - Pre: `domain agent task is complete AND requiredEvidence is addressable AND DelegationContract.status == ACTIVE AND verifier agent is independent (not the executing domain agent)`
   - Action: `verifier agent reads task output and requiredEvidence; checks against DelegationContract.scope, stopConditions, and Blueprint invariants; verifier ONLY reads and emits VerificationReport — it never writes files, never calls tools that modify state, never implements fixes; records confidence score and any drift observations`
   - Post: `VerificationReport exists with verifierAgentId != executingAgentId; VerificationReport.decision is PASS or FAIL; if FAIL: specific invariant violations listed with evidence; verifier has made zero state-modifying tool calls; Session.finalConfidence updated`

5. **handle-drift-and-checkpoint**
   - Pre: `DriftEvent has been emitted during session AND Session.status == EXECUTING AND WorldState is current`
   - Action: `agent captures RuntimeCheckpoint: serializes current WorldState including activeDelegations, delegationDepth, totalToolCalls, driftEvents list; classifies drift severity (MINOR, MAJOR, CRITICAL); MINOR drift: log and continue; MAJOR drift: pause execution, checkpoint, notify macro-planner; CRITICAL drift: halt session, checkpoint, require human review`
   - Post: `RuntimeCheckpoint persists with capturedAt timestamp and full WorldState snapshot; Session.driftEvents includes the triggering DriftEvent; drift classification is recorded; for MAJOR/CRITICAL: Session.status updated to DRIFTED; for CRITICAL: all active DelegationContracts suspended`

6. **close-session-and-update-state**
   - Pre: `MacroPlan.completedTasks == MacroPlan.totalTasks OR Session.status == DRIFTED (CRITICAL) OR explicit session close requested AND all active DelegationContracts are in ACTIVE, EXPIRED, or VIOLATED state (none in DRAFT or COMPILED without execution)`
   - Action: `agent resolves all active DelegationContracts to terminal state (EXPIRED or VIOLATED); records Session.endedAt, toolCallCount, finalConfidence, decision (ACCEPT or ESCALATE); writes final WorldState to .ada/state.json with updated sessionCount, checkpoints, totalToolCalls; produces AuditReport for session; clears activeDelegations`
   - Post: `Session.status == CLOSED; Session.endedAt is set; .ada/state.json reflects final WorldState; activeDelegations is empty; all DelegationContracts referenced in session are in terminal state; AuditReport exists for session; WorldState.sessionCount == prior sessionCount + 1`
