#!/bin/bash
# Invariant: validationRule.severity !== null
# Entity: ValidationRule
# Description: severity must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: validationRule.severity !== null
exit 0
