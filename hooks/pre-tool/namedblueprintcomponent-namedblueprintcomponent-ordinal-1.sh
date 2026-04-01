#!/bin/bash
# Invariant: namedBlueprintComponent.ordinal >= 1
# Entity: NamedBlueprintComponent
# Description: ordinals start at 1; zero or negative ordinals are invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.ordinal >= 1
exit 0
