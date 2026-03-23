#!/bin/bash
# Invariant: synValidationResult.passed === (synValidationResult.passRate >= 0.83)
# Entity: SYNValidationResult
# Description: passed flag is determined solely by whether passRate meets required threshold
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passed === (synValidationResult.passRate >= 0.83)
exit 0
