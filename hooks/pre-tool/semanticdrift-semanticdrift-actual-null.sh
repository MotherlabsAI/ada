#!/bin/bash
# Invariant: semanticDrift.actual !== null
# Entity: SemanticDrift
# Description: Actual produced meaning must be recorded — without it the drift is not measurable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.actual !== null
exit 0
