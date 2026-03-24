#!/bin/bash
# Invariant: challenge.id !== null && challenge.id.length > 0
# Entity: Challenge
# Description: Challenge ID must be non-empty — it is the reference key for ClarificationAnswer resolution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: challenge.id !== null && challenge.id.length > 0
exit 0
