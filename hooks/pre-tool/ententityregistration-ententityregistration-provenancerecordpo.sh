#!/bin/bash
# Invariant: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
# Entity: ENTEntityRegistration
# Description: G5 requires three-hop provenance; the registration itself is a hop node and must carry its own postcode
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityRegistration.provenanceRecordPostcode !== null && entEntityRegistration.provenanceRecordPostcode.length > 0
exit 0
