#!/bin/bash
# Invariant: semanticDrift.original !== null && semanticDrift.original.trim().length > 0
# Entity: SemanticDrift
# Description: original blueprint intent must be recorded for the drift to be traceable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.original !== null && semanticDrift.original.trim().length > 0
exit 0
