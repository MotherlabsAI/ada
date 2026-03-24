#!/bin/bash
# Invariant: gateInput.unresolvedUnknowns >= 0
# Entity: GateInput
# Description: Unresolved unknowns must be non-negative — it is a cardinality
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gateInput.unresolvedUnknowns >= 0
exit 0
