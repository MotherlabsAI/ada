#!/bin/bash
# Invariant: blueprintSchema.schemaId !== null
# Entity: BlueprintSchema
# Description: schema must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintSchema.schemaId !== null
exit 0
