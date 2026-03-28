#!/bin/bash
# Invariant: gap.isResolved === false ? gap.resolvedPackage === null : true
# Entity: C3AssignmentGap
# Description: an unresolved gap must not carry a resolved package — that would be a false positive
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === false ? gap.resolvedPackage === null : true
exit 0
