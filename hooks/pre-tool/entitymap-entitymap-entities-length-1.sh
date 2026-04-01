#!/bin/bash
# Invariant: entityMap.entities.length >= 1
# Entity: EntityMap
# Description: an empty entity map cannot represent a domain model — at least one entity must be extracted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entities.length >= 1
exit 0
