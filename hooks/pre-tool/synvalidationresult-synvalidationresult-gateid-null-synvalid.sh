#!/bin/bash
# Invariant: synValidationResult.gateId !== null && synValidationResult.gateId.length > 0
# Entity: SYNValidationResult
# Description: Result must reference the gate it evaluates — a gateless validation result has no enforcement context
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.gateId !== null && synValidationResult.gateId.length > 0
exit 0
