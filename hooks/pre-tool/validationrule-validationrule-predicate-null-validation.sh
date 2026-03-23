#!/bin/bash
# Invariant: validationRule.predicate !== null && validationRule.predicate.length > 0
# Entity: ValidationRule
# Description: rule must have a predicate expression
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: validationRule.predicate !== null && validationRule.predicate.length > 0
exit 0
