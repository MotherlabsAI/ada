#!/bin/bash
# Invariant: session.driftEvents.every(e => /* immutable after write */ true)
# Entity: Session
# Description: driftEvents are immutable after write — mutation would corrupt the drift audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.driftEvents.every(e => /* immutable after write */ true)
exit 0
