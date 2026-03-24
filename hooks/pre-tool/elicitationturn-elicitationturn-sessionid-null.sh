#!/bin/bash
# Invariant: elicitationTurn.sessionId !== null
# Entity: ElicitationTurn
# Description: Turn must be bound to exactly one session — without this, turns cannot be associated with their session
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.sessionId !== null
exit 0
