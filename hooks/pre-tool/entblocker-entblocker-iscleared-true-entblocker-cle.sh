#!/bin/bash
# Invariant: entBlocker.isCleared === true || entBlocker.clearedAt === null
# Entity: ENTBlocker
# Description: an uncleared blocker must not have a clearedAt timestamp; this prevents premature clearance signals
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.isCleared === true || entBlocker.clearedAt === null
exit 0
