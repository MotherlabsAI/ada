#!/bin/bash
# Invariant: synValidationResult.runId !== null && synValidationResult.runId.length > 0
# Entity: SYNValidationResult
# Description: validation result must be scoped to a run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.runId !== null && synValidationResult.runId.length > 0
exit 0
