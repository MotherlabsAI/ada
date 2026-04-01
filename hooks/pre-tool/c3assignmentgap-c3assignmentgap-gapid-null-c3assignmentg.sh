#!/bin/bash
# Invariant: c3AssignmentGap.gapId !== null && c3AssignmentGap.gapId.length > 0
# Entity: C3AssignmentGap
# Description: gap must have a stable identifier so ENTBlocker can reference it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.gapId !== null && c3AssignmentGap.gapId.length > 0
exit 0
