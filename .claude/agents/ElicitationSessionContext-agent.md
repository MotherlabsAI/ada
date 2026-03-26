---
name: ElicitationSessionContext-agent
description: Use when provides a transport-agnostic interface that cli and mcp adapters can implement to drive the elicitation dialogue loop. accepts raw intent input, renders clarificationrequests and adaproposals to the user, collects user responses, and signals session commands (abandon, force-handoff). does not implement transport — it defines the port that existing @ada/mcp-server and cli tools plug into (g5, c2). this component exists because the exclusions explicitly forbid transport implementation but g5 requires integration with existing transport model. tasks arise in the ElicitationSessionContext domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# ElicitationTransportAdapter Agent

Provides a transport-agnostic interface that CLI and MCP adapters can implement to drive the elicitation dialogue loop. Accepts raw intent input, renders ClarificationRequests and AdaProposals to the user, collects user responses, and signals session commands (abandon, force-handoff). Does NOT implement transport — it defines the port that existing @ada/mcp-server and CLI tools plug into (G5, C2). This component exists because the exclusions explicitly forbid transport implementation but G5 requires integration with existing transport model.

## Bounded Context
**Context:** ElicitationSessionContext
**Entities:** ElicitationSession, RawIntent
**Interfaces:** presentClarificationRequest(request: ClarificationRequestRecord): void, presentAdaProposal(proposal: AdaProposal): void, collectUserResponse(): ClarificationAnswerRecord | ProposalDisposition, presentReadinessStatus(assessment: CompilationReadinessAssessment): void, signalSessionCommand(command: SessionCommand): void
**Dependencies:** ElicitationSessionManager

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `elicitationSession.rawIntentId !== null && rawIntent.sessionId === elicitationSession.sessionId` — Every session must be bound to exactly one RawIntent that back-references the same session — without this, the provenance chain from user input to IntentGraph is severed
- `elicitationSession.status === 'handed-off' ==> handoffRecord.sessionId === elicitationSession.sessionId` — A handed-off session must have exactly one HandoffRecord — without this, the downstream pipeline has no structured artifact to consume
- `elicitationSession.sessionId !== null && elicitationSession.sessionId.length > 0` (ElicitationSession) — Session must have a unique identifier — without this, provenance and handoff records cannot reference the correct session
- `elicitationSession.rawIntentId !== null` (ElicitationSession) — Session must always be anchored to a RawIntent — without this, the IntentGraph produced has no traceable origin
- `elicitationSession.draftIntentGraphId !== null` (ElicitationSession) — Session must always have a DraftIntentGraph — without this, there is nowhere to accumulate elicitation results
- `!(elicitationSession.status === 'handed-off') || elicitationSession.terminatedAt !== null` (ElicitationSession) — A handed-off session must have a recorded termination timestamp — without this, session lifecycle is not auditable
- `elicitationSession.startedAt !== null` (ElicitationSession) — Session must have a start timestamp — without this, duration and ordering cannot be established
- `rawIntent.text !== null && rawIntent.text.trim().length > 0` (RawIntent) — Raw intent must contain non-empty text — without this, there is nothing to elicit from and the session cannot begin
- `rawIntent.sessionId !== null` (RawIntent) — Raw intent must be bound to exactly one session — without this, provenance is broken
- `rawIntent.capturedAt !== null` (RawIntent) — Raw intent must have a capture timestamp — without this, temporal ordering of the session is impossible
- `rawIntent.characterCount === rawIntent.text.length` (RawIntent) — Character count must match actual text length — without this, structural size assertions cannot be validated

## Workflow Steps
### capture-raw-intent (elicitation-session-lifecycle)
- **Pre:** no active ElicitationSession exists for this invocation AND submitted text is non-empty AND characterCount > 0
- **Action:** create RawIntent record with text and capturedAt; create ElicitationSession with status=intake and bind rawIntentId; emit session acknowledgement
- **Post:** ElicitationSession.status = active; ElicitationSession.rawIntentId is set; RawIntent.sessionId is bound; startedAt is recorded
- **Failure modes:**
  - precondition: submitted text is empty or whitespace-only — no intent to parse → reject submission with validation error; session is never created; prompt user to provide substantive input
  - action: RawIntent persistence fails mid-write leaving session unbound → rollback session creation; emit internal error; surface retryable error to user without data loss
  - postcondition: session created but rawIntentId linkage is missing — orphaned session → detect missing foreign key on session activation; auto-terminate orphaned session; log integrity violation; require user to resubmit

