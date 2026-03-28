#!/bin/bash
# Invariant: entBlocker.isCleared === true ? entBlocker.clearanceProvenancePostcode !== null : true
# Entity: ENTBlocker
# Description: clearance must carry a provenance postcode so G4 chain validation can include the clearance event
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.isCleared === true ? entBlocker.clearanceProvenancePostcode !== null : true
exit 0
