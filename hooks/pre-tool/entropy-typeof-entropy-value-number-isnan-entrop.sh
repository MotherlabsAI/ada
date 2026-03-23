#!/bin/bash
# Invariant: typeof entropy.value === 'number' && !isNaN(entropy.value)
# Entity: Entropy
# Description: entropy must be a real numeric scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeof entropy.value === 'number' && !isNaN(entropy.value)
exit 0
