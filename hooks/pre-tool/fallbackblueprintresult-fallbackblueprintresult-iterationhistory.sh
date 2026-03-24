#!/bin/bash
# Invariant: fallbackBlueprintResult.iterationHistory.length > 0
# Entity: FallbackBlueprintResult
# Description: Fallback must have iteration history — without it the best iteration cannot be justified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.iterationHistory.length > 0
exit 0
