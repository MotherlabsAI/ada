#!/bin/bash
# Invariant: elicitationSession.status === 'complete' ? elicitationSession.draftIntentGraph !== null : true
# Entity: ElicitationSession
# Description: a complete session must have produced a draftIntentGraph — completion without a handoff artifact is an invalid terminal state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.status === 'complete' ? elicitationSession.draftIntentGraph !== null : true
exit 0
