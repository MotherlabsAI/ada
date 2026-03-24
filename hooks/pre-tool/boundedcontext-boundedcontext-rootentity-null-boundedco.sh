#!/bin/bash
# Invariant: boundedContext.rootEntity !== null && boundedContext.rootEntity.length > 0
# Entity: BoundedContext
# Description: Root entity must be named — without it the context has no aggregate root and cannot enforce consistency
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContext.rootEntity !== null && boundedContext.rootEntity.length > 0
exit 0
