#!/bin/bash
# Invariant: component.componentId !== null && component.componentId.length > 0
# Entity: NamedBlueprintComponent
# Description: a component without an ID cannot be referenced in assignments, gaps, or provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.componentId !== null && component.componentId.length > 0
exit 0
