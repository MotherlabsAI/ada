#!/bin/bash
# Invariant: synValidationResult.passedBindingCount <= synValidationResult.totalBindingCount
# Entity: SYNValidationResult
# Description: passed count cannot exceed total count
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passedBindingCount <= synValidationResult.totalBindingCount
exit 0
