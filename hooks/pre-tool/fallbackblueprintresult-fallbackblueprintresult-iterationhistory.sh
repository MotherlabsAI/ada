#!/bin/bash
# Invariant: fallbackBlueprintResult.iterationHistory.length >= 1
# Entity: FallbackBlueprintResult
# Description: a fallback result must have at least one iteration history entry — it is only produced after iteration failure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.iterationHistory.length >= 1
exit 0
