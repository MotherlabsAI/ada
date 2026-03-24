#!/bin/bash
# Invariant: entityMap.boundedContexts.length > 0
# Entity: EntityMap
# Description: At least one bounded context must exist — ungrouped entities have no architectural location
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.length > 0
exit 0
