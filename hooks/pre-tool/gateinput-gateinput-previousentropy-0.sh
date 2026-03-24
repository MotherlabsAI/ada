#!/bin/bash
# Invariant: gateInput.previousEntropy >= 0
# Entity: GateInput
# Description: Previous entropy must be non-negative — it is a measure and cannot be negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gateInput.previousEntropy >= 0
exit 0
