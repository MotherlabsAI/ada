#!/bin/bash
# Invariant: session.driftEvents.every(d => d !== null)
# Entity: Session
# Description: driftEvents are immutable after write — null entries indicate a write corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.driftEvents.every(d => d !== null)
exit 0
