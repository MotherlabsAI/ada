#!/bin/bash
# Invariant: blueprintComponentRegistry.totalComponentCount === 10
# Entity: BlueprintComponentRegistry
# Description: G2 specifies exactly 10 components; any other count means the registry is for a different blueprint or is incomplete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.totalComponentCount === 10
exit 0
