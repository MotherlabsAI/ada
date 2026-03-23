#!/bin/bash
# Invariant: synValidationResult.passRate >= 0 && synValidationResult.passRate <= 1
# Entity: SYNValidationResult
# Description: pass rate is a bounded real in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passRate >= 0 && synValidationResult.passRate <= 1
exit 0
