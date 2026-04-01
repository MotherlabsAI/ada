#!/bin/bash
# Invariant: entityMap.entities.length === entityMap.entityCount
# Entity: EntityMap
# Description: declared count must match actual registrations — a mismatch means the ENT gate is evaluating against a corrupt map, failing G6
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entities.length === entityMap.entityCount
exit 0
