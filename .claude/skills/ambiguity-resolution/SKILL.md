---
name: ambiguity-resolution
description: "Use when evaluate-ambiguity-gate finds one or more blocking IntentUnknowns pattern detected."
---

# ambiguity-resolution

Trigger: evaluate-ambiguity-gate finds one or more blocking IntentUnknowns

## Steps
1. **generate-clarification-requests**
   - Pre: `IntentGraph.unknowns contains at least one unknown with impact=blocking`
   - Action: `for each blocking unknown derive a ClarificationRequest with question, impact, and suggestedDefault (if derivable from IntentGraph.constraints); assign each ClarificationRequest.unknownId`
   - Post: `every blocking unknown has exactly one ClarificationRequest; ClarificationRequests without suggestedDefault are flagged as mandatory`

2. **collect-responses-or-apply-defaults**
   - Pre: `all blocking unknowns have a ClarificationRequest; pipeline state is AWAITING_CLARIFICATION`
   - Action: `present mandatory ClarificationRequests to user and collect responses; for non-mandatory requests apply suggestedDefault if user provides no response within timeout; record each resolution with its source (user | default)`
   - Post: `every ClarificationRequest has a resolution with a non-null answer and source annotation`

3. **merge-resolutions-into-intent-graph**
   - Pre: `all ClarificationRequests have resolutions with source annotations`
   - Action: `apply each resolution to its corresponding IntentUnknown in IntentGraph; promote resolved unknowns to IntentGraph.constraints if source=user or to IntentGraph.goals if resolution implies a new goal; recompute IntentGraph.postcode`
   - Post: `IntentGraph contains no blocking unknowns; IntentGraph.postcode has changed to reflect incorporated resolutions; pipeline state transitions to RUNNING`
