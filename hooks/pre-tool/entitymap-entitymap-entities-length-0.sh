#!/bin/bash
# Invariant: entityMap.entities.length > 0
# Entity: EntityMap
# Description: every domain must yield at least one entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entities.length > 0
exit 0
