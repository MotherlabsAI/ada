#!/bin/bash
# Invariant: registry.components.length === 10
# Entity: BlueprintComponentRegistry
# Description: the components array must have exactly 10 entries matching the declared count
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registry.components.length === 10
exit 0
