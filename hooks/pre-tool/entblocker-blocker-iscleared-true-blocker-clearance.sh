#!/bin/bash
# Invariant: blocker.isCleared === true ? blocker.clearanceProvenancePostcode !== null : true
# Entity: ENTBlocker
# Description: clearance without a provenance postcode is unverifiable and cannot satisfy the ENT gate allBlockersCleared condition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === true ? blocker.clearanceProvenancePostcode !== null : true
exit 0
