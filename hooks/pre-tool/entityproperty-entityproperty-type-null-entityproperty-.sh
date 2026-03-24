#!/bin/bash
# Invariant: entityProperty.type !== null && entityProperty.type.length > 0
# Entity: EntityProperty
# Description: Property type must be non-empty — without a type, the property carries no structural contract
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityProperty.type !== null && entityProperty.type.length > 0
exit 0
