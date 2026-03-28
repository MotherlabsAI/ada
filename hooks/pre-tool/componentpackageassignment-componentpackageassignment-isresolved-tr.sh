#!/bin/bash
# Invariant: componentPackageAssignment.isResolved === true || componentPackageAssignment.provenanceRecordPostcode === null
# Entity: ComponentPackageAssignment
# Description: unresolved assignments must not carry provenance postcodes; a postcode on an unresolved assignment would falsely imply auditable completion
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.isResolved === true || componentPackageAssignment.provenanceRecordPostcode === null
exit 0
