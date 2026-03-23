#!/bin/bash
# Invariant: fallbackBlueprintResult.fallbackReason !== null && fallbackBlueprintResult.fallbackReason.length > 0
# Entity: FallbackBlueprintResult
# Description: fallback reason must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.fallbackReason !== null && fallbackBlueprintResult.fallbackReason.length > 0
exit 0
