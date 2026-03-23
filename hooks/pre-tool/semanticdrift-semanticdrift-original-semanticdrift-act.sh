#!/bin/bash
# Invariant: semanticDrift.original !== semanticDrift.actual
# Entity: SemanticDrift
# Description: original and actual must differ — identical values do not constitute drift
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.original !== semanticDrift.actual
exit 0
