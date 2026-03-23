#!/bin/bash
# Invariant: entropy.value >= 0 && entropy.value <= 1
# Entity: Entropy
# Description: entropy is bounded to [0, 1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entropy.value >= 0 && entropy.value <= 1
exit 0
