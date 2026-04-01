#!/bin/bash
# Invariant: entBlocker.isCleared === true ? entBlocker.clearanceProvenancePostcode !== null : true
# Entity: ENTBlocker
# Description: clearance must be content-addressed; without a provenance postcode the clearance cannot be verified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.isCleared === true ? entBlocker.clearanceProvenancePostcode !== null : true
exit 0
