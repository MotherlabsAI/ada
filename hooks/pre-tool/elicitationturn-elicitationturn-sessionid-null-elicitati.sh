#!/bin/bash
# Invariant: elicitationTurn.sessionId !== null && elicitationTurn.sessionId.length > 0
# Entity: ElicitationTurn
# Description: every turn must be linked to a session
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.sessionId !== null && elicitationTurn.sessionId.length > 0
exit 0
