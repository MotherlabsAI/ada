#!/bin/bash
# Invariant: entity.name !== null && entity.name.trim().length > 0
# Entity: Entity
# Description: entity must have a non-empty name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.name !== null && entity.name.trim().length > 0
exit 0
