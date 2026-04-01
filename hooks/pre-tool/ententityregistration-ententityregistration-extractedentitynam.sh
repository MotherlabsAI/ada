#!/bin/bash
# Invariant: entEntityRegistration.extractedEntityName !== null && entEntityRegistration.extractedEntityName.length > 0
# Entity: ENTEntityRegistration
# Description: extractedEntityName must be non-empty — unnamed entities cannot be placed in the EntityMap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.extractedEntityName !== null && entEntityRegistration.extractedEntityName.length > 0
exit 0
