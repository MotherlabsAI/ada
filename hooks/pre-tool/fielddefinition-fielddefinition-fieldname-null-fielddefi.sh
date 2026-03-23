#!/bin/bash
# Invariant: fieldDefinition.fieldName !== null && fieldDefinition.fieldName.length > 0
# Entity: FieldDefinition
# Description: field must have a name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: fieldDefinition.fieldName !== null && fieldDefinition.fieldName.length > 0
exit 0
