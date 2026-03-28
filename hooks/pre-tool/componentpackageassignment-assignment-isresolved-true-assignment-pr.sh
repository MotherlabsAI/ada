#!/bin/bash
# Invariant: assignment.isResolved === true ? assignment.provenanceRecordPostcode !== null : true
# Entity: ComponentPackageAssignment
# Description: a resolved assignment must carry a provenance postcode — without it the resolution is untraceable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.isResolved === true ? assignment.provenanceRecordPostcode !== null : true
exit 0
