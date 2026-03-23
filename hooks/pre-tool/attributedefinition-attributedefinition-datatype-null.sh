#!/bin/bash
# Invariant: attributeDefinition.dataType !== null
# Entity: AttributeDefinition
# Description: attribute must declare a data type
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: attributeDefinition.dataType !== null
exit 0
