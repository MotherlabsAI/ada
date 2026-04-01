#!/bin/bash
# Invariant: entEntityRegistration.targetRegistryType === 'EntityMap'
# Entity: ENTEntityRegistration
# Description: target registry type must be EntityMap — entities extracted by ENT stage go only into the EntityMap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.targetRegistryType === 'EntityMap'
exit 0
