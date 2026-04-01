#!/bin/bash
# Invariant: entityMap.boundedContexts.every(bc => bc.rootEntity !== null && bc.rootEntity.length > 0)
# Entity: EntityMap
# Description: every bounded context must declare exactly one root entity; a context without a root cannot be navigated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.every(bc => bc.rootEntity !== null && bc.rootEntity.length > 0)
exit 0
