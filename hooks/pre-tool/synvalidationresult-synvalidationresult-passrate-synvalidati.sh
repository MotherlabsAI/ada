#!/bin/bash
# Invariant: synValidationResult.passRate === (synValidationResult.totalBindingCount === 0 ? 0 : synValidationResult.passedBindingCount / synValidationResult.totalBindingCount)
# Entity: SYNValidationResult
# Description: passRate must equal ratio of passed to total bindings
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synValidationResult.passRate === (synValidationResult.totalBindingCount === 0 ? 0 : synValidationResult.passedBindingCount / synValidationResult.totalBindingCount)
exit 0
