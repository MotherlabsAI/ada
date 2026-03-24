#!/bin/bash
# Invariant: synValidationResult.passedBindingCount <= synValidationResult.totalBindingCount
# Entity: SYNValidationResult
# Description: Passed count cannot exceed total — a superset violation indicates corrupt binding evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passedBindingCount <= synValidationResult.totalBindingCount
exit 0
