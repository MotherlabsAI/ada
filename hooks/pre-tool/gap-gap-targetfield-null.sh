#!/bin/bash
# Invariant: gap.targetField !== null
# Entity: Gap
# Description: every gap must name the draft field it concerns; a fieldless gap cannot be addressed by a clarification turn
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.targetField !== null
exit 0
