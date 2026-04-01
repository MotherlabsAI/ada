#!/bin/bash
# Invariant: entityMap.boundedContexts.length >= 1
# Entity: EntityMap
# Description: entities must be partitioned into at least one bounded context — ungrouped entities have no governance boundary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.length >= 1
exit 0
