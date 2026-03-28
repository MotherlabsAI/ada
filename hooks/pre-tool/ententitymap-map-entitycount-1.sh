#!/bin/bash
# Invariant: map.entityCount >= 1
# Entity: ENTEntityMap
# Description: an empty EntityMap means no entities were extracted and the ENT stage produced no output — gate cannot pass
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: map.entityCount >= 1
exit 0
