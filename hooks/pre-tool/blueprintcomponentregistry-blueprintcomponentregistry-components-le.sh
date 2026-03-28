#!/bin/bash
# Invariant: blueprintComponentRegistry.components.length === blueprintComponentRegistry.totalComponentCount
# Entity: BlueprintComponentRegistry
# Description: the components array must match the declared count; a mismatch means the registry is partially loaded and G2 is not satisfied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.components.length === blueprintComponentRegistry.totalComponentCount
exit 0
