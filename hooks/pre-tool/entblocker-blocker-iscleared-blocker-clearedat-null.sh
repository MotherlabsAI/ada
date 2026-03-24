#!/bin/bash
# Invariant: blocker.isCleared === (blocker.clearedAt !== null)
# Entity: ENTBlocker
# Description: isCleared and clearedAt must be consistent — a blocker claiming clearance without a timestamp, or vice versa, is a corrupt audit state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === (blocker.clearedAt !== null)
exit 0
