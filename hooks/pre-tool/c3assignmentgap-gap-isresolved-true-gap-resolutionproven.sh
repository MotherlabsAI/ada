#!/bin/bash
# Invariant: gap.isResolved === true ? gap.resolutionProvenancePostcode !== null : true
# Entity: C3AssignmentGap
# Description: resolution without a provenance postcode cannot be verified by the ENT gate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === true ? gap.resolutionProvenancePostcode !== null : true
exit 0
