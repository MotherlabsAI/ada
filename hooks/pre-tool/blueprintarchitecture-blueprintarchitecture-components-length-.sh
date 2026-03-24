#!/bin/bash
# Invariant: blueprintArchitecture.components.length > 0
# Entity: BlueprintArchitecture
# Description: At least one component must exist — an architecture with no components is structurally empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintArchitecture.components.length > 0
exit 0
