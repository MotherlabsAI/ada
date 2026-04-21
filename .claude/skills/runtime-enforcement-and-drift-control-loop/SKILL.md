---
ada_postcode: "ML.SKL.runtime-enforcement-and-drift-control-loop/v1"
ada_type: skill
ada_name: runtime-enforcement-and-drift-control-loop
ada_compiled_at: 1776806934913
---
---
name: runtime-enforcement-and-drift-control-loop
description: "Use when GovernorState polling timer fires (interval elapsed) OR ToolCall event arrives at SemanticGateEnforcer pattern detected."
---

# runtime-enforcement-and-drift-control-loop

Trigger: GovernorState polling timer fires (interval elapsed) OR ToolCall event arrives at SemanticGateEnforcer

## Steps
1. **governor-poll-world-model**
   - Pre: `GovernorState.sessionId is active; currentPollingIntervalMs has elapsed since lastPollAt; RuntimeWorldModel for sessionId is in live or drifting state`
   - Action: `read RuntimeWorldModel.observedState snapshot; compute DriftScore as weighted composite: (embeddingDistance * 0.4) + ((1 - predicateSatisfactionRatio) * 0.4) + (structuralDiffRatio * 0.2); normalize each component to [0,1]; store DriftScoreComponents; update GovernorState.currentDriftScore; compute DriftVelocity from priorScore delta over windowSizeMs; update GovernorState.lastPollAt`
   - Post: `DriftScore persisted with computedAt, sessionId, compositeComponents, normalizationScheme=WEIGHTED_LINEAR; DriftVelocity computed with windowSizeMs=GovernorState.currentPollingIntervalMs * 3; GovernorState.lastPollAt updated to now`

2. **adaptive-interval-adjustment**
   - Pre: `GovernorState.isAdaptive = true; DriftVelocity computed; DriftVelocity.value is not NaN`
   - Action: `if DriftVelocity.value > velocityAdaptationTriggerValue: halve currentPollingIntervalMs (floor at 500ms); if DriftVelocity.value < (velocityAdaptationTriggerValue * 0.3) and currentPollingIntervalMs < basePollingIntervalMs: double currentPollingIntervalMs (ceiling at basePollingIntervalMs); update GovernorState.currentPollingIntervalMs`
   - Post: `GovernorState.currentPollingIntervalMs is within [500ms, basePollingIntervalMs]; interval change is proportional to drift velocity; change is logged to ObservabilitySnapshot`

3. **drift-threshold-evaluation**
   - Pre: `DriftScore computed and valid; DriftThreshold loaded for sessionId; session is active`
   - Action: `compare DriftScore.value against DriftThreshold.projectionTriggerValue (0.25) and DriftThreshold.recompilationTriggerValue (0.65); if score >= recompilationTriggerValue emit RECOMPILATION_TRIGGER event; else if score >= projectionTriggerValue emit PROJECTION_TRIGGER event; else emit NO_ACTION`
   - Post: `exactly one of RECOMPILATION_TRIGGER, PROJECTION_TRIGGER, NO_ACTION emitted; event carries sessionId, driftScore, computedAt, triggeredThreshold`

4. **projection-engine-regeneration**
   - Pre: `PROJECTION_TRIGGER event received (score >= 0.25 and < 0.65); session is active; projection engine is registered; NOT concurrent with active recompilation`
   - Action: `regenerate projected state from current RuntimeWorldModel.observedState and CompiledWorldModel.expectedState delta; update projection artifacts (not full recompilation — no pipeline traversal); emit updated ProjectionTrigger with new projectedState; write to RuntimeWorldModel as projection update`
   - Post: `RuntimeWorldModel.version incremented; projectedState reflects corrected trajectory; projection artifact contentHash updated; AuditLogEntry written for projection regeneration event`

5. **tool-call-gate-evaluation**
   - Pre: `ToolCall event received with toolName, parameters, agentId; SemanticGateEnforcer is armed with current CompiledInvariantSet; session is active`
   - Action: `for each CompiledInvariant in CompiledInvariantSet: evaluate hardPredicate against ToolCall.parameters; check semanticAnchor proximity within proximityThreshold; collect violatedInvariantIds; determine worst-case severity across violations; emit GateDecision with verdict=ALLOW if no violations, BLOCK if any violation`
   - Post: `GateDecision persisted with id, sessionId, toolCallId, verdict, violatedInvariantIds, decidedAt, severity; GateDecision.postBlockAction assigned based on severity if blocked; AuditLogEntry written`

6. **post-block-action-dispatch**
   - Pre: `GateDecision.verdict = BLOCK; GateDecision.postBlockAction assigned; severity is one of LOW, MEDIUM, HIGH`
   - Action: `dispatch post-block action based on severity: if severity=LOW retry ToolCall with parameters modified to satisfy violated invariants (parameter relaxation within proximitThreshold); if severity=MEDIUM invoke projection engine to replan agent action sequence and resubmit revised ToolCall; if severity=HIGH halt tool call execution and escalate to operator via OperatorOverride interface`
   - Post: `for LOW: modified ToolCall re-evaluated by gate within same session; for MEDIUM: replanned ToolCall queued for gate evaluation; for HIGH: GateDecision.postBlockAction=ESCALATE recorded; operator notified via override interface; session enters degraded state pending operator response`

7. **operator-override-processing**
   - Pre: `OperatorOverride received via authorized interface; operator identity verified with required authorization level; session exists; override targets one of: gate verdict, governor interval, projection thresholds, or recompilation trigger`
   - Action: `validate override scope against immutable governance core constraint: reject any override targeting CompiledInvariant.hardPredicate or CompiledInvariantSet structure; apply override to mutable runtime parameter (gate bypass for specific toolCallId, or interval adjustment, or threshold modification); write OperatorOverride record to append-only AuditLogEntry with operatorId, overrideScope, justification, timestamp`
   - Post: `mutable runtime parameter updated; AuditLogEntry written and immutable; override is time-bounded (TTL must be set); session transitions from degraded to active if override resolves the block condition`
