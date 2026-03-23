#!/bin/bash
# Invariant: synGate.gateId !== null && synGate.gateId.length > 0
# Entity: SYNGate
# Description: gate must have a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.gateId !== null && synGate.gateId.length > 0
exit 0
