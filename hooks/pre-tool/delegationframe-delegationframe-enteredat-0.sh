#!/bin/bash
# Invariant: delegationFrame.enteredAt > 0
# Entity: DelegationFrame
# Description: frame must record when delegation was entered for audit and timeout detection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationFrame.enteredAt > 0
exit 0
