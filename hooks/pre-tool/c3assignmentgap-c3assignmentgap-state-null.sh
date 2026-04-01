#!/bin/bash
# Invariant: c3AssignmentGap.state !== null
# Entity: C3AssignmentGap
# Description: state must be a typed C3GapState value; a null state means the gap is in an unknown condition and blocks the ENT gate evaluation required by G6
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.state !== null
exit 0
