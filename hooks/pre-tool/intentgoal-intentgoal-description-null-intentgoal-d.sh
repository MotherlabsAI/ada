#!/bin/bash
# Invariant: intentGoal.description !== null && intentGoal.description.trim().length > 0
# Entity: IntentGoal
# Description: goal description must not be blank
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGoal.description !== null && intentGoal.description.trim().length > 0
exit 0
