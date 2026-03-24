#!/bin/bash
# Invariant: elicitationTurn.gapId !== null && elicitationTurn.gapId.length > 0
# Entity: ElicitationTurn
# Description: Turn must address a gap — a turn with no gap reference has no elicitation purpose
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.gapId !== null && elicitationTurn.gapId.length > 0
exit 0
