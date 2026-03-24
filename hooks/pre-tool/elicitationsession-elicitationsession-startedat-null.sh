#!/bin/bash
# Invariant: elicitationSession.startedAt !== null
# Entity: ElicitationSession
# Description: Session must have a start timestamp — without this, duration and ordering cannot be established
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.startedAt !== null
exit 0
