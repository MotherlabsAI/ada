#!/bin/bash
# Invariant: component.ordinal >= 0 && component.ordinal <= 9
# Entity: NamedBlueprintComponent
# Description: ordinal must be within the 10-component range to be a valid positional address
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.ordinal >= 0 && component.ordinal <= 9
exit 0
