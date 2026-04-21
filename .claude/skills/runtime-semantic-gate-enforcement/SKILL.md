---
ada_postcode: "ML.SKL.runtime-semantic-gate-enforcement/v1"
ada_type: skill
ada_name: runtime-semantic-gate-enforcement
ada_compiled_at: 1776808391825
---
---
name: runtime-semantic-gate-enforcement
description: "Use when PreToolUse hook fires on any Claude Code tool invocation during active session pattern detected."
---

# runtime-semantic-gate-enforcement

Trigger: PreToolUse hook fires on any Claude Code tool invocation during active session

## Steps
1. **hook-intercept-and-actor-classification**
   - Pre: `PreToolUseHook is active with valid hookId and scriptBody; BootstrapSeed contentHash verified at session start; WorldModel loaded from .ada/world-model.json; calling actor context available`
   - Action: `PreToolUseHook matcher evaluates incoming tool call; identify ActorClass of caller from WorldModel WHO entity registry; load ActorClass record with defaultViolationClass and defaultVerdict; timestamp interception as emittedAt`
   - Post: `ActorClass resolved for this tool call; tool call held pending gate verdict; emittedAt recorded; no tool execution has occurred yet`

2. **drift-score-computation**
   - Pre: `ActorClass resolved; WorldModel available with current blueprint node and embeddings; DriftScoreCalculator initialized with embeddingProviderRef; EmbeddingProvider singleton available`
   - Action: `DriftScoreCalculator computes three weighted components: semanticDivergence (current context embedding vs intent embedding), blueprintStaleness (blueprint postcode age vs WorldModel mutation timestamp), intentDrift (current task embedding vs original compilationRunId intent); sum weighted components into DriftScore.value`
   - Post: `DriftScore record persisted with all three components, calculatedAt, compilationRunId, and exceedsThreshold boolean (threshold=0.3); log_drift MCP tool called to persist score; if exceedsThreshold=true ContinuousGovernor must be activated`

3. **gate-verdict-and-dispatch**
   - Pre: `DriftScore computed; ActorClass with defaultViolationClass and defaultVerdict available; ContinuousGovernor status known; gateId assigned for this PreToolUse event`
   - Action: `combine ActorClass defaultViolationClass with DriftScore exceedsThreshold to determine violationClass; apply verdict logic: HARD→HALT or ESCALATE, SOFT→RETRY or REPLAN; if no violation allow tool execution; if violation construct GateFailurePayload with all required fields (gateId, entropyValue, failingInvariantRef, compilationRunId, violationClass, actorClass, gateVerdict, emittedAt); emit payload — never emit plain error string`
   - Post: `exactly one outcome: tool execution allowed with no payload, or GateFailurePayload emitted with tool execution blocked; GateFailurePayload contains all eight required fields if emitted; ContinuousGovernor activationLog updated with this gate event; verdict is irrevocable for this PreToolUse event`
