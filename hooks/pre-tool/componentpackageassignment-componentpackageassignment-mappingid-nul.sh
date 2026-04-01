#!/bin/bash
# Invariant: componentPackageAssignment.mappingId !== null
# Entity: ComponentPackageAssignment
# Description: assignment must belong to exactly one mapping; a null mappingId makes this assignment an orphan that cannot contribute to isTotal
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.mappingId !== null
exit 0
