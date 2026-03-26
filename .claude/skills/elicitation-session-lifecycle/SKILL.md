---
name: elicitation-session-lifecycle
description: "Use when user submits raw intent text to begin a new elicitation session pattern detected."
---

# elicitation-session-lifecycle

Trigger: user submits raw intent text to begin a new elicitation session

## Steps
1. **capture-raw-intent**
   - Pre: `no active ElicitationSession exists for this invocation AND submitted text is non-empty AND characterCount > 0`
   - Action: `create RawIntent record with text and capturedAt; create ElicitationSession with status=intake and bind rawIntentId; emit session acknowledgement`
   - Post: `ElicitationSession.status = active; ElicitationSession.rawIntentId is set; RawIntent.sessionId is bound; startedAt is recorded`

2. **initialize-draft-intent-graph**
   - Pre: `ElicitationSession.status = active AND ElicitationSession.rawIntentId is set AND no DraftIntentGraph yet exists for this session`
   - Action: `parse RawIntent.text using surface extraction heuristics; attempt to pre-populate goals, constraints, unknowns, challenges fields; create DraftIntentGraph shell with revisionCount=0 and lastModifiedAt=now`
   - Post: `DraftIntentGraph exists and is bound to session via draftIntentGraphId; ElicitationSession.draftIntentGraphId is set; at minimum one field is populated OR all fields are empty with no extraction errors`

3. **detect-gaps-and-open-first-turn**
   - Pre: `DraftIntentGraph exists for session AND ElicitationSession.status = active AND no open ElicitationTurns currently exist`
   - Action: `scan all required DraftIntentGraph fields for gaps; classify each gap by gapKind (missing, ambiguous, contradictory) and severity (blocking, high, low); create Gap records; select highest-severity unresolved gap; emit ClarificationRequest or AdaProposal; open ElicitationTurn linked to gap and request`
   - Post: `at least one Gap record exists bound to draftId; at least one ElicitationTurn is open with status=awaiting_answer; ClarificationRequest or AdaProposal emitted and linked to turn`

4. **execute-dialogue-turn**
   - Pre: `ElicitationTurn.status = awaiting_answer AND linked ClarificationRequest or AdaProposal exists AND ElicitationSession.status = active`
   - Action: `receive user ClarificationAnswer or AdaProposal disposition; validate answer is non-empty and relevant; apply answer to targeted DraftIntentGraph field; update gap.resolved=true and gap.resolvedByTurnId; close turn; increment DraftIntentGraph.revisionCount; update lastModifiedAt`
   - Post: `ElicitationTurn.status = closed; targeted Gap.resolved = true; DraftIntentGraph.revisionCount incremented; if answer introduces new contradictions then new Gap records are created`

5. **run-schema-conformance-check**
   - Pre: `no ElicitationTurns are status=awaiting_answer AND no AdaProposals are status=pending AND DraftIntentGraph exists at current revisionCount`
   - Action: `evaluate DraftIntentGraph against schema predicates for required field presence, type correctness, and cross-field consistency; record SchemaConformanceResult with passed boolean, failedPredicates list, missingRequiredFields list, evaluatedAt`
   - Post: `SchemaConformanceResult exists and is linked to current draftId and revisionCount; DraftIntentGraph.schemaConformanceResultId is set; result accurately reflects current draft state`

6. **assess-compilation-readiness**
   - Pre: `SchemaConformanceResult exists for current draft revisionCount AND ElicitationSession.status = active`
   - Action: `count openGapCount (all unresolved gaps), blockingGapCount (severity=blocking and unresolved), contradictionCount (gapKind=contradictory and unresolved); evaluate compilationReady = (schemaConformanceResult.passed AND blockingGapCount = 0 AND contradictionCount = 0); create CompilationReadinessAssessment; if compilationReady then set terminationSignalEmitted=true and transition session to ready_for_handoff`
   - Post: `CompilationReadinessAssessment exists and is linked to session and current draftId; if compilationReady=true then ElicitationSession.status = ready_for_handoff and terminationSignalEmitted=true; if compilationReady=false then session remains active and unresolved blocking gaps drive next turn cycle`

7. **emit-handoff-record**
   - Pre: `ElicitationSession.status = ready_for_handoff AND CompilationReadinessAssessment.compilationReady = true AND CompilationReadinessAssessment.terminationSignalEmitted = true`
   - Action: `snapshot final DraftIntentGraph as finalIntentGraph; create HandoffRecord with sessionId, assessmentId, finalIntentGraph, postcode, targetPipelineStage=INT→GOV, emittedAt, turnCount; set ElicitationSession.status = handed_off and terminatedAt=now`
   - Post: `HandoffRecord exists and is immutable; ElicitationSession.status = handed_off; ElicitationSession.terminatedAt is set; finalIntentGraph in HandoffRecord matches DraftIntentGraph at time of handoff`
