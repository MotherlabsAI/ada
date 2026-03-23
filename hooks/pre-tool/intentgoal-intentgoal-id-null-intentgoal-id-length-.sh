#!/bin/bash
# Invariant: intentGoal.id !== null && intentGoal.id.length > 0
# Entity: IntentGoal
# Description: goal must have a stable identifier for provenance tracing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentGoal.id !== null && intentGoal.id.length > 0
exit 0
