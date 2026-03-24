#!/bin/bash
# Invariant: elicitationTurn.turnId !== null && elicitationTurn.turnId.length > 0
# Entity: ElicitationTurn
# Description: Turn must have identity — anonymous turns cannot be referenced by clarification or proposal records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.turnId !== null && elicitationTurn.turnId.length > 0
exit 0
