#!/bin/bash
# Invariant: entEntityRegistration.registrationId !== null && entEntityRegistration.registrationId.length > 0
# Entity: ENTEntityRegistration
# Description: each registration must be uniquely addressable so duplicate entity extraction can be detected
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.registrationId !== null && entEntityRegistration.registrationId.length > 0
exit 0
