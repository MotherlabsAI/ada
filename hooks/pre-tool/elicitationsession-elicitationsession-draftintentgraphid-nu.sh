#!/bin/bash
# Invariant: elicitationSession.draftIntentGraphId !== null
# Entity: ElicitationSession
# Description: Session must always have a DraftIntentGraph — without this, there is nowhere to accumulate elicitation results
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.draftIntentGraphId !== null
exit 0
