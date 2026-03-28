#!/bin/bash
# Invariant: registration.provenanceRecordPostcode !== null && registration.provenanceRecordPostcode.length > 0
# Entity: ENTEntityRegistration
# Description: registration without a provenance postcode severs the three-hop chain at hop-2
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.provenanceRecordPostcode !== null && registration.provenanceRecordPostcode.length > 0
exit 0
