#!/bin/bash
# Invariant: fallbackBlueprintResult.partialBlueprint !== null
# Entity: FallbackBlueprintResult
# Description: Fallback must carry a partial blueprint — a fallback with no artifact cannot be used for downstream recovery
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.partialBlueprint !== null
exit 0
