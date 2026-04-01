#!/bin/bash
# Invariant: /* driftEvents are immutable after write */session.driftEvents.every(e => e.recordedAt > 0)
# Entity: Session
# Description: drift events are append-only immutable records — modification after write would corrupt the audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* driftEvents are immutable after write */session.driftEvents.every(e => e.recordedAt > 0)
exit 0
