#!/bin/bash
# Invariant: entityBinding.entropy.value >= 0 && entityBinding.entropy.value <= 1
# Entity: EntityBinding
# Description: entropy is a unit scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.entropy.value >= 0 && entityBinding.entropy.value <= 1
exit 0
