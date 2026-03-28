#!/bin/bash
# Invariant: namedBlueprintComponent.componentId !== null && namedBlueprintComponent.componentId.length > 0
# Entity: NamedBlueprintComponent
# Description: every component must have a stable ID so assignments, gaps, and provenance chains can reference it unambiguously
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: namedBlueprintComponent.componentId !== null && namedBlueprintComponent.componentId.length > 0
exit 0
