#!/bin/bash
# Invariant: blueprintComponentRegistry.components.length === 10
# Entity: BlueprintComponentRegistry
# Description: the components array must match totalComponentCount exactly; a mismatch means the registry is internally inconsistent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.components.length === 10
exit 0
