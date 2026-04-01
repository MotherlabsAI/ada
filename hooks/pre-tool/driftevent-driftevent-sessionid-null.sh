#!/bin/bash
# Invariant: driftEvent.sessionId !== null
# Entity: DriftEvent
# Description: every drift event must reference the session in which it was detected
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.sessionId !== null
exit 0
