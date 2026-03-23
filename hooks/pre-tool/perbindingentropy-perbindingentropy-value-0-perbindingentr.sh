#!/bin/bash
# Invariant: perBindingEntropy.value >= 0 && perBindingEntropy.value <= 1
# Entity: PerBindingEntropy
# Description: per-binding entropy is a unit-interval scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: perBindingEntropy.value >= 0 && perBindingEntropy.value <= 1
exit 0
