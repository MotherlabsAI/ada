#!/bin/bash
# Invariant: entBlocker.isCleared === false || entBlocker.clearedAt !== null
# Entity: ENTBlocker
# Description: a cleared blocker must record when it was cleared; null clearedAt on a cleared blocker is an inconsistent state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.isCleared === false || entBlocker.clearedAt !== null
exit 0
