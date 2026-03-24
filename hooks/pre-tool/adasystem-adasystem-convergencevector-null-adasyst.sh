#!/bin/bash
# Invariant: adaSystem.convergenceVector !== null && adaSystem.convergenceVector.length > 0
# Entity: AdaSystem
# Description: Ada's convergence direction must be named — without this the vision document has no anchor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaSystem.convergenceVector !== null && adaSystem.convergenceVector.length > 0
exit 0
