#!/bin/bash
# Invariant: new Set(map.entities.map(e => e.canonicalEntityId)).size === map.entityCount
# Entity: ENTEntityMap
# Description: all entity IDs in the map must be distinct — duplicate keys corrupt the keyed map structure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(map.entities.map(e => e.canonicalEntityId)).size === map.entityCount
exit 0
