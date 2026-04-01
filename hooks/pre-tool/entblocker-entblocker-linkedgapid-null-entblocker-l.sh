#!/bin/bash
# Invariant: entBlocker.linkedGapId !== null && entBlocker.linkedGapId.length > 0
# Entity: ENTBlocker
# Description: every blocker must link to the gap that caused it; an unlinked blocker cannot be resolved
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.linkedGapId !== null && entBlocker.linkedGapId.length > 0
exit 0