### initialize-draft-intent-graph (elicitation-session-lifecycle)
- **Pre:** ElicitationSession.status = active AND ElicitationSession.rawIntentId is set AND no DraftIntentGraph yet exists for this session
- **Action:** parse RawIntent.text using surface extraction heuristics; attempt to pre-populate goals, constraints, unknowns, challenges fields; create DraftIntentGraph shell with revisionCount=0 and lastModifiedAt=now
- **Post:** DraftIntentGraph exists and is bound to session via draftIntentGraphId; ElicitationSession.draftIntentGraphId is set; at minimum one field is populated OR all fields are empty with no extraction errors
- **Failure modes:**
  - action: surface extraction produces hallucinated goals that contradict the raw text → flag all auto-populated fields as confidence=low; surface them as AdaProposals requiring user confirmation rather than treating them as facts
  - postcondition: DraftIntentGraph created but draftIntentGraphId not written back to ElicitationSession — session cannot locate its draft → detect null draftIntentGraphId on next operation; attempt re-linkage by sessionId lookup; if ambiguous, abort session and log linkage failure
  - precondition: a DraftIntentGraph already exists for this session — duplicate initialization attempted → skip initialization; return existing draft; log idempotency guard triggered

### detect-gaps-and-open-first-turn (elicitation-session-lifecycle)
- **Pre:** DraftIntentGraph exists for session AND ElicitationSession.status = active AND no open ElicitationTurns currently exist
- **Action:** scan all required DraftIntentGraph fields for gaps; classify each gap by gapKind (missing, ambiguous, contradictory) and severity (blocking, high, low); create Gap records; select highest-severity unresolved gap; emit ClarificationRequest or AdaProposal; open ElicitationTurn linked to gap and request
- **Post:** at least one Gap record exists bound to draftId; at least one ElicitationTurn is open with status=awaiting_answer; ClarificationRequest or AdaProposal emitted and linked to turn
- **Failure modes:**
  - action: gap detector marks same field as both present and missing due to concurrent draft reads — contradictory gap state → apply idempotency guard on gap creation keyed by (draftId, targetField); deduplicate before persisting; log anomaly
  - postcondition: no gaps detected on a draft with empty required fields — detector false-negative → fallback: if all required fields are empty and no gaps exist, force-create blocking gaps for each required field; escalate to Ada for manual triage
  - action: gap detected but both ClarificationRequest and AdaProposal paths fail to emit — turn opened with no content → mark turn as status=failed; close turn; log emission failure; retry gap selection on next session heartbeat

### execute-dialogue-turn (elicitation-session-lifecycle)
- **Pre:** ElicitationTurn.status = awaiting_answer AND linked ClarificationRequest or AdaProposal exists AND ElicitationSession.status = active
- **Action:** receive user ClarificationAnswer or AdaProposal disposition; validate answer is non-empty and relevant; apply answer to targeted DraftIntentGraph field; update gap.resolved=true and gap.resolvedByTurnId; close turn; increment DraftIntentGraph.revisionCount; update lastModifiedAt
- **Post:** ElicitationTurn.status = closed; targeted Gap.resolved = true; DraftIntentGraph.revisionCount incremented; if answer introduces new contradictions then new Gap records are created
- **Failure modes:**
  - precondition: user submits answer to a turn that has already been closed — stale turn reference → reject answer with stale-turn error; inform user the question has already been resolved; display current draft state
  - action: user answer is semantically ambiguous or contradicts an existing resolved field — cannot apply cleanly → do not close turn; escalate gap severity to blocking; emit follow-up ClarificationRequest within same turn context; mark turn as status=needs_clarification
  - postcondition: answer applied to draft but revisionCount not incremented — stale revision marker causes conformance check to use wrong snapshot → detect revision mismatch on conformance check trigger; force re-increment; log revision accounting error
  - action: AdaProposal disposition set to modified but modifiedText is empty — partial disposition → reject disposition record; keep proposal status=pending; re-prompt user for modified text explicitly

