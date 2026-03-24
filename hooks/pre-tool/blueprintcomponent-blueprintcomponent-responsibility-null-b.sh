#!/bin/bash
# Invariant: blueprintComponent.responsibility !== null && blueprintComponent.responsibility.length > 0
# Entity: BlueprintComponent
# Description: Responsibility must be stated — a component with no responsibility has no architectural identity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponent.responsibility !== null && blueprintComponent.responsibility.length > 0
exit 0
