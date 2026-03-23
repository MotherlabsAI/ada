#!/bin/bash
# Invariant: validationRule.ruleId !== null
# Entity: ValidationRule
# Description: rule must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: validationRule.ruleId !== null
exit 0
