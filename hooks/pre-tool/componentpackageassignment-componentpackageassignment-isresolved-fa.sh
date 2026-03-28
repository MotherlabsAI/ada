#!/bin/bash
# Invariant: componentPackageAssignment.isResolved === false || componentPackageAssignment.provenanceRecordPostcode !== null
# Entity: ComponentPackageAssignment
# Description: resolved assignments MUST have provenance; resolution without provenance is unauditable and violates G5
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.isResolved === false || componentPackageAssignment.provenanceRecordPostcode !== null
exit 0
