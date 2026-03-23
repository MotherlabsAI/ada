#!/bin/bash
# Invariant: attributeDefinition.attributeName !== null && attributeDefinition.attributeName.length > 0
# Entity: AttributeDefinition
# Description: attribute must be named
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: attributeDefinition.attributeName !== null && attributeDefinition.attributeName.length > 0
exit 0
