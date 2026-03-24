#!/bin/bash
# Invariant: intentGoal.description !== null && intentGoal.description.length > 0
# Entity: IntentGoal
# Description: Goal description must be present — an empty goal contributes nothing to the intent graph
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGoal.description !== null && intentGoal.description.length > 0
exit 0
