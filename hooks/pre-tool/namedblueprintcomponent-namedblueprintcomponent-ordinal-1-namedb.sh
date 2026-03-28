#!/bin/bash
# Invariant: namedBlueprintComponent.ordinal >= 1 && namedBlueprintComponent.ordinal <= 10
# Entity: NamedBlueprintComponent
# Description: ordinals must be within the 1-10 range for a 10-component registry; out-of-range ordinals indicate registry corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.ordinal >= 1 && namedBlueprintComponent.ordinal <= 10
exit 0
