#!/bin/bash
# Invariant: synValidationResult.passRate >= 0 && synValidationResult.passRate <= 1
# Entity: SYNValidationResult
# Description: Pass rate must be a valid proportion — unbounded rates cannot be compared to the SYN gate threshold
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passRate >= 0 && synValidationResult.passRate <= 1
exit 0
