#!/bin/bash
# Invariant: namedBlueprintComponent.responsibility !== null && namedBlueprintComponent.responsibility.length > 0
# Entity: NamedBlueprintComponent
# Description: responsibility must be non-empty; a component with no stated responsibility cannot be delegated to an agent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.responsibility !== null && namedBlueprintComponent.responsibility.length > 0
exit 0
