#!/bin/bash
# Invariant: semanticDrift.original !== null
# Entity: SemanticDrift
# Description: Original meaning must be preserved — without it drift magnitude cannot be computed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.original !== null
exit 0
