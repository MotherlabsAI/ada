#!/bin/bash
# Invariant: componentPackageAssignment.componentOrdinal >= 1 && componentPackageAssignment.componentOrdinal <= 10
# Entity: ComponentPackageAssignment
# Description: ordinal must be within the valid 1-10 range of the 10-component registry
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.componentOrdinal >= 1 && componentPackageAssignment.componentOrdinal <= 10
exit 0
