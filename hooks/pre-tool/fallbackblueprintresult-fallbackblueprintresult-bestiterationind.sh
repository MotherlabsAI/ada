#!/bin/bash
# Invariant: fallbackBlueprintResult.bestIterationIndex >= 0 && fallbackBlueprintResult.bestIterationIndex < fallbackBlueprintResult.iterationHistory.length
# Entity: FallbackBlueprintResult
# Description: bestIterationIndex must reference a valid position in iterationHistory — an out-of-bounds index indicates selection failure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fallbackBlueprintResult.bestIterationIndex >= 0 && fallbackBlueprintResult.bestIterationIndex < fallbackBlueprintResult.iterationHistory.length
exit 0
