#!/bin/bash
# Invariant: gateInput.invariantCount >= 0
# Entity: GateInput
# Description: Invariant count must be non-negative — it is a cardinality and cannot be negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gateInput.invariantCount >= 0
exit 0
