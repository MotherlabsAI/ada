#!/bin/bash
# Invariant: entityMap.boundedContexts.every(bc => bc.rootEntity !== null && bc.rootEntity.length > 0)
# Entity: EntityMap
# Description: Every bounded context must have a root entity — without this, the context has no aggregate anchor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.every(bc => bc.rootEntity !== null && bc.rootEntity.length > 0)
exit 0
