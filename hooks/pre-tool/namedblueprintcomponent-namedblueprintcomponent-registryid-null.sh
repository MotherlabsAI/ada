#!/bin/bash
# Invariant: namedBlueprintComponent.registryId !== null
# Entity: NamedBlueprintComponent
# Description: every component must belong to a registry; orphaned components cannot be included in completeness checks
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.registryId !== null
exit 0
