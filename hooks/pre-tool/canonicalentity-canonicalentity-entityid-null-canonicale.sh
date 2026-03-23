#!/bin/bash
# Invariant: canonicalEntity.entityId !== null && canonicalEntity.entityId.length > 0
# Entity: CanonicalEntity
# Description: entity must have a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: canonicalEntity.entityId !== null && canonicalEntity.entityId.length > 0
exit 0
