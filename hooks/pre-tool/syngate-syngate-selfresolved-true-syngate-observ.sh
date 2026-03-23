#!/bin/bash
# Invariant: synGate.selfResolved === true || synGate.observedPassRate === null || synGate.observedPassRate < synGate.passRateTarget
# Entity: SYNGate
# Description: self-resolution holds only when observed pass rate meets or exceeds target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.selfResolved === true || synGate.observedPassRate === null || synGate.observedPassRate < synGate.passRateTarget
exit 0
