#!/bin/bash
# Invariant: handoffRecord.finalIntentGraph.rawIntent !== null && handoffRecord.finalIntentGraph.rawIntent.length > 0
# Entity: HandoffRecord
# Description: Final IntentGraph must carry the rawIntent text — without this, the IntentGraph schema invariant is violated and the compiler rejects it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.finalIntentGraph.rawIntent !== null && handoffRecord.finalIntentGraph.rawIntent.length > 0
exit 0
