#!/bin/bash
# Invariant: entEntityRegistration.registeredAt > 0
# Entity: ENTEntityRegistration
# Description: registeredAt must be positive — it timestamps the registration event in the provenance audit
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.registeredAt > 0
exit 0
