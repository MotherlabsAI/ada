#!/bin/bash
# Invariant: fallbackBlueprintResult.resultId !== null
# Entity: FallbackBlueprintResult
# Description: fallback result must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.resultId !== null
exit 0
