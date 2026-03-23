#!/bin/bash
# Invariant: gatePassRate.target === 0.83
# Entity: GatePassRate
# Description: required target is fixed at 0.83
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gatePassRate.target === 0.83
exit 0
