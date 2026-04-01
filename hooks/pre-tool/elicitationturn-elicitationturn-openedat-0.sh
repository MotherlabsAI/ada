#!/bin/bash
# Invariant: elicitationTurn.openedAt > 0
# Entity: ElicitationTurn
# Description: openedAt must be a positive timestamp
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.openedAt > 0
exit 0
