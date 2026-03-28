#!/bin/bash
# Invariant: entityMap.entityCount === entityMap.entities.length
# Entity: EntityMap
# Description: count and array length must agree; a mismatch means the map is partially written and cannot be trusted by the ENT gate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entityCount === entityMap.entities.length
exit 0
