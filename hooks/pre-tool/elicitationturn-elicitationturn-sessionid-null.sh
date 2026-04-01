#!/bin/bash
# Invariant: elicitationTurn.sessionId !== null
# Entity: ElicitationTurn
# Description: every turn must reference its parent session — orphaned turns cannot contribute to elicitation state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.sessionId !== null
exit 0
