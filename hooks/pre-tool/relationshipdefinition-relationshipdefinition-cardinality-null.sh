#!/bin/bash
# Invariant: relationshipDefinition.cardinality !== null
# Entity: RelationshipDefinition
# Description: cardinality must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: relationshipDefinition.cardinality !== null
exit 0
