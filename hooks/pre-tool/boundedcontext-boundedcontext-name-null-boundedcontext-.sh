#!/bin/bash
# Invariant: boundedContext.name !== null && boundedContext.name.length > 0
# Entity: BoundedContext
# Description: Context name must be non-empty — it scopes all entity names within it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContext.name !== null && boundedContext.name.length > 0
exit 0
