#!/bin/bash
# Invariant: entBlocker.linkedGapId !== null
# Entity: ENTBlocker
# Description: every blocker must link to the C3AssignmentGap that caused it; a null linkedGapId severs the causal chain between gap and blockage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.linkedGapId !== null
exit 0
