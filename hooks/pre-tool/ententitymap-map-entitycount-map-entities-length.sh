#!/bin/bash
# Invariant: map.entityCount === map.entities.length
# Entity: ENTEntityMap
# Description: declared count must match actual entries — a mismatch means the map is corrupt
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: map.entityCount === map.entities.length
exit 0
