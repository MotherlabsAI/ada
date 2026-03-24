#!/bin/bash
# Invariant: synGate.passRateTarget === synGate.requiredPassRate
# Entity: SYNGate
# Description: pass rate target must equal required pass rate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.passRateTarget === synGate.requiredPassRate
exit 0
