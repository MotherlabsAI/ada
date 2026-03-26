---
name: gap-detection-and-resolution-cycle
description: "Use when DraftIntentGraph is created or any field is mutated by a turn answer or proposal disposition pattern detected."
---

# gap-detection-and-resolution-cycle

Trigger: DraftIntentGraph is created or any field is mutated by a turn answer or proposal disposition

## Steps
1. **scan-draft-fields-for-gaps**
   - Pre: `DraftIntentGraph exists and is not in a terminal state AND ElicitationSession.status = active`
   - Action: `for each required field in DraftIntentGraph (goals, constraints, unknowns, challenges): check field presence, semantic completeness, and cross-field consistency; classify detected issues as gapKind ∈ {missing, ambiguous, contradictory}; assign severity ∈ {blocking, high, low}; create new Gap records only for issues not already tracked; do not re-open previously resolved gaps`
   - Post: `all newly detected issues have corresponding Gap records with detectedAt set; previously resolved gaps remain resolved; no duplicate Gap records exist for the same (draftId, targetField, gapKind) combination`

2. **prioritize-and-select-active-gap**
   - Pre: `at least one unresolved Gap exists for current draftId AND no ElicitationTurn is currently status=awaiting_answer`
   - Action: `order unresolved gaps by severity descending (blocking > high > low), then by detectedAt ascending (oldest first within same severity); select top gap as the active gap for this turn cycle`
   - Post: `exactly one gap is designated as the active gap for turn emission; selection is deterministic given the same gap set`

3. **emit-clarification-or-proposal**
   - Pre: `active gap is selected AND no existing open ElicitationTurn is linked to this gapId AND ElicitationSession.status = active`
   - Action: `if gapKind = missing: emit ClarificationRequest with question targeting the missing field, impact description, and suggestedDefault if available; if gapKind = ambiguous AND Ada has a candidate value: emit AdaProposal with proposedText and rationale; if gapKind = contradictory: emit ClarificationRequest surfacing both conflicting field values; open ElicitationTurn and link to gap and emitted request or proposal`
   - Post: `ElicitationTurn.status = awaiting_answer; turn is linked to gapId and either clarificationRequestId or proposalId; gap remains unresolved until answer processed`

4. **apply-answer-and-resolve-gap**
   - Pre: `ElicitationTurn.status = awaiting_answer AND ClarificationAnswer or AdaProposal disposition received AND answer is non-empty`
   - Action: `parse and validate answer content; write answer to ClarificationAnswerRecord; apply answer value to targeted DraftIntentGraph field; set Gap.resolved=true and Gap.resolvedByTurnId; close ElicitationTurn; increment DraftIntentGraph.revisionCount; trigger re-scan of affected fields to detect cascade gaps`
   - Post: `Gap.resolved = true; ElicitationTurn.status = closed; DraftIntentGraph field updated; revisionCount incremented; if cascade gaps detected then new Gap records exist and next prioritization cycle begins`
