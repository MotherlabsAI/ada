#!/bin/bash
# Invariant: synGate.requiredPassRate === 0.83
# Entity: SYNGate
# Description: SYN gate pass rate target is fixed at 0.83
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.requiredPassRate === 0.83
exit 0
