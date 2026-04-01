#!/bin/bash
# Invariant: entBlocker.blockerId !== null && entBlocker.blockerId.length > 0
# Entity: ENTBlocker
# Description: blocker must have a stable identifier for ENT gate evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.blockerId !== null && entBlocker.blockerId.length > 0
exit 0
