#!/bin/bash
# Invariant: blocker.isCleared === true ? blocker.clearedAt !== null : true
# Entity: ENTBlocker
# Description: a cleared blocker must record when it was cleared — untimestamped clearance cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === true ? blocker.clearedAt !== null : true
exit 0
