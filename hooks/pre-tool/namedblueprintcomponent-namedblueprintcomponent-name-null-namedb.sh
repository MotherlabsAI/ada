#!/bin/bash
# Invariant: namedBlueprintComponent.name !== null && namedBlueprintComponent.name.length > 0
# Entity: NamedBlueprintComponent
# Description: a nameless component cannot be mapped to a package or registered in EntityMap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.name !== null && namedBlueprintComponent.name.length > 0
exit 0
