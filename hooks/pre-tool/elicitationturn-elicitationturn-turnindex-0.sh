#!/bin/bash
# Invariant: elicitationTurn.turnIndex >= 0
# Entity: ElicitationTurn
# Description: turn index must be non-negative — negative ordinals indicate sequence corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.turnIndex >= 0
exit 0
