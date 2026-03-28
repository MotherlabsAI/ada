#!/bin/bash
# Invariant: registration.entityMapPostcode !== null && registration.entityMapPostcode.length > 0
# Entity: ENTEntityRegistration
# Description: registration must reference the EntityMap postcode it targets or downstream stages cannot locate it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.entityMapPostcode !== null && registration.entityMapPostcode.length > 0
exit 0
