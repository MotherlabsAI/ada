#!/bin/bash
# Invariant: namedBlueprintComponent.componentId !== null && namedBlueprintComponent.componentId.length > 0
# Entity: NamedBlueprintComponent
# Description: without a componentId no assignment, provenance chain, or entity registration can reference this component
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.componentId !== null && namedBlueprintComponent.componentId.length > 0
exit 0