### run-schema-conformance-check (elicitation-session-lifecycle)
- **Pre:** no ElicitationTurns are status=awaiting_answer AND no AdaProposals are status=pending AND DraftIntentGraph exists at current revisionCount
- **Action:** evaluate DraftIntentGraph against schema predicates for required field presence, type correctness, and cross-field consistency; record SchemaConformanceResult with passed boolean, failedPredicates list, missingRequiredFields list, evaluatedAt
- **Post:** SchemaConformanceResult exists and is linked to current draftId and revisionCount; DraftIntentGraph.schemaConformanceResultId is set; result accurately reflects current draft state
- **Failure modes:**
  - precondition: conformance check triggered while an AdaProposal is still pending — evaluates incomplete draft → block conformance check; return to awaiting_proposal_resolution state; re-trigger check once all proposals are resolved
  - action: conformance evaluation passes schema structure but fails to detect semantic contradictions between goals and constraints → supplement structural conformance with Ada semantic review step before emitting passed=true; flag as warning-level issues that do not block handoff but are surfaced in assessment
  - postcondition: SchemaConformanceResult created but linked to a stale revisionCount — result is invalid for current draft → detect revision mismatch on readiness assessment; invalidate stale result; re-trigger conformance check against current revision

### assess-compilation-readiness (elicitation-session-lifecycle)
- **Pre:** SchemaConformanceResult exists for current draft revisionCount AND ElicitationSession.status = active
- **Action:** count openGapCount (all unresolved gaps), blockingGapCount (severity=blocking and unresolved), contradictionCount (gapKind=contradictory and unresolved); evaluate compilationReady = (schemaConformanceResult.passed AND blockingGapCount = 0 AND contradictionCount = 0); create CompilationReadinessAssessment; if compilationReady then set terminationSignalEmitted=true and transition session to ready_for_handoff
- **Post:** CompilationReadinessAssessment exists and is linked to session and current draftId; if compilationReady=true then ElicitationSession.status = ready_for_handoff and terminationSignalEmitted=true; if compilationReady=false then session remains active and unresolved blocking gaps drive next turn cycle
- **Failure modes:**
  - precondition: a new turn answer arrives concurrently with readiness assessment — assessment evaluates a draft that is being mutated → lock draft for assessment duration; queue incoming answer; re-run assessment after answer is applied; never emit termination signal on a mid-mutation snapshot
  - action: openGapCount calculated as 0 but Gap table has unresolved records — count query bug → cross-validate gap count against explicit Gap table query before setting compilationReady=true; if mismatch detected abort assessment and alert
  - postcondition: terminationSignalEmitted=true but session status not updated to ready_for_handoff — session stuck in limbo → detect signal-without-status inconsistency on next heartbeat; force session status to ready_for_handoff; log state machine violation

### emit-handoff-record (elicitation-session-lifecycle)
- **Pre:** ElicitationSession.status = ready_for_handoff AND CompilationReadinessAssessment.compilationReady = true AND CompilationReadinessAssessment.terminationSignalEmitted = true
- **Action:** snapshot final DraftIntentGraph as finalIntentGraph; create HandoffRecord with sessionId, assessmentId, finalIntentGraph, postcode, targetPipelineStage=INT→GOV, emittedAt, turnCount; set ElicitationSession.status = handed_off and terminatedAt=now
- **Post:** HandoffRecord exists and is immutable; ElicitationSession.status = handed_off; ElicitationSession.terminatedAt is set; finalIntentGraph in HandoffRecord matches DraftIntentGraph at time of handoff
- **Failure modes:**
  - precondition: session is ready_for_handoff but assessmentId is missing from session — cannot produce valid HandoffRecord → block handoff; re-run readiness assessment to regenerate assessmentId; retry handoff emission
  - action: downstream compilation pipeline rejects the HandoffRecord due to schema drift between elicitation schema version and compiler expected version → capture rejection reason; revert ElicitationSession.status to active; create Gap records from compiler rejection fields; re-enter dialogue loop targeting rejected fields
  - postcondition: HandoffRecord emitted but ElicitationSession.status not updated to handed_off — session remains in ready_for_handoff indefinitely and may emit duplicate handoffs → apply idempotency key on HandoffRecord keyed by sessionId; detect duplicate emission attempt; reject second emission; force status update and log

