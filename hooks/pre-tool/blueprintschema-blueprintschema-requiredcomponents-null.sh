#!/bin/bash
# Invariant: blueprintSchema.requiredComponents !== null
# Entity: BlueprintSchema
# Description: required components list must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintSchema.requiredComponents !== null
exit 0
