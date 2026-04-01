#!/bin/bash
# Invariant: session.driftEvents.every(e => e !== null)
# Entity: Session
# Description: drift events are immutable after write and must never be null entries in the array
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.driftEvents.every(e => e !== null)
exit 0
