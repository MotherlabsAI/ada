#!/bin/bash
# Invariant: entEntityRegistration.targetRegistryType === 'EntityMap'
# Entity: ENTEntityRegistration
# Description: registrations must target EntityMap; any other target type signals a routing error
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.targetRegistryType === 'EntityMap'
exit 0
