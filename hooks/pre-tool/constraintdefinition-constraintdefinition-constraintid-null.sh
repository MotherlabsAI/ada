#!/bin/bash
# Invariant: constraintDefinition.constraintId !== null
# Entity: ConstraintDefinition
# Description: constraint must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: constraintDefinition.constraintId !== null
exit 0
