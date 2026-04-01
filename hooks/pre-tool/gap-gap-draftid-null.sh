#!/bin/bash
# Invariant: gap.draftId !== null
# Entity: Gap
# Description: every gap must reference its parent draft — orphaned gaps cannot be resolved against any elicitation session
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.draftId !== null
exit 0
