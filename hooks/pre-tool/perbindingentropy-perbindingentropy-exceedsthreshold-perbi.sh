#!/bin/bash
# Invariant: perBindingEntropy.exceedsThreshold === (perBindingEntropy.value >= 0.30)
# Entity: PerBindingEntropy
# Description: exceedsThreshold is derived strictly from value >= 0.30
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: perBindingEntropy.exceedsThreshold === (perBindingEntropy.value >= 0.30)
exit 0
