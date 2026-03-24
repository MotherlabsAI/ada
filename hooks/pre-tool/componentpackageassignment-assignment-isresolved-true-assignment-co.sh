#!/bin/bash
# Invariant: assignment.isResolved === true || assignment.componentOrdinal === 3
# Entity: ComponentPackageAssignment
# Description: only C3 (ordinal 3) may be unresolved — any other unresolved assignment is an unexpected gap beyond the known C3 assignment gap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.isResolved === true || assignment.componentOrdinal === 3
exit 0
