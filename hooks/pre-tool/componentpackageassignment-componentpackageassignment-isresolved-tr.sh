#!/bin/bash
# Invariant: componentPackageAssignment.isResolved === true ? componentPackageAssignment.provenanceRecordPostcode !== null : true
# Entity: ComponentPackageAssignment
# Description: resolved assignments must have a provenance record — without it the assignment cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.isResolved === true ? componentPackageAssignment.provenanceRecordPostcode !== null : true
exit 0
