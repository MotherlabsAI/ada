#!/bin/bash
# Invariant: intentConstraint.description !== null && intentConstraint.description.length > 0
# Entity: IntentConstraint
# Description: Constraint description must be non-empty — a constraint with no description enforces nothing nameable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentConstraint.description !== null && intentConstraint.description.length > 0
exit 0
