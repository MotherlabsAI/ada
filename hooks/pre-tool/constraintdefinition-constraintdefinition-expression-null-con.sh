#!/bin/bash
# Invariant: constraintDefinition.expression !== null && constraintDefinition.expression.length > 0
# Entity: ConstraintDefinition
# Description: constraint must have a non-empty predicate expression
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: constraintDefinition.expression !== null && constraintDefinition.expression.length > 0
exit 0
