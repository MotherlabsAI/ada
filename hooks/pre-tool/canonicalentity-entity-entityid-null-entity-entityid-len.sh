#!/bin/bash
# Invariant: entity.entityId !== null && entity.entityId.length > 0
# Entity: CanonicalEntity
# Description: an entity without an ID cannot be keyed into the EntityMap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.entityId !== null && entity.entityId.length > 0
exit 0
