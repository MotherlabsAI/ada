#!/bin/bash
# Invariant: c3AssignmentGap.isResolved === true || c3AssignmentGap.resolvedPackage === null
# Entity: C3AssignmentGap
# Description: an unresolved gap must not name a resolved package; premature resolution claims corrupt the blocking state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.isResolved === true || c3AssignmentGap.resolvedPackage === null
exit 0
