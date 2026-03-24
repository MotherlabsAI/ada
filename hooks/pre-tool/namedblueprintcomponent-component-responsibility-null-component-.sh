#!/bin/bash
# Invariant: component.responsibility !== null && component.responsibility.length > 0
# Entity: NamedBlueprintComponent
# Description: responsibility is the structural rationale for the component's existence — null responsibility produces an unmappable unit
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.responsibility !== null && component.responsibility.length > 0
exit 0
