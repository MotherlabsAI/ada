#!/bin/bash
# Invariant: boundedContextResult.entitiesFound <= boundedContextResult.entitiesExpected + boundedContextResult.entitiesFound
# Entity: BoundedContextResult
# Description: Found entity count must be non-negative — negative found counts are structurally invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContextResult.entitiesFound <= boundedContextResult.entitiesExpected + boundedContextResult.entitiesFound
exit 0
