#!/bin/bash
# Invariant: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
# Entity: ENTEntityRegistration
# Description: each registration must carry a provenance postcode; without it G4 chain validation cannot include this entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
exit 0
