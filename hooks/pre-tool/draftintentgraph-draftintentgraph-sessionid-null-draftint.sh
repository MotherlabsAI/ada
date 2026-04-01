#!/bin/bash
# Invariant: draftIntentGraph.sessionId !== null && draftIntentGraph.sessionId.length > 0
# Entity: DraftIntentGraph
# Description: sessionId must link this draft to its ElicitationSession
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.sessionId !== null && draftIntentGraph.sessionId.length > 0
exit 0
