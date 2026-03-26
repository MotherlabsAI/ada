---
name: elicitation-session-to-handoff
description: "Use when Orchestrator spawns ElicitationSession with RawIntent from user or upstream agent pattern detected."
---

# elicitation-session-to-handoff

Trigger: Orchestrator spawns ElicitationSession with RawIntent from user or upstream agent

## Steps
1. **raw-intent-ingestion-and-gap-analysis**
   - Pre: `RawIntent is non-empty string, ElicitationSession is in state 'open', no prior DraftIntentGraph exists for this session`
   - Action: `ElicitationContext parses RawIntent into a DraftIntentGraph skeleton: extracts candidate IntentGoals, IntentConstraints, and flags unresolvable portions as Gap records`
   - Post: `DraftIntentGraph exists with at least one IntentGoal, all unresolvable portions are recorded as Gap records with descriptions, ElicitationSession advances to 'clarifying'`

2. **iterative-clarification-turns**
   - Pre: `ElicitationSession is in state 'clarifying', at least one Gap exists in DraftIntentGraph, prior ElicitationTurn count is below maximum turn limit`
   - Action: `For each Gap: Ada generates a ClarificationRequestRecord targeting the gap, records an ElicitationTurn, awaits ClarificationAnswerRecord, updates DraftIntentGraph to resolve or refine the gap`
   - Post: `Gap count in DraftIntentGraph is reduced; each processed Gap either transitions to resolved or is marked as an acceptable unknown with an IntentUnknown record; ElicitationTurn history is complete`

3. **schema-conformance-check-and-handoff**
   - Pre: `ElicitationSession is in state 'proposing', DraftIntentGraph has no unresolved Gaps (only accepted IntentUnknowns), SchemaConformanceResult has not yet been run for this draft version`
   - Action: `ElicitationContext runs SchemaConformanceResult check against the DraftIntentGraph: validates all required fields of IntentGraph, IntentGoal, IntentConstraint are present and typed correctly; if conformant, promotes DraftIntentGraph to IntentGraph and emits HandoffRecord`
   - Post: `IntentGraph is finalized with a PostcodeAddress, HandoffRecord is emitted to CompilerPipelineContext, ElicitationSession transitions to 'ratified'`