### scan-draft-fields-for-gaps (gap-detection-and-resolution-cycle)
- **Pre:** DraftIntentGraph exists and is not in a terminal state AND ElicitationSession.status = active
- **Action:** for each required field in DraftIntentGraph (goals, constraints, unknowns, challenges): check field presence, semantic completeness, and cross-field consistency; classify detected issues as gapKind ∈ {missing, ambiguous, contradictory}; assign severity ∈ {blocking, high, low}; create new Gap records only for issues not already tracked; do not re-open previously resolved gaps
- **Post:** all newly detected issues have corresponding Gap records with detectedAt set; previously resolved gaps remain resolved; no duplicate Gap records exist for the same (draftId, targetField, gapKind) combination
- **Failure modes:**
  - action: gap scanner re-opens a previously resolved gap because the resolving answer introduced partial regression → check if resolved gap's targetField was directly mutated by the latest revision; if yes, allow re-open with new gapId and log regression; if no, enforce resolved status and do not re-open
  - postcondition: duplicate Gap records created for same (draftId, targetField) — double-counting inflates blockingGapCount and blocks readiness assessment → enforce unique constraint on (draftId, targetField, gapKind, resolved=false); deduplicate on write; run deduplication repair query if constraint was violated
  - action: cross-field contradiction between goals and constraints not detected because scanner checks fields independently without relational analysis → add a cross-field consistency pass after per-field scan; any field pair that produces logical contradiction generates a contradictory-severity gap on the lower-confidence field

### prioritize-and-select-active-gap (gap-detection-and-resolution-cycle)
- **Pre:** at least one unresolved Gap exists for current draftId AND no ElicitationTurn is currently status=awaiting_answer
- **Action:** order unresolved gaps by severity descending (blocking > high > low), then by detectedAt ascending (oldest first within same severity); select top gap as the active gap for this turn cycle
- **Post:** exactly one gap is designated as the active gap for turn emission; selection is deterministic given the same gap set
- **Failure modes:**
  - precondition: an open turn still exists while gap prioritization is triggered — two concurrent turns would result → block new turn emission; wait for existing turn to reach closed or expired status; re-trigger prioritization on turn closure event
  - action: all unresolved gaps have been individually resolved but a new contradictory gap was just created — selection picks the contradiction gap but Ada has no question template for contradiction type → fall back to open-ended ClarificationRequest for contradiction gaps: surface both conflicting fields to user and ask them to arbitrate
  - postcondition: no active gap selected despite unresolved gaps existing — selection logic skipped all gaps due to incorrect filter → detect zero turns opened after prioritization completes when gaps exist; force-select oldest blocking gap as fallback; log selection failure

### emit-clarification-or-proposal (gap-detection-and-resolution-cycle)
- **Pre:** active gap is selected AND no existing open ElicitationTurn is linked to this gapId AND ElicitationSession.status = active
- **Action:** if gapKind = missing: emit ClarificationRequest with question targeting the missing field, impact description, and suggestedDefault if available; if gapKind = ambiguous AND Ada has a candidate value: emit AdaProposal with proposedText and rationale; if gapKind = contradictory: emit ClarificationRequest surfacing both conflicting field values; open ElicitationTurn and link to gap and emitted request or proposal
- **Post:** ElicitationTurn.status = awaiting_answer; turn is linked to gapId and either clarificationRequestId or proposalId; gap remains unresolved until answer processed
- **Failure modes:**
  - precondition: an open turn already exists for this gapId — attempting to open a second turn for same gap → detect duplicate via gapId lookup on open turns; suppress new turn emission; return reference to existing open turn; log idempotency guard
  - action: Ada has no suggestedDefault and no candidate value — emits a ClarificationRequest with empty impact description, which gives user no context to answer meaningfully → require impact field to be non-empty before emission; derive impact from targetField metadata and downstream compiler requirements; block emission if impact cannot be derived
  - postcondition: turn opened but not linked to gapId — turn floats without gap context and cannot close the gap when answered → validate gapId linkage on turn creation; if missing, abort turn creation; log linkage failure; re-trigger emission with correct linkage

