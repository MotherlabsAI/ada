#!/bin/bash
# Invariant: namedBlueprintComponent.boundedContext !== null && namedBlueprintComponent.boundedContext.length > 0
# Entity: NamedBlueprintComponent
# Description: every component must belong to exactly one bounded context
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.boundedContext !== null && namedBlueprintComponent.boundedContext.length > 0
exit 0
