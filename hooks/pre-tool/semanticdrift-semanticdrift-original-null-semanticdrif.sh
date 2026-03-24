#!/bin/bash
# Invariant: semanticDrift.original !== null && semanticDrift.actual !== null
# Entity: SemanticDrift
# Description: Both original and actual must be present — a drift record with only one side is unverifiable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.original !== null && semanticDrift.actual !== null
exit 0
