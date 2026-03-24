#!/bin/bash
# Invariant: gap.isResolved === (gap.resolvedPackage !== null)
# Entity: C3AssignmentGap
# Description: isResolved and resolvedPackage must be consistent — a gap claiming resolution with null package, or unresolved with a non-null package, is a corrupt state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === (gap.resolvedPackage !== null)
exit 0
