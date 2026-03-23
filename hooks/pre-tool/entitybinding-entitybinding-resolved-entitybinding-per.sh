#!/bin/bash
# Invariant: entityBinding.resolved === (entityBinding.perBindingEntropy < 0.30)
# Entity: EntityBinding
# Description: resolved state is determined exclusively by entropy threshold
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.resolved === (entityBinding.perBindingEntropy < 0.30)
exit 0
