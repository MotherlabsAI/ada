#!/bin/bash
# Invariant: entityMap.boundedContexts.every(bc => entityMap.entities.some(e => e.name === bc.rootEntity))
# Entity: EntityMap
# Description: every bounded context root entity must exist in the entity list — a dangling root entity reference is a structural error
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.every(bc => entityMap.entities.some(e => e.name === bc.rootEntity))
exit 0