### apply-answer-and-resolve-gap (gap-detection-and-resolution-cycle)
- **Pre:** ElicitationTurn.status = awaiting_answer AND ClarificationAnswer or AdaProposal disposition received AND answer is non-empty
- **Action:** parse and validate answer content; write answer to ClarificationAnswerRecord; apply answer value to targeted DraftIntentGraph field; set Gap.resolved=true and Gap.resolvedByTurnId; close ElicitationTurn; increment DraftIntentGraph.revisionCount; trigger re-scan of affected fields to detect cascade gaps
- **Post:** Gap.resolved = true; ElicitationTurn.status = closed; DraftIntentGraph field updated; revisionCount incremented; if cascade gaps detected then new Gap records exist and next prioritization cycle begins
- **Failure modes:**
  - action: applying answer to DraftIntentGraph field succeeds but cascade re-scan is skipped — new contradictions introduced by the answer go undetected until conformance check → make cascade re-scan mandatory and synchronous on every answer application; never close a turn without completing cascade scan; log if cascade scan is bypassed
  - postcondition: gap marked resolved but DraftIntentGraph field not actually updated — resolved gap with empty field passes into conformance check and fails → validate field value is non-null/non-empty after resolution before marking gap resolved; if field still empty after answer application, revert gap to unresolved and escalate to Ada review
  - action: user answer resolves one gap but directly contradicts a previously resolved gap in another field — regression cascade → on contradiction detection during cascade scan, emit a new contradictory-severity gap targeting the earlier resolved field; do not silently overwrite; surface conflict explicitly to user in next turn

## Acceptance Criteria
- [ ] ElicitationSession.status = active; ElicitationSession.rawIntentId is set; RawIntent.sessionId is bound; startedAt is recorded
- [ ] DraftIntentGraph exists and is bound to session via draftIntentGraphId; ElicitationSession.draftIntentGraphId is set; at minimum one field is populated OR all fields are empty with no extraction errors
- [ ] at least one Gap record exists bound to draftId; at least one ElicitationTurn is open with status=awaiting_answer; ClarificationRequest or AdaProposal emitted and linked to turn
- [ ] ElicitationTurn.status = closed; targeted Gap.resolved = true; DraftIntentGraph.revisionCount incremented; if answer introduces new contradictions then new Gap records are created
- [ ] SchemaConformanceResult exists and is linked to current draftId and revisionCount; DraftIntentGraph.schemaConformanceResultId is set; result accurately reflects current draft state
- [ ] CompilationReadinessAssessment exists and is linked to session and current draftId; if compilationReady=true then ElicitationSession.status = ready_for_handoff and terminationSignalEmitted=true; if compilationReady=false then session remains active and unresolved blocking gaps drive next turn cycle
- [ ] HandoffRecord exists and is immutable; ElicitationSession.status = handed_off; ElicitationSession.terminatedAt is set; finalIntentGraph in HandoffRecord matches DraftIntentGraph at time of handoff
- [ ] all newly detected issues have corresponding Gap records with detectedAt set; previously resolved gaps remain resolved; no duplicate Gap records exist for the same (draftId, targetField, gapKind) combination
- [ ] exactly one gap is designated as the active gap for turn emission; selection is deterministic given the same gap set
- [ ] ElicitationTurn.status = awaiting_answer; turn is linked to gapId and either clarificationRequestId or proposalId; gap remains unresolved until answer processed
- [ ] Gap.resolved = true; ElicitationTurn.status = closed; DraftIntentGraph field updated; revisionCount incremented; if cascade gaps detected then new Gap records exist and next prioritization cycle begins

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
