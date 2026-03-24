#!/bin/bash
# Invariant: entity.name !== null && entity.name.length > 0
# Entity: Entity
# Description: Entity name must be non-empty — it is the primary key referenced by BoundedContext and ProcessFlow
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.name !== null && entity.name.length > 0
exit 0
