#!/bin/bash
# Invariant: blocker.description !== null && blocker.description.length > 0
# Entity: ENTBlocker
# Description: description is the human-readable identity of the blocker — null description produces an untriageable impediment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.description !== null && blocker.description.length > 0
exit 0
