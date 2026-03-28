#!/bin/bash
# Invariant: entEntityRegistration.targetRegistryType === 'EntityMap'
# Entity: ENTEntityRegistration
# Description: G4 specifically targets the EntityMap; registrations pointing elsewhere do not satisfy G4
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.targetRegistryType === 'EntityMap'
exit 0
