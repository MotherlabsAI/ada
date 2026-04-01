#!/bin/bash
# Invariant: elicitationSession.status !== null
# Entity: ElicitationSession
# Description: status must always be set to track lifecycle of the elicitation conversation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.status !== null
exit 0
