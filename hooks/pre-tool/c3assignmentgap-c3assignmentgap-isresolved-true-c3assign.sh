#!/bin/bash
# Invariant: c3AssignmentGap.isResolved === true ? c3AssignmentGap.resolutionProvenancePostcode !== null : true
# Entity: C3AssignmentGap
# Description: resolution must be accompanied by a provenance postcode to maintain the 3-hop chain integrity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.isResolved === true ? c3AssignmentGap.resolutionProvenancePostcode !== null : true
exit 0
