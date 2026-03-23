#!/bin/bash
# Invariant: constraintDefinition.scope !== null
# Entity: ConstraintDefinition
# Description: constraint scope must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: constraintDefinition.scope !== null
exit 0
