#!/bin/bash
# Invariant: result.producedAt > 0
# Entity: ENTStageResult
# Description: a result with no timestamp was never finalized and cannot be consumed by downstream stages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: result.producedAt > 0
exit 0
