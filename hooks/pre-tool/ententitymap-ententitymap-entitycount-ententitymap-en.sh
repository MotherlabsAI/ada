#!/bin/bash
# Invariant: entEntityMap.entityCount === entEntityMap.entities.length
# Entity: ENTEntityMap
# Description: declared count must match actual array length; a mismatch would allow a falsely populated count to pass the gate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityMap.entityCount === entEntityMap.entities.length
exit 0
