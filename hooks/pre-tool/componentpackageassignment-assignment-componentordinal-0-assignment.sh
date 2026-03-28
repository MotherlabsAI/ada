#!/bin/bash
# Invariant: assignment.componentOrdinal >= 0 && assignment.componentOrdinal <= 9
# Entity: ComponentPackageAssignment
# Description: ordinal must be within the 10-component range
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.componentOrdinal >= 0 && assignment.componentOrdinal <= 9
exit 0
