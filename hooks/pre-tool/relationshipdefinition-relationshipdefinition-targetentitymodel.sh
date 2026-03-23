#!/bin/bash
# Invariant: relationshipDefinition.targetEntityModelId !== null
# Entity: RelationshipDefinition
# Description: relationship must have a target entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: relationshipDefinition.targetEntityModelId !== null
exit 0
