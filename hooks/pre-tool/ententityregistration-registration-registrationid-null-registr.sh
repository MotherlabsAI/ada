#!/bin/bash
# Invariant: registration.registrationId !== null && registration.registrationId.length > 0
# Entity: ENTEntityRegistration
# Description: each registration must be uniquely identifiable for auditing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.registrationId !== null && registration.registrationId.length > 0
exit 0
