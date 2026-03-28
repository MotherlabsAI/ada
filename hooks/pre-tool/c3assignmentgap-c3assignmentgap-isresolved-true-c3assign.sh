#!/bin/bash
# Invariant: c3AssignmentGap.isResolved === true ? c3AssignmentGap.resolutionProvenancePostcode !== null : true
# Entity: C3AssignmentGap
# Description: collapse resolution must leave a provenance postcode; without it the resolution cannot be validated in G4 provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.isResolved === true ? c3AssignmentGap.resolutionProvenancePostcode !== null : true
exit 0
