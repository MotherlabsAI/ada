#!/bin/bash
# Invariant: elicitationTurn.turnId !== null && elicitationTurn.turnId.length > 0
# Entity: ElicitationTurn
# Description: turns must be uniquely identified within the session
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.turnId !== null && elicitationTurn.turnId.length > 0
exit 0
