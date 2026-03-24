#!/bin/bash
# Invariant: entityProperty.name !== null && entityProperty.name.length > 0
# Entity: EntityProperty
# Description: Property name must be non-empty — it is referenced by invariant predicates
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityProperty.name !== null && entityProperty.name.length > 0
exit 0
