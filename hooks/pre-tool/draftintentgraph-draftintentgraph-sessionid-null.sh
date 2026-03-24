#!/bin/bash
# Invariant: draftIntentGraph.sessionId !== null
# Entity: DraftIntentGraph
# Description: Draft must be bound to exactly one session — without this, multiple concurrent sessions cannot be distinguished
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.sessionId !== null
exit 0
