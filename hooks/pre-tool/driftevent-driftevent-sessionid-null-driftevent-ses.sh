#!/bin/bash
# Invariant: driftEvent.sessionId !== null && driftEvent.sessionId.length > 0
# Entity: DriftEvent
# Description: every drift event must be attributed to a session — unattributed drift cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.sessionId !== null && driftEvent.sessionId.length > 0
exit 0
