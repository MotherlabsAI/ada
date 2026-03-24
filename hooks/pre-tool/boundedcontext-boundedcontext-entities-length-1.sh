#!/bin/bash
# Invariant: boundedContext.entities.length >= 1
# Entity: BoundedContext
# Description: A bounded context must contain at least one entity — an empty context is a structural null
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContext.entities.length >= 1
exit 0
