#!/bin/bash
# Invariant: blueprintComponent.name !== null && blueprintComponent.name.length > 0
# Entity: BlueprintComponent
# Description: Component must be named — anonymous components cannot appear in the vision document
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponent.name !== null && blueprintComponent.name.length > 0
exit 0
