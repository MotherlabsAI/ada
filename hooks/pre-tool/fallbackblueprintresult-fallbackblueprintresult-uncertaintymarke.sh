#!/bin/bash
# Invariant: fallbackBlueprintResult.uncertaintyMarkers !== null && fallbackBlueprintResult.uncertaintyMarkers.length > 0
# Entity: FallbackBlueprintResult
# Description: fallback must carry at least one uncertainty marker
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.uncertaintyMarkers !== null && fallbackBlueprintResult.uncertaintyMarkers.length > 0
exit 0
