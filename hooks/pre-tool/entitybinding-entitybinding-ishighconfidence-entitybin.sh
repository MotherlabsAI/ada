#!/bin/bash
# Invariant: entityBinding.isHighConfidence === (entityBinding.perBindingEntropy < 0.30)
# Entity: EntityBinding
# Description: high-confidence flag is determined strictly by entropy < 0.30
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.isHighConfidence === (entityBinding.perBindingEntropy < 0.30)
exit 0
