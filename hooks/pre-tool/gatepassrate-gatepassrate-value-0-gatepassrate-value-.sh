#!/bin/bash
# Invariant: gatePassRate.value >= 0 && gatePassRate.value <= 1
# Entity: GatePassRate
# Description: pass rate is a unit-interval scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gatePassRate.value >= 0 && gatePassRate.value <= 1
exit 0
