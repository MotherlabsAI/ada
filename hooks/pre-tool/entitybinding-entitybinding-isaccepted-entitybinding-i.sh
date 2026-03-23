#!/bin/bash
# Invariant: entityBinding.isAccepted === entityBinding.isHighConfidence
# Entity: EntityBinding
# Description: only high-confidence bindings are accepted into integration output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.isAccepted === entityBinding.isHighConfidence
exit 0
