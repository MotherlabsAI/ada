#!/bin/bash
# Invariant: intentGoal.type !== null
# Entity: IntentGoal
# Description: Goal type must be classified — unclassified goals cannot be weighted correctly in the synthesis stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGoal.type !== null
exit 0
