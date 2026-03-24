#!/bin/bash
# Invariant: entityMap.entities.length > 0
# Entity: EntityMap
# Description: Entity map must contain at least one entity — an empty map cannot drive synthesis or verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entities.length > 0
exit 0
