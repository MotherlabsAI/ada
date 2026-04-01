#!/bin/bash
# Invariant: componentPackageAssignment.componentOrdinal >= 1
# Entity: ComponentPackageAssignment
# Description: componentOrdinal must be positive — zero or negative ordinals are invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.componentOrdinal >= 1
exit 0
