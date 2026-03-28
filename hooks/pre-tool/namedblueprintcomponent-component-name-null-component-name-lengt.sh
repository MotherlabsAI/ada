#!/bin/bash
# Invariant: component.name !== null && component.name.length > 0
# Entity: NamedBlueprintComponent
# Description: a nameless component cannot produce a CanonicalEntity with a meaningful label
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.name !== null && component.name.length > 0
exit 0
