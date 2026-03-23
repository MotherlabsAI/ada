#!/bin/bash
# Invariant: entityBinding.confidence >= 0 && entityBinding.confidence <= 1
# Entity: EntityBinding
# Description: confidence is a unit scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.confidence >= 0 && entityBinding.confidence <= 1
exit 0
