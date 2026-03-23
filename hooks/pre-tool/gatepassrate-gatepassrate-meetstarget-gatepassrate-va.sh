#!/bin/bash
# Invariant: gatePassRate.meetsTarget === (gatePassRate.value >= 0.83)
# Entity: GatePassRate
# Description: meetsTarget is derived strictly from value >= 0.83
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gatePassRate.meetsTarget === (gatePassRate.value >= 0.83)
exit 0
