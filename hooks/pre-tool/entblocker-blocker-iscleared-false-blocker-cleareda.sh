#!/bin/bash
# Invariant: blocker.isCleared === false ? blocker.clearedAt === null : true
# Entity: ENTBlocker
# Description: an uncleared blocker must not carry a clearance timestamp — that would be a false clearance record
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === false ? blocker.clearedAt === null : true
exit 0
