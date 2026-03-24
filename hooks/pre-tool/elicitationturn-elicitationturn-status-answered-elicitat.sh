#!/bin/bash
# Invariant: !(elicitationTurn.status === 'answered') || elicitationTurn.closedAt !== null
# Entity: ElicitationTurn
# Description: An answered turn must have a close timestamp — without this, turn duration cannot be computed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(elicitationTurn.status === 'answered') || elicitationTurn.closedAt !== null
exit 0
