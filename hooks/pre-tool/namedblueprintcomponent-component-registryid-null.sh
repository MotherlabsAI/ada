#!/bin/bash
# Invariant: component.registryId !== null
# Entity: NamedBlueprintComponent
# Description: a component not bound to a registry has no provenance origin
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.registryId !== null
exit 0
