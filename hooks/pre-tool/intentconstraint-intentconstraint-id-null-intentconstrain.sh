#!/bin/bash
# Invariant: intentConstraint.id !== null && intentConstraint.id.length > 0
# Entity: IntentConstraint
# Description: Constraint must have identity — sourceless constraints cannot be traced to elicitation turns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentConstraint.id !== null && intentConstraint.id.length > 0
exit 0
