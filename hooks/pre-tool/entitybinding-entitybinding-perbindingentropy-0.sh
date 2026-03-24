#!/bin/bash
# Invariant: entityBinding.perBindingEntropy >= 0
# Entity: EntityBinding
# Description: Per-binding entropy must be non-negative — negative entropy has no semantic meaning in disambiguation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.perBindingEntropy >= 0
exit 0
