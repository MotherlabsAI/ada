#!/bin/bash
# Invariant: boundedContext.entities.includes(boundedContext.rootEntity)
# Entity: BoundedContext
# Description: Root entity must appear in the entities list — without this the context is self-contradictory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContext.entities.includes(boundedContext.rootEntity)
exit 0
