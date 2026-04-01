#!/bin/bash
# Invariant: draftIntentGraph.draftId !== null && draftIntentGraph.draftId.length > 0
# Entity: DraftIntentGraph
# Description: draftId must be non-null — it is the identity of this draft before promotion to IntentGraph
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.draftId !== null && draftIntentGraph.draftId.length > 0
exit 0
