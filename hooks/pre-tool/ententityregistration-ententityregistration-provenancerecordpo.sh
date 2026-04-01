#!/bin/bash
# Invariant: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
# Entity: ENTEntityRegistration
# Description: every entity registration must have a provenance record postcode — without it the 3-hop chain cannot be established
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
exit 0
