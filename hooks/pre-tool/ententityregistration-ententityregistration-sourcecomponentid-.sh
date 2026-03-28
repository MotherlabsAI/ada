#!/bin/bash
# Invariant: entEntityRegistration.sourceComponentId !== null && entEntityRegistration.sourceComponentId.length > 0
# Entity: ENTEntityRegistration
# Description: every entity in the EntityMap must trace to a source component; orphaned registrations break G5 provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.sourceComponentId !== null && entEntityRegistration.sourceComponentId.length > 0
exit 0
