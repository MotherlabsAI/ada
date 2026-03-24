#!/bin/bash
# Invariant: elicitationSession.startedAt > 0
# Entity: ElicitationSession
# Description: Session must have a positive start time — zero or negative timestamps indicate uninitialized state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.startedAt > 0
exit 0
