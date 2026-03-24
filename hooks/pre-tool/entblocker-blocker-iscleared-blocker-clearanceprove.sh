#!/bin/bash
# Invariant: blocker.isCleared === (blocker.clearanceProvenancePostcode !== null)
# Entity: ENTBlocker
# Description: clearance must produce a provenance record — clearing without a postcode breaks G9 immutable audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === (blocker.clearanceProvenancePostcode !== null)
exit 0
