#!/bin/bash
# Invariant: relationshipDefinition.sourceEntityModelId !== relationshipDefinition.targetEntityModelId
# Entity: RelationshipDefinition
# Description: self-referential relationships must be explicitly typed and are not default
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: relationshipDefinition.sourceEntityModelId !== relationshipDefinition.targetEntityModelId
exit 0
